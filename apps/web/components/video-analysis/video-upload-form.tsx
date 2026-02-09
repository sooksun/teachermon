'use client';

import { useState, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface VideoUploadFormProps {
  onJobCreated: () => void;
  remainingBytes: number;
}

type SourceTab = 'UPLOAD' | 'GDRIVE' | 'YOUTUBE' | 'IMAGES';

export function VideoUploadForm({ onJobCreated, remainingBytes }: VideoUploadFormProps) {
  const [sourceTab, setSourceTab] = useState<SourceTab>('UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<'TEXT_ONLY' | 'FULL'>('TEXT_ONLY');
  const [sourceUrl, setSourceUrl] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const sourceTabs: { id: SourceTab; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'UPLOAD',
      label: 'อัพโหลดไฟล์',
      desc: 'วิดีโอ/รูปภาพจากเครื่อง',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
    {
      id: 'GDRIVE',
      label: 'Google Drive',
      desc: 'วิดีโอจาก Drive link',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.71 3.5L1.15 15l4.58 7.5h13.54l4.58-7.5L17.29 3.5H7.71zm.44 1.5h7.7L21.23 15H15.1L9.72 5h-1.57zm-1.02.58L12.5 14.5H3.27l5.86-9.42zM3.77 16h8.46l3.05 5H6.82l-3.05-5zm9.54 0h7.46l-3.05 5h-7.46l3.05-5z" />
        </svg>
      ),
    },
    {
      id: 'YOUTUBE',
      label: 'YouTube',
      desc: 'วิดีโอจาก YouTube link',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      id: 'IMAGES',
      label: 'หลายรูปภาพ',
      desc: 'อัพโหลด 3-5 รูป',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  // ─── Reset state when switching tabs ───
  const handleTabSwitch = (tab: SourceTab) => {
    setSourceTab(tab);
    setFile(null);
    setImageFiles([]);
    setSourceUrl('');
    setDescription('');
    setError(null);
    setProgress(0);
    // Auto-set mode for IMAGES
    if (tab === 'IMAGES') {
      setMode('FULL');
    }
  };

  // ─── File drop/select for single file ───
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (sourceTab === 'IMAGES') {
      const newFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/'),
      );
      handleAddImages(newFiles);
    } else {
      const f = e.dataTransfer.files[0];
      if (f) validateAndSetFile(f);
    }
  }, [sourceTab]);

  const validateAndSetFile = (f: File) => {
    setError(null);
    const maxSize = 500 * 1024 * 1024;
    if (f.size > maxSize) {
      setError('ไฟล์ขนาดเกิน 500 MB');
      return;
    }
    if (f.size > remainingBytes) {
      setError(`ไฟล์ ${(f.size / 1024 / 1024).toFixed(1)} MB เกินพื้นที่คงเหลือ ${(remainingBytes / 1024 / 1024).toFixed(1)} MB`);
      return;
    }
    const allowed = [
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      'image/jpeg', 'image/png', 'image/webp',
    ];
    if (!allowed.includes(f.type)) {
      setError('รองรับไฟล์ .mp4, .webm, .mov, .avi, .jpg, .png, .webp');
      return;
    }
    setFile(f);
  };

  // ─── Multi-image handling ───
  const handleAddImages = (newFiles: File[]) => {
    setError(null);
    const combined = [...imageFiles, ...newFiles];
    if (combined.length > 5) {
      setError('อัพโหลดได้สูงสุด 5 รูปภาพ');
      return;
    }
    const totalSize = combined.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > remainingBytes) {
      setError('ขนาดรูปภาพรวมเกินพื้นที่คงเหลือ');
      return;
    }
    const maxPerFile = 20 * 1024 * 1024; // 20 MB per image
    for (const f of newFiles) {
      if (f.size > maxPerFile) {
        setError(`รูป ${f.name} ขนาดเกิน 20 MB`);
        return;
      }
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(f.type)) {
        setError(`ไฟล์ ${f.name} ไม่ใช่รูปภาพ (รองรับ JPG, PNG, WebP, GIF)`);
        return;
      }
    }
    setImageFiles(combined);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Validate URL ───
  const isValidGDriveUrl = (url: string) => {
    return /drive\.google\.com\/(file\/d\/|open\?id=|uc\?id=)/i.test(url);
  };

  const isValidYouTubeUrl = (url: string) => {
    return /(?:youtube\.com\/(?:watch|embed|shorts)|youtu\.be)/i.test(url);
  };

  // ─── Submit ───
  const canSubmit = () => {
    if (uploading) return false;
    switch (sourceTab) {
      case 'UPLOAD':
        return !!file;
      case 'GDRIVE':
        return isValidGDriveUrl(sourceUrl);
      case 'YOUTUBE':
        return isValidYouTubeUrl(sourceUrl);
      case 'IMAGES':
        return imageFiles.length >= 1 && imageFiles.length <= 5;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      switch (sourceTab) {
        case 'UPLOAD':
          await submitFileUpload();
          break;
        case 'GDRIVE':
          await submitUrlSource('GDRIVE');
          break;
        case 'YOUTUBE':
          await submitUrlSource('YOUTUBE');
          break;
        case 'IMAGES':
          await submitMultipleImages();
          break;
      }

      // Reset form
      setFile(null);
      setImageFiles([]);
      setSourceUrl('');
      setDescription('');
      setProgress(0);
      onJobCreated();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'เกิดข้อผิดพลาด';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const submitFileUpload = async () => {
    if (!file) return;

    // 1) Create job
    const { data: job } = await apiClient.post('/video-analysis/jobs', {
      analysisMode: mode,
      sourceType: 'UPLOAD',
      originalFilename: file.name,
      description: description || undefined,
    });

    // 2) Upload file
    const formData = new FormData();
    formData.append('file', file);

    await apiClient.post(`/video-analysis/jobs/${job.id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
      onUploadProgress: (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      },
    });

    // 3) Start processing
    await apiClient.post(`/video-analysis/jobs/${job.id}/process`);
  };

  const submitUrlSource = async (type: 'GDRIVE' | 'YOUTUBE') => {
    // 1) Create job with URL
    const { data: job } = await apiClient.post('/video-analysis/jobs', {
      analysisMode: mode,
      sourceType: type,
      sourceUrl: sourceUrl,
      originalFilename: type === 'YOUTUBE' ? `YouTube Video` : `Google Drive File`,
      description: description || undefined,
    });

    setProgress(30);

    // 2) Download + Process
    await apiClient.post(`/video-analysis/jobs/${job.id}/process-url`, {}, {
      timeout: 300000,
    });

    setProgress(100);
  };

  const submitMultipleImages = async () => {
    // 1) Create job
    const { data: job } = await apiClient.post('/video-analysis/jobs', {
      analysisMode: 'FULL', // always FULL for images
      sourceType: 'IMAGES',
      originalFilename: imageFiles.map((f) => f.name).join(', '),
      description: description || undefined,
    });

    // 2) Upload images
    const formData = new FormData();
    for (const f of imageFiles) {
      formData.append('files', f);
    }

    await apiClient.post(`/video-analysis/jobs/${job.id}/upload-images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
      onUploadProgress: (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      },
    });

    // 3) Start processing
    await apiClient.post(`/video-analysis/jobs/${job.id}/process`);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">อัพโหลดชิ้นงานเพื่อวิเคราะห์</h2>

      {/* ───── Source Tabs ───── */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">เลือกแหล่งข้อมูล</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {sourceTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              className={`flex flex-col items-center py-3 px-2 rounded-lg border-2 text-xs font-medium transition-all ${
                sourceTab === tab.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className={sourceTab === tab.id ? 'text-blue-600' : 'text-gray-400'}>
                {tab.icon}
              </span>
              <span className="mt-1 font-semibold text-[11px] leading-tight text-center">{tab.label}</span>
              <span className="mt-0.5 text-[10px] opacity-60 text-center leading-tight">{tab.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ───── Analysis Mode (ไม่แสดงสำหรับ IMAGES – เป็น FULL เสมอ) ───── */}
      {sourceTab !== 'IMAGES' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">โหมดการวิเคราะห์</label>
          <div className="flex gap-3">
            <button
              onClick={() => setMode('TEXT_ONLY')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                mode === 'TEXT_ONLY'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="font-bold">TEXT_ONLY</div>
              <div className="text-xs mt-1 opacity-75">ถอดเสียง + วิเคราะห์ Transcript</div>
            </button>
            <button
              onClick={() => setMode('FULL')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                mode === 'FULL'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="font-bold">FULL</div>
              <div className="text-xs mt-1 opacity-75">ถอดเสียง + ภาพ + วิเคราะห์แบบเต็ม</div>
            </button>
          </div>
        </div>
      )}

      {/* ───── Tab Content ───── */}

      {/* Tab 1: File Upload */}
      {sourceTab === 'UPLOAD' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : file
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*,image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) validateAndSetFile(f);
            }}
          />
          {file ? (
            <div>
              <svg className="mx-auto h-10 w-10 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="mt-2 text-xs text-red-600 hover:text-red-700"
              >
                เปลี่ยนไฟล์
              </button>
            </div>
          ) : (
            <div>
              <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600">ลากไฟล์มาวาง หรือคลิกเลือก</p>
              <p className="text-xs text-gray-400 mt-1">รองรับ MP4, WebM, MOV, AVI, JPG, PNG (สูงสุด 500 MB)</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Google Drive URL */}
      {sourceTab === 'GDRIVE' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>วิธีใช้:</strong> เปิด Google Drive → คลิกขวาที่ไฟล์วิดีโอ → เลือก "แชร์" →
              ตั้งเป็น "ทุกคนที่มีลิงก์" → คัดลอกลิงก์มาวางที่นี่
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive URL</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => { setSourceUrl(e.target.value); setError(null); }}
              placeholder="https://drive.google.com/file/d/xxxxx/view"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          {sourceUrl && !isValidGDriveUrl(sourceUrl) && (
            <p className="text-xs text-red-500">กรุณาใส่ลิงก์ Google Drive ที่ถูกต้อง</p>
          )}
          {sourceUrl && isValidGDriveUrl(sourceUrl) && (
            <div className="flex items-center gap-2 text-green-600 text-xs">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ลิงก์ถูกต้อง พร้อมวิเคราะห์
            </div>
          )}
        </div>
      )}

      {/* Tab 3: YouTube URL */}
      {sourceTab === 'YOUTUBE' && (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-700">
              <strong>วิธีใช้:</strong> เปิดวิดีโอ YouTube → คัดลอก URL จาก address bar หรือกด "แชร์"
              → วาง URL ที่นี่ (รองรับวิดีโอสาธารณะและ Unlisted)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => { setSourceUrl(e.target.value); setError(null); }}
              placeholder="https://www.youtube.com/watch?v=xxxxx หรือ https://youtu.be/xxxxx"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            />
          </div>
          {sourceUrl && !isValidYouTubeUrl(sourceUrl) && (
            <p className="text-xs text-red-500">กรุณาใส่ลิงก์ YouTube ที่ถูกต้อง</p>
          )}
          {sourceUrl && isValidYouTubeUrl(sourceUrl) && (
            <div className="flex items-center gap-2 text-green-600 text-xs">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ลิงก์ถูกต้อง พร้อมวิเคราะห์
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Multiple Images */}
      {sourceTab === 'IMAGES' && (
        <div className="space-y-3">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs text-purple-700">
              <strong>อัพโหลดรูปภาพ 1-5 รูป</strong> เช่น ภาพกิจกรรมการสอน, สื่อการสอน, ผลงานนักเรียน, สไลด์ หรือหลักฐานอื่นๆ —
              AI จะวิเคราะห์รูปภาพทั้งหมดรวมกัน
            </p>
          </div>

          {/* Drop zone for images */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => imageInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-purple-400 bg-purple-50'
                : imageFiles.length > 0
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                const newFiles = Array.from(e.target.files || []);
                if (newFiles.length > 0) handleAddImages(newFiles);
                // Reset input so same files can be re-selected
                e.target.value = '';
              }}
            />
            <svg className="mx-auto h-8 w-8 text-purple-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-600">คลิกเลือก หรือลากรูปภาพมาวาง</p>
            <p className="text-xs text-gray-400 mt-1">
              รองรับ JPG, PNG, WebP, GIF (สูงสุด 20 MB/รูป, รวมไม่เกิน 5 รูป)
            </p>
          </div>

          {/* Image preview grid */}
          {imageFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                รูปภาพที่เลือก ({imageFiles.length}/5)
              </p>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {imageFiles.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      ×
                    </button>
                    <p className="text-[10px] text-gray-500 truncate mt-1 text-center">
                      {img.name}
                    </p>
                  </div>
                ))}
                {imageFiles.length < 5 && (
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-[10px] mt-1">เพิ่มรูป</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───── Description (บรรยายชิ้นงาน) ───── */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          บรรยายชิ้นงาน <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="เช่น วิดีโอการสอนวิชาคณิตศาสตร์ ป.3 เรื่องการบวกลบ, ภาพกิจกรรม PLC, สื่อการสอนภาษาอังกฤษ..."
          rows={2}
          maxLength={500}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none placeholder:text-gray-400"
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-400">ช่วยให้ AI เข้าใจบริบทและวิเคราะห์ได้แม่นยำขึ้น</p>
          <span className="text-xs text-gray-400">{description.length}/500</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>
              {sourceTab === 'GDRIVE' || sourceTab === 'YOUTUBE'
                ? 'กำลังดาวน์โหลดและวิเคราะห์...'
                : 'กำลังอัพโหลด...'}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit()}
        className="mt-4 w-full py-3 px-4 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {uploading
          ? sourceTab === 'GDRIVE' || sourceTab === 'YOUTUBE'
            ? 'กำลังประมวลผล...'
            : 'กำลังอัพโหลด...'
          : 'เริ่มวิเคราะห์'
        }
      </button>
    </div>
  );
}
