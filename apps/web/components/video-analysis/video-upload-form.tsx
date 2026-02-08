'use client';

import { useState, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface VideoUploadFormProps {
  onJobCreated: () => void;
  remainingBytes: number;
}

export function VideoUploadForm({ onJobCreated, remainingBytes }: VideoUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'TEXT_ONLY' | 'FULL'>('TEXT_ONLY');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      validateAndSetFile(f);
    }
  }, []);

  const validateAndSetFile = (f: File) => {
    setError(null);
    const maxSize = 500 * 1024 * 1024; // 500 MB
    if (f.size > maxSize) {
      setError('ไฟล์ขนาดเกิน 500 MB');
      return;
    }
    if (f.size > remainingBytes) {
      setError(`ไฟล์ ${(f.size / 1024 / 1024).toFixed(1)} MB เกินพื้นที่คงเหลือ ${(remainingBytes / 1024 / 1024).toFixed(1)} MB`);
      return;
    }
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(f.type)) {
      setError('รองรับไฟล์ .mp4, .webm, .mov, .avi, .jpg, .png, .webp');
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1) Create job
      const { data: job } = await apiClient.post('/video-analysis/jobs', {
        analysisMode: mode,
        sourceType: 'UPLOAD',
        originalFilename: file.name,
      });

      // 2) Upload file
      const formData = new FormData();
      formData.append('file', file);

      await apiClient.post(`/video-analysis/jobs/${job.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 minutes for large files
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      });

      // 3) Start processing
      await apiClient.post(`/video-analysis/jobs/${job.id}/process`);

      setFile(null);
      setProgress(0);
      onJobCreated();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'เกิดข้อผิดพลาด';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">อัพโหลดชิ้นงานเพื่อวิเคราะห์</h2>

      {/* Mode selector */}
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

      {/* Drop zone */}
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
            <span>กำลังอัพโหลด...</span>
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
        disabled={!file || uploading}
        className="mt-4 w-full py-3 px-4 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? 'กำลังอัพโหลด...' : 'เริ่มวิเคราะห์'}
      </button>
    </div>
  );
}
