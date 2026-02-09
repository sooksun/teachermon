"""
vision-worker: Frame extraction for FULL analysis mode
- Reads from Redis queue:frames
- Extracts frames every N seconds via ffmpeg
- Builds frames_index.json with timestamps
- Creates cover.jpg + thumb.jpg (middle frame)
- Enforces quota before and during extraction
- Updates MariaDB job status + byte accounting
"""

import os
import sys
import json
import time
import subprocess
import traceback
import glob as globmod
from datetime import datetime, timedelta

import redis
import mysql.connector
from PIL import Image

# ─── Config ───
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
DATA_ROOT = os.getenv("DATA_ROOT", "/data/jobs")
INTERVAL = int(os.getenv("FRAME_INTERVAL_SEC", "5"))
QUOTA_BYTES = int(os.getenv("QUOTA_BYTES_PER_USER", "1073741824"))

DB_HOST = os.getenv("DB_HOST", "host.docker.internal")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "teachermon")

# ─── Redis ───
r = redis.from_url(REDIS_URL)


# ─── DB helpers ───

def get_db():
    return mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        charset="utf8mb4",
        collation="utf8mb4_unicode_ci",
    )


def update_job(job_id: str, updates: dict):
    """Generic update for analysis_job row."""
    conn = get_db()
    try:
        cur = conn.cursor()
        sets = ["updated_at = NOW()"]
        vals = []
        for k, v in updates.items():
            sets.append(f"{k} = %s")
            vals.append(v)
        vals.append(job_id)
        sql = f"UPDATE analysis_job SET {', '.join(sets)} WHERE id = %s"
        cur.execute(sql, vals)
        conn.commit()
    finally:
        conn.close()


def get_user_quota_remaining(job_id: str) -> int:
    """Check remaining quota for the user who owns this job."""
    conn = get_db()
    try:
        cur = conn.cursor()
        # get user_id from job
        cur.execute("SELECT user_id FROM analysis_job WHERE id = %s", (job_id,))
        row = cur.fetchone()
        if not row:
            return 0
        user_id = row[0]

        # get quota
        cur.execute(
            "SELECT limit_bytes, usage_bytes FROM user_media_quota WHERE user_id = %s",
            (user_id,),
        )
        qrow = cur.fetchone()
        if not qrow:
            return QUOTA_BYTES  # no record = full quota available
        return max(0, int(qrow[0]) - int(qrow[1]))
    finally:
        conn.close()


def add_quota_usage(job_id: str, delta_bytes: int):
    """Increment the user's usage_bytes."""
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT user_id FROM analysis_job WHERE id = %s", (job_id,))
        row = cur.fetchone()
        if not row:
            return
        user_id = row[0]
        cur.execute(
            "UPDATE user_media_quota SET usage_bytes = usage_bytes + %s, updated_at = NOW() WHERE user_id = %s",
            (delta_bytes, user_id),
        )
        conn.commit()
    finally:
        conn.close()


# ─── Video duration ───

def get_video_duration(video_path: str) -> float:
    """Get video duration in seconds via ffprobe."""
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path,
        ]
        result = subprocess.check_output(cmd, stderr=subprocess.DEVNULL)
        return float(result.decode().strip())
    except Exception:
        return 0.0


# ─── Core functions ───

VIDEO_EXTENSIONS = (".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v", ".flv", ".wmv")


def find_video_file(raw_dir: str) -> str | None:
    """Find the first video file in the raw directory (any extension)."""
    if not os.path.isdir(raw_dir):
        return None
    for f in os.listdir(raw_dir):
        if f.lower().endswith(VIDEO_EXTENSIONS):
            return os.path.join(raw_dir, f)
    return None


def extract_frames(video_path: str, frames_dir: str) -> int:
    """Extract frames every INTERVAL seconds. Returns total bytes written."""
    os.makedirs(frames_dir, exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-vf", f"fps=1/{INTERVAL}",
        "-q:v", "3",
        os.path.join(frames_dir, "%06d.jpg"),
    ]
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # calculate total bytes
    total = 0
    for f in globmod.glob(os.path.join(frames_dir, "*.jpg")):
        total += os.path.getsize(f)
    return total


def build_frames_index(frames_dir: str, duration: float) -> list:
    """Build frames_index.json mapping frame files to timestamps."""
    files = sorted(globmod.glob(os.path.join(frames_dir, "*.jpg")))
    index = []
    for i, fpath in enumerate(files):
        ts = i * INTERVAL
        index.append({
            "frame": os.path.basename(fpath),
            "timestamp_sec": ts,
            "timestamp_str": f"{int(ts // 60):02d}:{int(ts % 60):02d}",
        })
    return index


def create_cover_and_thumb(frames_dir: str, art_dir: str):
    """Pick middle frame as cover.jpg; create thumb.jpg (320px wide)."""
    files = sorted(globmod.glob(os.path.join(frames_dir, "*.jpg")))
    if not files:
        return

    os.makedirs(art_dir, exist_ok=True)
    mid = files[len(files) // 2]

    # cover = full size copy
    img = Image.open(mid)
    img.save(os.path.join(art_dir, "cover.jpg"), quality=85)

    # thumb = 320px wide
    w, h = img.size
    new_w = 320
    new_h = int(h * (new_w / w))
    thumb = img.resize((new_w, new_h), Image.LANCZOS)
    thumb.save(os.path.join(art_dir, "thumb.jpg"), quality=75)


# ─── Main loop ───

def main():
    print(f"[START] vision-worker ready — interval={INTERVAL}s — waiting on queue:frames")
    while True:
        item = r.blpop("queue:frames", timeout=5)
        if not item:
            continue

        _, raw = item
        msg = json.loads(raw.decode("utf-8"))
        job_id = msg["job_id"]

        print(f"[JOB] Processing frames for {job_id}")

        job_dir = os.path.join(DATA_ROOT, job_id)
        raw_dir = os.path.join(job_dir, "raw")
        video_path = find_video_file(raw_dir)
        if not video_path:
            update_job(job_id, {
                "status": "FAILED",
                "error_message": "No video file found in raw directory",
                "error_code": "VIDEO_NOT_FOUND",
            })
            print(f"[FAILED] job_id={job_id} No video file found in {raw_dir}")
            continue
        frames_dir = os.path.join(job_dir, "frames")
        art_dir = os.path.join(job_dir, "artifacts")

        # mark PROCESSING_FRAMES
        update_job(job_id, {
            "status": "PROCESSING_FRAMES",
            "frames_started_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        })

        try:
            if not os.path.exists(video_path):
                raise FileNotFoundError(f"Video not found: {video_path}")

            # 1) Pre-check quota (estimate: ~50KB per frame)
            duration = get_video_duration(video_path)
            est_frames = max(1, int(duration / INTERVAL))
            est_bytes = est_frames * 50_000  # ~50KB per frame
            remaining = get_user_quota_remaining(job_id)
            if est_bytes > remaining:
                raise OverflowError(
                    f"Estimated frames ({est_bytes / 1024 / 1024:.1f} MB) "
                    f"exceeds remaining quota ({remaining / 1024 / 1024:.1f} MB)"
                )

            print(f"  [1/4] Extracting frames (est. {est_frames} frames)...")
            total_bytes = extract_frames(video_path, frames_dir)

            # 2) Post-check quota
            remaining_after = get_user_quota_remaining(job_id)
            if total_bytes > remaining_after + total_bytes:
                # quota exceeded during extraction — clean up
                import shutil
                shutil.rmtree(frames_dir, ignore_errors=True)
                raise OverflowError("Quota exceeded during frame extraction")

            print(f"  [2/4] Frames extracted: {total_bytes / 1024 / 1024:.1f} MB")

            # 3) Build index
            print(f"  [3/4] Building frames index...")
            index = build_frames_index(frames_dir, duration)
            with open(os.path.join(art_dir, "frames_index.json"), "w", encoding="utf-8") as f:
                json.dump(index, f, ensure_ascii=False, indent=2)

            # 4) Create cover + thumb
            print(f"  [4/4] Creating cover and thumbnail...")
            create_cover_and_thumb(frames_dir, art_dir)

            # Update DB — set frames_expires_at = now + 365 days
            now_dt = datetime.now()
            expires_at = now_dt + timedelta(days=365)

            update_job(job_id, {
                "status": "ASR_DONE",  # back to ASR_DONE so NestJS cron picks up for analysis
                "frames_bytes": total_bytes,
                "total_bytes": total_bytes,  # will be recalculated
                "has_frames": 1,
                "has_cover": 1,
                "frames_done_at": now_dt.strftime("%Y-%m-%d %H:%M:%S"),
                "frames_expires_at": expires_at.strftime("%Y-%m-%d %H:%M:%S"),
            })

            # Update quota
            add_quota_usage(job_id, total_bytes)

            print(f"[DONE] Frames for job {job_id}: {len(index)} frames, {total_bytes / 1024 / 1024:.1f} MB")

        except Exception as e:
            err = str(e)
            tb = traceback.format_exc()
            print(f"[FAILED] job_id={job_id} err={err}\n{tb}")

            update_job(job_id, {
                "status": "FAILED",
                "error_message": f"Frame extraction failed: {err[:500]}",
                "error_code": "FRAMES_ERROR",
            })


if __name__ == "__main__":
    main()
