'use client';

import { apiClient } from '@/lib/api-client';

interface Job {
  id: string;
  status: string;
  analysisMode: string;
  originalFilename: string | null;
  rawBytes: number;
  totalBytes: number;
  hasTranscript: boolean;
  hasFrames: boolean;
  hasReport: boolean;
  errorMessage: string | null;
  createdAt: string;
  doneAt: string | null;
}

interface JobStatusCardProps {
  job: Job;
  onSelect: (job: Job) => void;
  onDelete: (jobId: string) => void;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  UPLOADING: { label: 'กำลังอัพโหลด', color: 'text-blue-700', bg: 'bg-blue-100' },
  UPLOADED: { label: 'อัพโหลดแล้ว', color: 'text-blue-700', bg: 'bg-blue-100' },
  QUEUED: { label: 'รอคิว', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  PROCESSING_ASR: { label: 'กำลังถอดเสียง', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  ASR_DONE: { label: 'ถอดเสียงเสร็จ', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  PROCESSING_FRAMES: { label: 'กำลังแยกเฟรม', color: 'text-purple-700', bg: 'bg-purple-100' },
  ANALYZING: { label: 'กำลังวิเคราะห์ AI', color: 'text-amber-700', bg: 'bg-amber-100' },
  DONE: { label: 'เสร็จสิ้น', color: 'text-green-700', bg: 'bg-green-100' },
  FAILED: { label: 'ล้มเหลว', color: 'text-red-700', bg: 'bg-red-100' },
  REJECTED_QUOTA: { label: 'เกินโควต้า', color: 'text-red-700', bg: 'bg-red-100' },
};

const PIPELINE_STEPS = ['QUEUED', 'PROCESSING_ASR', 'ASR_DONE', 'PROCESSING_FRAMES', 'ANALYZING', 'DONE'];

function getStepIndex(status: string): number {
  const idx = PIPELINE_STEPS.indexOf(status);
  return idx >= 0 ? idx : -1;
}

export function JobStatusCard({ job, onSelect, onDelete }: JobStatusCardProps) {
  const statusInfo = STATUS_MAP[job.status] || { label: job.status, color: 'text-gray-700', bg: 'bg-gray-100' };
  const isProcessing = ['QUEUED', 'PROCESSING_ASR', 'ASR_DONE', 'PROCESSING_FRAMES', 'ANALYZING'].includes(job.status);
  const isDone = job.status === 'DONE';
  const isFailed = job.status === 'FAILED' || job.status === 'REJECTED_QUOTA';
  const stepIdx = getStepIndex(job.status);

  return (
    <div
      className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 ${
        isDone ? 'border-green-500' : isFailed ? 'border-red-500' : isProcessing ? 'border-amber-500' : 'border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {job.originalFilename || 'ไม่มีชื่อไฟล์'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
              {isProcessing && (
                <svg className="animate-spin -ml-0.5 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {statusInfo.label}
            </span>
            <span className="text-xs text-gray-400">
              {job.analysisMode === 'FULL' ? 'วิเคราะห์แบบเต็ม' : 'เฉพาะเสียง'}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
          className="text-gray-400 hover:text-red-500 ml-2"
          title="ลบ"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Pipeline progress (for active jobs) */}
      {isProcessing && (
        <div className="mb-3">
          <div className="flex items-center gap-1">
            {PIPELINE_STEPS.map((step, i) => (
              <div
                key={step}
                className={`flex-1 h-1.5 rounded-full ${
                  i <= stepIdx ? 'bg-amber-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">คิว</span>
            <span className="text-[10px] text-gray-400">เสร็จ</span>
          </div>
        </div>
      )}

      {/* Error */}
      {isFailed && job.errorMessage && (
        <div className="mb-3 p-2 bg-red-50 rounded text-xs text-red-600 line-clamp-2">
          {job.errorMessage}
        </div>
      )}

      {/* Info */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{(job.totalBytes / 1024 / 1024).toFixed(1)} MB</span>
        <span>{new Date(job.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
      </div>

      {/* Action */}
      {isDone && (
        <button
          onClick={() => onSelect(job)}
          className="mt-3 w-full py-2 px-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
        >
          ดูผลวิเคราะห์
        </button>
      )}
    </div>
  );
}
