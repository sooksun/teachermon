"""
asr-worker: GPU-only ASR with faster-whisper
- Reads from Redis queue:jobs
- Extracts audio via ffmpeg
- Transcribes with faster-whisper (CUDA only, NO CPU fallback)
- Writes transcript artifacts
- Updates MariaDB job status
- On FULL mode: pushes to queue:frames for vision-worker
"""

import os
import sys
import time
import json
import traceback
import subprocess
import shutil

import redis
import mysql.connector
from faster_whisper import WhisperModel

# ─── Config ───
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
DATA_ROOT = os.getenv("DATA_ROOT", "/data/jobs")
MODEL_NAME = os.getenv("MODEL_NAME", "large-v3")
COMPUTE_TYPE = os.getenv("COMPUTE_TYPE", "float16")
NO_CPU_FALLBACK = os.getenv("NO_CPU_FALLBACK", "true").lower() == "true"

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


def update_job_status(job_id: str, status: str, extra: dict = None):
    """Update analysis_job row. extra = dict of column->value pairs."""
    conn = get_db()
    try:
        cur = conn.cursor()
        sets = ["status = %s", "updated_at = NOW()"]
        vals = [status]
        if extra:
            for k, v in extra.items():
                sets.append(f"{k} = %s")
                vals.append(v)
        vals.append(job_id)
        sql = f"UPDATE analysis_job SET {', '.join(sets)} WHERE id = %s"
        cur.execute(sql, vals)
        conn.commit()
    finally:
        conn.close()


def get_job_mode(job_id: str) -> str:
    """Return analysis_mode for a job."""
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT analysis_mode FROM analysis_job WHERE id = %s", (job_id,)
        )
        row = cur.fetchone()
        return row[0] if row else "TEXT_ONLY"
    finally:
        conn.close()


# ─── GPU model init ───

print(f"[INIT] Loading model {MODEL_NAME} (compute={COMPUTE_TYPE}) on GPU...")
try:
    model = WhisperModel(MODEL_NAME, device="cuda", compute_type=COMPUTE_TYPE)
    print("[INIT] Model loaded successfully on CUDA")
except Exception as e:
    print(f"[FATAL] Cannot load model on GPU: {e}")
    if NO_CPU_FALLBACK:
        print("[FATAL] NO_CPU_FALLBACK=true — exiting. Fix GPU setup and restart.")
        sys.exit(1)
    raise


# ─── Core functions ───

def ffmpeg_extract_audio(video_path: str, audio_path: str) -> int:
    """Extract mono 16kHz WAV. Returns file size in bytes."""
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le",
        audio_path,
    ]
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return os.path.getsize(audio_path)


def transcribe(audio_path: str):
    """GPU-only transcription. Raises on any error (no CPU fallback)."""
    segments, info = model.transcribe(
        audio_path,
        language="th",
        task="transcribe",
        beam_size=10,
        best_of=10,
        vad_filter=False,
        temperature=[0.0, 0.2, 0.4],
    )
    segs = []
    for s in segments:
        segs.append({
            "start": round(float(s.start), 2),
            "end": round(float(s.end), 2),
            "text": s.text.strip(),
        })
    meta = {
        "language": info.language,
        "probability": round(info.language_probability, 4),
        "duration": round(info.duration, 2) if hasattr(info, "duration") else None,
    }
    return segs, meta


def write_artifacts(art_dir: str, segs: list, meta: dict):
    """Write transcript.json, transcript.txt, transcript.srt."""
    os.makedirs(art_dir, exist_ok=True)

    # JSON
    with open(os.path.join(art_dir, "transcript.json"), "w", encoding="utf-8") as f:
        json.dump({"segments": segs, "meta": meta}, f, ensure_ascii=False, indent=2)

    # Plain text
    with open(os.path.join(art_dir, "transcript.txt"), "w", encoding="utf-8") as f:
        for s in segs:
            f.write(f"[{s['start']:.2f}-{s['end']:.2f}] {s['text']}\n")

    # SRT
    with open(os.path.join(art_dir, "transcript.srt"), "w", encoding="utf-8") as f:
        for i, s in enumerate(segs, 1):
            start_h = int(s["start"] // 3600)
            start_m = int((s["start"] % 3600) // 60)
            start_s = int(s["start"] % 60)
            start_ms = int((s["start"] % 1) * 1000)
            end_h = int(s["end"] // 3600)
            end_m = int((s["end"] % 3600) // 60)
            end_s = int(s["end"] % 60)
            end_ms = int((s["end"] % 1) * 1000)
            f.write(f"{i}\n")
            f.write(
                f"{start_h:02d}:{start_m:02d}:{start_s:02d},{start_ms:03d}"
                f" --> "
                f"{end_h:02d}:{end_m:02d}:{end_s:02d},{end_ms:03d}\n"
            )
            f.write(f"{s['text']}\n\n")


def cleanup_on_failure(job_id: str):
    """Remove audio + frames dirs on failure to free space."""
    for subdir in ("audio", "frames"):
        d = os.path.join(DATA_ROOT, job_id, subdir)
        if os.path.isdir(d):
            shutil.rmtree(d, ignore_errors=True)


# ─── Main loop ───

def main():
    print("[START] asr-worker ready — waiting for jobs on queue:jobs")
    while True:
        item = r.blpop("queue:jobs", timeout=5)
        if not item:
            continue

        _, raw = item
        msg = json.loads(raw.decode("utf-8"))
        job_id = msg["job_id"]
        analysis_mode = msg.get("analysis_mode", "TEXT_ONLY")

        print(f"[JOB] Processing {job_id} (mode={analysis_mode})")

        job_dir = os.path.join(DATA_ROOT, job_id)
        video_path = os.path.join(job_dir, "raw", "video.mp4")
        audio_dir = os.path.join(job_dir, "audio")
        art_dir = os.path.join(job_dir, "artifacts")
        os.makedirs(audio_dir, exist_ok=True)
        os.makedirs(art_dir, exist_ok=True)

        audio_path = os.path.join(audio_dir, "audio.wav")

        # --- Mark PROCESSING_ASR ---
        update_job_status(job_id, "PROCESSING_ASR", {
            "asr_started_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        })

        try:
            # 1) Extract audio
            print(f"  [1/3] Extracting audio from {video_path}")
            audio_bytes = ffmpeg_extract_audio(video_path, audio_path)
            update_job_status(job_id, "PROCESSING_ASR", {
                "audio_bytes": audio_bytes,
                "total_bytes": audio_bytes,  # will be recalculated
            })
            print(f"  [1/3] Audio extracted: {audio_bytes / 1024 / 1024:.1f} MB")

            # 2) Transcribe (GPU only)
            print(f"  [2/3] Transcribing with {MODEL_NAME} on GPU...")
            segs, meta = transcribe(audio_path)
            print(f"  [2/3] Transcription done: {len(segs)} segments")

            # 3) Write artifacts
            print(f"  [3/3] Writing artifacts...")
            write_artifacts(art_dir, segs, meta)

            # --- Mark ASR_DONE ---
            update_job_status(job_id, "ASR_DONE", {
                "asr_done_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "has_transcript": 1,
            })

            print(f"[DONE] job_id={job_id} segments={len(segs)}")

            # 4) If FULL mode, enqueue frame extraction
            if analysis_mode == "FULL":
                frame_msg = json.dumps({"job_id": job_id})
                r.rpush("queue:frames", frame_msg)
                print(f"  [QUEUE] Pushed {job_id} to queue:frames for vision-worker")

        except Exception as e:
            # ─── FAIL FAST: no CPU fallback ───
            err = str(e)
            tb = traceback.format_exc()
            print(f"[FAILED] job_id={job_id} err={err}\n{tb}")

            cleanup_on_failure(job_id)

            update_job_status(job_id, "FAILED", {
                "error_message": f"ASR failed: {err[:500]}",
                "error_code": "ASR_GPU_ERROR",
            })


if __name__ == "__main__":
    main()
