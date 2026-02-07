'use client';

import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useState, useEffect, useRef } from 'react';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
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

// Helper to normalize file path
// ใช้ /uploads/ (Next.js route) แทน /api/uploads/ (NestJS) เพื่อหลีกเลี่ยง rate limit
const getFileUrl = (fileUrl: string | null | undefined): string => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const standardNameMatch = fileUrl.match(/([a-f0-9-]{36}\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx))/i);
  const filename = standardNameMatch ? standardNameMatch[1] : (fileUrl.split('/').pop() || fileUrl.split('\\').pop() || fileUrl);
  return `/uploads/${filename}`;
};

const getDisplayFilename = (item: any): string => {
  const raw = item?.originalFilename || item?.standardFilename || '';
  const hasMojibake = /à¸|Ã|à¹|àº|à»|à¼|à½/.test(raw) || (raw.length > 0 && /[\uFFFD]/.test(raw));
  if (hasMojibake && item?.fileUrl) {
    const extMatch = item.fileUrl.match(/\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i);
    const ext = extMatch ? extMatch[1] : 'ไฟล์';
    return ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif' || ext === 'webp' ? 'รูปภาพ' : `ไฟล์.${ext}`;
  }
  return raw || 'ไฟล์';
};

// Helper to get video embed URL
const getVideoEmbedUrl = (videoUrl: string, platform: string): string | null => {
  if (!videoUrl) return null;
  
  if (platform === 'youtube' || videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    let videoId = '';
    if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (videoUrl.includes('youtube.com/watch')) {
      const url = new URL(videoUrl);
      videoId = url.searchParams.get('v') || '';
    } else if (videoUrl.includes('youtube.com/embed/')) {
      videoId = videoUrl.split('embed/')[1]?.split('?')[0] || '';
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  if (platform === 'vimeo' || videoUrl.includes('vimeo.com')) {
    const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0] || '';
    if (videoId) {
      return `https://player.vimeo.com/video/${videoId}`;
    }
  }
  
  if (videoUrl.includes('drive.google.com')) {
    let fileId = '';
    if (videoUrl.includes('/file/d/')) {
      fileId = videoUrl.split('/file/d/')[1]?.split('/')[0] || '';
    } else if (videoUrl.includes('id=')) {
      fileId = videoUrl.split('id=')[1]?.split('&')[0] || '';
    }
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }
  
  return null;
};

// Helper to determine file type
const getFileType = (item: any): 'image' | 'pdf' | 'video' | 'other' => {
  if (item.itemType === 'VIDEO_LINK') return 'video';
  
  const mimeType = item.mimeType || '';
  const fromPath = item.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)?.[1]?.toLowerCase();
  const filename = item?.originalFilename || item?.standardFilename || '';
  const ext = fromPath || filename.split('.').pop()?.toLowerCase() || '';
  
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

export function DetailModal({ isOpen, onClose, item }: DetailModalProps) {
  const [fileBlobUrl, setFileBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const fileType = item ? getFileType(item) : 'other';
  const isVideoLink = item?.itemType === 'VIDEO_LINK';
  const isImage = fileType === 'image';

  // สำหรับ image ใช้ <img src> ตรงๆ ไม่ต้อง fetch
  const imageUrl = isImage && item?.fileUrl ? getFileUrl(item.fileUrl) : null;

  // สำหรับ PDF/other files ต้อง fetch เป็น blob
  const itemFileKey = item ? `${item.id}-${item.fileUrl}` : '';

  const doFetch = async () => {
    if (!item || isVideoLink || isImage) return; // image ไม่ต้อง fetch

    const fileUrl = getFileUrl(item.fileUrl);
    if (!fileUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      // ไม่ต้อง auth — ใช้ Next.js route (/uploads/) ที่เป็น public
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = blobUrl;
      setFileBlobUrl(blobUrl);
    } catch (err) {
      console.error('Error fetching file:', err);
      setError('ไม่สามารถโหลดไฟล์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && item && !isVideoLink && !isImage) {
      doFetch();
    }

    if (!isOpen) {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setFileBlobUrl(null);
      setError(null);
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, itemFileKey]);

  if (!isOpen || !item) return null;

  const formatThaiDate = (date: string) => {
    const d = new Date(date);
    const buddhistYear = d.getFullYear() + 543;
    return format(d, 'd MMMM yyyy HH:mm', { locale: th }).replace(
      d.getFullYear().toString(),
      buddhistYear.toString()
    );
  };

  const handleDownload = async () => {
    // สำหรับ image ใช้ URL ตรงๆ
    const downloadUrl = isImage ? imageUrl : fileBlobUrl;
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = getDisplayFilename(item) || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenVideo = () => {
    if (item.videoUrl) {
      window.open(item.videoUrl, '_blank');
    }
  };

  const videoEmbedUrl = isVideoLink ? getVideoEmbedUrl(item.videoUrl, item.videoPlatform) : null;

  // Render preview content based on file type
  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">กำลังโหลดไฟล์...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
          <div className="text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={doFetch}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      );
    }

    // Video link preview
    if (isVideoLink) {
      if (videoEmbedUrl) {
        return (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={videoEmbedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={item.videoTitle || 'Video'}
            />
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            <p className="text-sm text-gray-600 mb-2">ไม่สามารถแสดงตัวอย่างวิดีโอนี้ได้</p>
            <button
              onClick={handleOpenVideo}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              เปิดในหน้าต่างใหม่
            </button>
          </div>
        </div>
      );
    }

    // Image preview — ใช้ <img src> ตรงๆ (browser cache)
    if (isImage && imageUrl) {
      return (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={getDisplayFilename(item) || 'Preview'}
            className="max-w-full max-h-[60vh] object-contain"
          />
        </div>
      );
    }

    // PDF preview
    if (fileType === 'pdf' && fileBlobUrl) {
      return (
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <iframe
            src={fileBlobUrl}
            className="w-full h-[60vh]"
            title={getDisplayFilename(item) || 'PDF Preview'}
          />
        </div>
      );
    }

    // Video file preview
    if (fileType === 'video' && fileBlobUrl) {
      return (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <video
            src={fileBlobUrl}
            controls
            className="w-full h-full"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Other file types - show file info
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-gray-600 font-medium">
            {getDisplayFilename(item)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ไม่สามารถแสดงตัวอย่างไฟล์ประเภทนี้ได้
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              {isVideoLink ? (
                <svg className="w-8 h-8 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              ) : fileType === 'image' ? (
                <svg className="w-8 h-8 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              ) : fileType === 'pdf' ? (
                <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {isVideoLink ? item.videoTitle : getDisplayFilename(item)}
                </h2>
                <p className="text-sm text-gray-500">
                  {EVIDENCE_TYPE_LABELS[item.evidenceType] || item.evidenceType}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 ml-4 p-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Preview Content */}
          <div className="mb-6">
            {renderPreview()}
          </div>

          {/* File/Video Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">วันที่อัพโหลด</div>
              <div className="text-sm font-medium text-gray-900">
                {formatThaiDate(item.uploadedAt || item.createdAt)}
              </div>
            </div>
            {isVideoLink ? (
              <div>
                <div className="text-xs text-gray-500 mb-1">แพลตฟอร์ม</div>
                <div className="text-sm font-medium text-gray-900 capitalize">
                  {item.videoPlatform || 'Video'}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="text-xs text-gray-500 mb-1">ประเภทไฟล์</div>
                  <div className="text-sm font-medium text-gray-900 uppercase">
                    {item.mimeType?.split('/').pop() || item.fileType || 'FILE'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">ขนาดไฟล์</div>
                  <div className="text-sm font-medium text-gray-900">
                    {item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(2)} MB` : '-'}
                  </div>
                </div>
              </>
            )}
            {item.pdpaChecked && (
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ ตรวจสอบ PDPA แล้ว
                </span>
              </div>
            )}
          </div>

          {/* AI Summary */}
          {item.aiSummary && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">สรุปเนื้อหาโดย AI</h3>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-900">{item.aiSummary}</p>
              </div>
            </div>
          )}

          {/* Indicators */}
          {item.indicatorCodes && item.indicatorCodes.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                ตัวชี้วัด ({item.indicatorCodes.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.indicatorCodes.map((code: string) => (
                  <span
                    key={code}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ปิด
            </button>
            {isVideoLink ? (
              <button
                onClick={handleOpenVideo}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                เปิดในหน้าต่างใหม่
              </button>
            ) : (
              <button
                onClick={handleDownload}
                disabled={!imageUrl && !fileBlobUrl}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ดาวน์โหลด
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
