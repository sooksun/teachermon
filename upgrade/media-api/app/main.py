from fastapi import FastAPI, UploadFile, File, HTTPException
import os, uuid, shutil

app = FastAPI(title="media-api")

DATA_ROOT = os.getenv("DATA_ROOT", "/data/jobs")
QUOTA = int(os.getenv("QUOTA_BYTES_PER_USER", "1073741824"))

# TODO: replace with DB user/job
def get_user_usage_bytes(user_id: str) -> int:
    # placeholder: compute by scanning DATA_ROOT or from DB
    return 0

@app.get("/api/v1/quota")
def quota():
    user_id = "me"  # placeholder
    usage = get_user_usage_bytes(user_id)
    return {"limit_bytes": QUOTA, "usage_bytes": usage, "remaining_bytes": max(0, QUOTA-usage)}

@app.post("/api/v1/jobs")
def create_job(payload: dict):
    job_id = str(uuid.uuid4())
    job_dir = os.path.join(DATA_ROOT, job_id)
    os.makedirs(os.path.join(job_dir, "raw"), exist_ok=True)
    os.makedirs(os.path.join(job_dir, "artifacts"), exist_ok=True)
    return {"job_id": job_id, "status": "UPLOADING"}

@app.post("/api/v1/jobs/{job_id}/upload")
async def upload(job_id: str, file: UploadFile = File(...)):
    user_id = "me"
    usage = get_user_usage_bytes(user_id)

    # pre-check if client provides size (not always)
    incoming = file.size if hasattr(file, "size") and file.size else None
    if incoming and usage + incoming > QUOTA:
        raise HTTPException(status_code=409, detail="Quota exceeded")

    job_dir = os.path.join(DATA_ROOT, job_id, "raw")
    os.makedirs(job_dir, exist_ok=True)
    out_path = os.path.join(job_dir, "video.mp4")

    # stream write with hard-guard
    written = 0
    with open(out_path, "wb") as f:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            written += len(chunk)
            if usage + written > QUOTA:
                f.close()
                try:
                    os.remove(out_path)
                except: pass
                raise HTTPException(status_code=409, detail="Quota exceeded during upload")
            f.write(chunk)

    return {"status": "UPLOADED", "raw_path": out_path, "raw_bytes": written}
