'use client';

import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';

interface PortfolioItemCardProps {
  item: any;
  onView: (item: any) => void;
  onDelete: (id: string) => void;
}

const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  LESSON_PLAN: 'แผนการสอน',
  CLASSROOM_PHOTO: 'ภาพถ่ายการสอน',
  STUDENT_WORK: 'ผลงานนักเรียน',
  TEACHING_MATERIAL: 'สื่อการสอน',
  ASSESSMENT_RESULT: 'ผลการประเมิน',
  CERTIFICATE: 'ใบประกาศนียบัตร',
  OTHER: 'อื่นๆ',
};

// Helper to normalize file path (backend returns e.g. /api/uploads/xxx.jpg)
const getFileUrl = (fileUrl: string | null | undefined): string => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // ถ้า path ขึ้นต้นด้วย / ใช้ origin + path (กัน /api ซ้ำเมื่อ apiBase จบด้วย /api)
  if (fileUrl.startsWith('/')) {
    const origin = apiBase.replace(/\/api\/?$/, '') || apiBase;
    return `${origin}${fileUrl}`;
  }
  const filename = fileUrl.split('/').pop() || fileUrl.split('\\').pop() || fileUrl;
  return `${apiBase.replace(/\/api\/?$/, '') || apiBase}/api/uploads/${filename}`;
};

// Helper to get YouTube thumbnail
const getVideoThumbnail = (videoUrl: string, platform: string): string | null => {
  if (!videoUrl) return null;
  
  if (platform === 'youtube' || videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    let videoId = '';
    if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (videoUrl.includes('youtube.com/watch')) {
      try {
        const url = new URL(videoUrl);
        videoId = url.searchParams.get('v') || '';
      } catch {
        return null;
      }
    } else if (videoUrl.includes('youtube.com/embed/')) {
      videoId = videoUrl.split('embed/')[1]?.split('?')[0] || '';
    }
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
  }
  
  return null;
};

// Helper to determine file type
const getFileType = (item: any): 'image' | 'pdf' | 'video' | 'other' => {
  if (item.itemType === 'VIDEO_LINK') return 'video';
  
  const filename = item.originalFilename || item.standardFilename || '';
  const mimeType = item.mimeType || '';
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
    return 'image';
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  if (mimeType.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
    return 'video';
  }
  return 'other';
};

export function PortfolioItemCard({ item, onView, onDelete }: PortfolioItemCardProps) {
  const { getToken } = useAuth();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileType = getFileType(item);
  const isVideo = item.itemType === 'VIDEO_LINK';

  // Fetch thumbnail for images
  const fetchThumbnail = useCallback(async () => {
    if (fileType !== 'image' || !item.fileUrl) return;
    
    const fileUrl = getFileUrl(item.fileUrl);
    if (!fileUrl) return;

    setIsLoading(true);
    try {
      const token = getToken();
      const response = await fetch(fileUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const blob = await response.blob();
        setThumbnailUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error('Error fetching thumbnail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [item.fileUrl, fileType, getToken]);

  useEffect(() => {
    if (fileType === 'image') {
      fetchThumbnail();
    } else if (isVideo) {
      const thumbnail = getVideoThumbnail(item.videoUrl, item.videoPlatform);
      if (thumbnail) {
        setThumbnailUrl(thumbnail);
      }
    }

    return () => {
      if (thumbnailUrl && !thumbnailUrl.startsWith('https://')) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [item, fileType, isVideo, fetchThumbnail]);

  const formatThaiDate = (date: string) => {
    const d = new Date(date);
    const buddhistYear = d.getFullYear() + 543;
    return format(d, 'd MMM yyyy', { locale: th }).replace(
      d.getFullYear().toString(),
      buddhistYear.toString()
    );
  };

  // Render thumbnail/preview
  const renderThumbnail = () => {
    if (isLoading) {
      return (
        <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
          <div className="animate-pulse w-10 h-10 bg-gray-200 rounded"></div>
        </div>
      );
    }

    if (thumbnailUrl) {
      return (
        <div className="w-full h-32 bg-gray-100 relative overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={item.originalFilename || item.videoTitle || 'Preview'}
            className="w-full h-full object-cover"
          />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Default icons based on file type
    return (
      <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
        {isVideo ? (
          <div className="text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            <span className="text-xs text-gray-500 mt-1">{item.videoPlatform || 'Video'}</span>
          </div>
        ) : fileType === 'pdf' ? (
          <div className="text-center">
            <svg className="w-12 h-12 text-red-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-500 mt-1">PDF</span>
          </div>
        ) : fileType === 'image' ? (
          <div className="text-center">
            <svg className="w-12 h-12 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-500 mt-1">รูปภาพ</span>
          </div>
        ) : (
          <div className="text-center">
            <svg className="w-12 h-12 text-blue-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-500 mt-1">ไฟล์</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="bg-white rounded-lg shadow hover:shadow-lg transition-all border border-gray-200 overflow-hidden cursor-pointer group"
      onClick={() => onView(item)}
    >
      {/* Thumbnail Preview */}
      <div className="relative">
        {renderThumbnail()}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-white px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 shadow-lg">
              👁️ ดูตัวอย่าง
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
            {isVideo ? item.videoTitle : item.originalFilename || item.standardFilename}
          </h3>
          <p className="text-xs text-gray-500">
            {EVIDENCE_TYPE_LABELS[item.evidenceType] || item.evidenceType}
          </p>
        </div>

        {/* File Info Tags */}
        <div className="flex items-center gap-2 mb-2">
          {isVideo ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              📹 {item.videoPlatform || 'Video'}
            </span>
          ) : (
            <>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                fileType === 'pdf' ? 'bg-red-100 text-red-800' :
                fileType === 'image' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {fileType === 'pdf' ? '📄 PDF' :
                 fileType === 'image' ? '🖼️ รูปภาพ' :
                 '📁 ไฟล์'}
              </span>
              {item.fileSize && (
                <span className="text-xs text-gray-500">
                  {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </>
          )}
        </div>

        {/* Indicators */}
        {item.indicatorCodes && item.indicatorCodes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.indicatorCodes.slice(0, 2).map((code: string) => (
              <span
                key={code}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
              >
                {code}
              </span>
            ))}
            {item.indicatorCodes.length > 2 && (
              <span className="text-xs text-gray-500">
                +{item.indicatorCodes.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {formatThaiDate(item.uploadedAt || item.createdAt)}
          </span>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onView(item)}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              ดูรายละเอียด
            </button>
            <button
              onClick={() => {
                if (confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
                  onDelete(item.id);
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
