# Implementation Plan

## Phase 1: Infrastructure (Docker Compose)
- Create docker-compose.yml with:
  - postgres
  - redis
  - media-api (FastAPI)
  - asr-worker (FastAPI or worker process)
  - vision-worker (optional)
- Ensure GPU access in asr-worker (+ vision-worker if needed)

## Phase 2: Database + Quota
- DB tables: users, jobs, job_artifacts
- Quota:
  - limit_bytes = 1GB per user
  - usage_bytes = SUM(job.total_bytes) for jobs that still occupy storage
  - Enforce at:
    - pre-upload
    - streaming upload
    - after audio extraction
    - before and during frames extraction

## Phase 3: Job Lifecycle
Statuses:
- UPLOADING, UPLOADED
- PROCESSING_AUDIO, PROCESSING_ASR, PROCESSING_FRAMES, ANALYZING
- DONE, FAILED, REJECTED_QUOTA

## Phase 4: Pipelines
TEXT_ONLY pipeline:
1) Normalize/validate video
2) Extract audio wav16k mono
3) ASR (GPU) -> transcript + srt
4) Analyze transcript -> report + evaluation
5) DONE

FULL pipeline:
1-4 same as TEXT_ONLY
5) Extract frames every 5 seconds -> frames_index.json
6) Join transcript segments to nearest frames -> timeline.json
7) Analyze multimodal (basic rules first) -> report_full.json
8) Create cover/thumb
9) DONE + set frames_expires_at = done_at + 365 days

## Phase 5: Retention Worker
Daily cron/worker:
- Find jobs where NOW > frames_expires_at and frames_deleted_at is NULL
- Delete /frames folder
- Set frames_deleted_at, frames_bytes=0, recompute total_bytes
- Keep artifacts + cover/thumb

## Failure Rules
- If ASR fails (CUDA/cuBLAS/OOM/decoder): mark FAILED, cleanup audio/frames/temp, notify user to upload again.
- No CPU fallback.
