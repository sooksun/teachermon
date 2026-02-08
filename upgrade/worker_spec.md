# Workers Spec

## Queue
Redis queue with messages:
{ "job_id": "...", "analysis_mode": "TEXT_ONLY|FULL" }

## asr-worker Responsibilities (GPU)
Input: /data/jobs/{job_id}/raw/video.mp4
Steps:
1) Validate with ffprobe (duration, streams)
2) Extract audio:
   ffmpeg -y -i video.mp4 -ac 1 -ar 16000 -c:a pcm_s16le audio.wav
3) Update DB audio_bytes
4) ASR using faster-whisper (CUDA):
   - If any GPU error => FAIL job (no CPU fallback)
5) Write artifacts:
   - transcript.json (segments with start/end/text)
   - transcript.txt
   - transcript.srt
6) Update DB status: ASR_DONE

## vision-worker Responsibilities (frames every 5 sec)
Only if analysis_mode=FULL
Input: raw/video.mp4
Steps:
1) Estimate frames bytes (optional) and check quota
2) Extract frames:
   ffmpeg -i video.mp4 -vf fps=1/5 -q:v 3 frames/%06d.jpg
3) Build frames_index.json with timestamps (best: use -frame_pts or parse via ffprobe)
4) Update DB frames_bytes

## analysis step (can be part of media-api or a separate worker)
- TEXT_ONLY: compute simple indicators from transcript
- FULL: join transcript with frames -> timeline.json then compute indicators
Artifacts:
- report.json
- evaluation.json
- cover.jpg/thumb.jpg (choose middle frame or best activity frame)

## Retention worker (daily)
- If now > frames_expires_at:
  - delete frames folder
  - update DB frames_deleted_at, frames_bytes=0, total_bytes recalculated
