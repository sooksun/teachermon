# REST API Spec (media-api)

Base: /api/v1

## Auth (simple)
- Assume single user or token-based; keep minimal for now.

## Quota
GET /quota
Response:
{
  "limit_bytes": 1073741824,
  "usage_bytes": 123456789,
  "remaining_bytes": 949000000
}

## Jobs
POST /jobs
Body:
{
  "analysis_mode": "TEXT_ONLY" | "FULL",
  "source_type": "upload" | "gdrive" | "youtube",
  "source_payload": { ... }   // depends on source
}
Response: { "job_id": "...", "status": "UPLOADING" }

GET /jobs/{job_id}
Response includes status, progress, bytes, artifacts pointers, error.

DELETE /jobs/{job_id}
- Deletes job storage immediately and frees quota.

## Upload (source_type=upload)
POST /jobs/{job_id}/upload
multipart/form-data: file=@video.mp4
- Stream write to /data/jobs/{job_id}/raw/video.mp4
- Enforce quota during upload
Response: { "status": "UPLOADED", "raw_bytes": ... }

POST /jobs/{job_id}/process
- Enqueue job into redis queue
Response: { "queued": true }

## Google Drive (source_type=gdrive)
POST /jobs/{job_id}/gdrive/pull
Body: { "file_id": "...", "access_token": "..." }
- Stream download into raw/video.mp4 with quota enforcement
Then mark UPLOADED.

## YouTube (source_type=youtube)
POST /jobs/{job_id}/youtube/pull
Body: { "url": "https://youtube.com/watch?v=..." }
- Try captions first (if available) -> store captions as transcript_pre.json
- Download audio/video if needed (policy/config)
- Mark UPLOADED and enqueue.

## Notifications
Simplest: client polls GET /jobs/{job_id}
Optional: SSE /jobs/{job_id}/events
