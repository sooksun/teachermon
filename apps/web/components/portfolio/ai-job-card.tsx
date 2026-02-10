'use client';

import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';

interface AiJobCardProps {
  job: any;
  onView: (job: any) => void;
  onDelete: (jobId: string) => void;
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  UPLOAD: 'อัพโหลดไฟล์',
  GDRIVE: 'Google Drive',
  YOUTUBE: 'YouTube',
  IMAGES: 'หลายรูปภาพ',
};

const SOURCE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  UPLOAD: { bg: 'bg-blue-100', text: 'text-blue-800' },
  GDRIVE: { bg: 'bg-green-100', text: 'text-green-800' },
  YOUTUBE: { bg: 'bg-red-100', text: 'text-red-800' },
  IMAGES: { bg: 'bg-purple-100', text: 'text-purple-800' },
};

// Helper to extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  try {
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0]?.split('/')[0] || null;
    }
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.pathname.includes('/embed/')) {
      return u.pathname.split('/embed/')[1]?.split('?')[0] || null;
    }
    if (u.hostname.includes('youtube.com') && u.searchParams.has('v')) {
      return u.searchParams.get('v');
    }
  } catch {
    return null;
  }
  return null;
}

export function AiJobCard({ job, onView, onDelete }: AiJobCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const sourceType = job.sourceType || 'UPLOAD';
  const sourceLabel = SOURCE_TYPE_LABELS[sourceType] || sourceType;
  const sourceColor = SOURCE_TYPE_COLORS[sourceType] || { bg: 'bg-gray-100', text: 'text-gray-800' };

  // Format Thai Buddhist date
  const formatThaiDate = (date: string) => {
    const d = new Date(date);
    const buddhistYear = d.getFullYear() + 543;
    return format(d, 'd MMM yyyy', { locale: th }).replace(
      d.getFullYear().toString(),
      buddhistYear.toString()
    );
  };

  // Load thumbnail based on source type
  useEffect(() => {
    setThumbnailUrl(null);
    setImgError(false);

    if (sourceType === 'YOUTUBE' && job.sourceUrl) {
      const videoId = extractYouTubeVideoId(job.sourceUrl);
      if (videoId) {
        setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
      }
      return;
    }

    if ((sourceType === 'UPLOAD' || sourceType === 'GDRIVE') && job.hasCover) {
      apiClient
        .get(`/video-analysis/jobs/${job.id}/cover`, { responseType: 'blob' })
        .then((res) => {
          const url = URL.createObjectURL(res.data);
          objectUrlRef.current = url;
          setThumbnailUrl(url);
        })
        .catch(() => {});
      return;
    }

    if (sourceType === 'IMAGES') {
      apiClient
        .get<{ files: string[] }>(`/video-analysis/jobs/${job.id}/raw-files`)
        .then((res) => {
          const files = res.data?.files;
          if (files && files.length > 0) {
            return apiClient.get(
              `/video-analysis/jobs/${job.id}/raw/${encodeURIComponent(files[0])}`,
              { responseType: 'blob' }
            );
          }
          return null;
        })
        .then((res) => {
          if (res) {
            const url = URL.createObjectURL(res.data);
            objectUrlRef.current = url;
            setThumbnailUrl(url);
          }
        })
        .catch(() => {});
      return;
    }
  }, [job.id, sourceType, job.sourceUrl, job.hasCover]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Display filename
  const displayName = job.originalFilename || 'ชิ้นงาน AI';

  // Render thumbnail
  const renderThumbnail = () => {
    // YouTube thumbnail with play button overlay
    if (sourceType === 'YOUTUBE' && thumbnailUrl && !imgError) {
      return (
        <div className="w-full h-32 bg-gray-100 relative overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        </div>
      );
    }

    // Cover image (UPLOAD/GDRIVE/IMAGES)
    if (thumbnailUrl && !imgError) {
      return (
        <div className="w-full h-32 bg-gray-100 relative overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          {/* Play button overlay for video types */}
          {(sourceType === 'UPLOAD' || sourceType === 'GDRIVE') && job.mimeType?.startsWith('video/') && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Fallback icon based on sourceType
    return (
      <div className="w-full h-32 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          {sourceType === 'YOUTUBE' ? (
            <svg className="w-12 h-12 text-red-500 mx-auto" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          ) : sourceType === 'GDRIVE' ? (
            <svg className="w-12 h-12 text-green-500 mx-auto" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.71 3.5L1.15 15l4.58 7.5h13.54l4.58-7.5L17.29 3.5H7.71zm.44 1.5h7.7L21.23 15H15.1L9.72 5h-1.57zm-1.02.58L12.5 14.5H3.27l5.86-9.42zM3.77 16h8.46l3.05 5H6.82l-3.05-5zm9.54 0h7.46l-3.05 5h-7.46l3.05-5z" />
            </svg>
          ) : sourceType === 'IMAGES' ? (
            <svg className="w-12 h-12 text-purple-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-12 h-12 text-amber-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          )}
          <span className="text-xs text-gray-500 mt-1 block">{sourceLabel}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-lg transition-all border border-gray-200 overflow-hidden cursor-pointer group"
      onClick={() => onView(job)}
    >
      {/* Thumbnail Preview */}
      <div className="relative">
        {renderThumbnail()}
        {/* AI badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI
          </span>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-white px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 shadow-lg">
              ดูผลวิเคราะห์
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
            {displayName}
          </h3>
          <p className="text-xs text-gray-500">
            AI วิเคราะห์ชิ้นงาน
          </p>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sourceColor.bg} ${sourceColor.text}`}>
            {sourceLabel}
          </span>
          {job.totalBytes > 0 && (
            <span className="text-xs text-gray-500">
              {(job.totalBytes / 1024 / 1024).toFixed(2)} MB
            </span>
          )}
        </div>

        {/* Analysis mode tag */}
        <div className="flex flex-wrap gap-1 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
            {job.analysisMode === 'FULL' ? 'วิเคราะห์เต็ม' : 'เฉพาะเสียง'}
          </span>
          {job.imageCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              {job.imageCount} รูป
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {formatThaiDate(job.doneAt || job.createdAt)}
          </span>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onView(job)}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              ดูรายละเอียด
            </button>
            <button
              onClick={() => {
                if (confirm('ต้องการลบงานวิเคราะห์นี้หรือไม่? ข้อมูลทั้งหมดจะถูกลบถาวร')) {
                  onDelete(job.id);
                }
              }}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              ลบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
