# Project: Teaching Video Analyzer (Private, Single-User Quota)

## Goal
Build a pipeline for long video (e.g., 60 minutes) to support teacher instruction analysis with two modes:
1) TEXT_ONLY: extract audio -> ASR -> analyze transcript only
2) FULL: TEXT_ONLY + extract frames every 5 seconds -> join with transcript timeline -> analyze

## Key Policies
- Per-user quota: 1GB total usage (raw + audio + frames) across all jobs.
- No CPU fallback: if GPU ASR fails, mark FAILED and instruct user to upload again.
- FULL frames retention: keep frames for 1 year after analysis DONE, then purge frames and keep only:
  - analysis report
  - evaluation result
  - representative images (cover/thumb)

## Sources (3 ingestion types)
1) Upload video file via API
2) Google Drive file download (stream to storage)
3) YouTube URL ingestion (prefer captions; if not, download audio/video then ASR)

## Storage Layout (shared volume /data)
- /data/jobs/{job_id}/raw/video.mp4
- /data/jobs/{job_id}/audio/audio.wav (+chunks if used)
- /data/jobs/{job_id}/frames/ (FULL only)
- /data/jobs/{job_id}/artifacts/
  - transcript.json / transcript.txt / transcript.srt
  - report.json
  - evaluation.json
  - cover.jpg / thumb.jpg
  - timeline.json (join transcript <-> frames timestamps)

## System Components (Docker)
- media-api: FastAPI service (REST) + job management + quota enforcement
- redis: job queue
- postgres: job metadata storage
- asr-worker: GPU worker (uses faster-whisper / CUDA)
- vision-worker (optional): GPU/CPU worker for frame extraction (ffmpeg)

## GPU
All GPU containers must run with NVIDIA Container Toolkit and use the same CUDA-enabled host GPU.
