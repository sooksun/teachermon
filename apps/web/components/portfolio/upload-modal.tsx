'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/hooks/use-auth';
import { IndicatorSelector } from './indicator-selector';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx';

const EVIDENCE_TYPES = [
  { value: 'LESSON_PLAN', label: 'แผนการสอน' },
  { value: 'CLASSROOM_PHOTO', label: 'ภาพถ่ายการสอน' },
  { value: 'STUDENT_WORK', label: 'ผลงานนักเรียน' },
  { value: 'TEACHING_MATERIAL', label: 'สื่อการสอน' },
  { value: 'ASSESSMENT_RESULT', label: 'ผลการประเมิน' },
  { value: 'CERTIFICATE', label: 'ใบประกาศนียบัตร' },
  { value: 'OTHER', label: 'อื่นๆ' },
];

function truncateName(name: string, max = 36) {
  if (name.length <= max) return name;
  const ext = name.split('.').pop() || '';
  const base = name.slice(0, name.length - ext.length - 1);
  const suffix = '….';
  return base.slice(0, Math.max(0, max - ext.length - suffix.length)) + suffix + ext;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [evidenceType, setEvidenceType] = useState('CLASSROOM_PHOTO');
  const [indicatorCodes, setIndicatorCodes] = useState<string[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [aiSuggestedIndicators, setAiSuggestedIndicators] = useState<string[]>([]);
  const [uploadedItems, setUploadedItems] = useState<any[]>([]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';
  const isTeacher = user?.role === 'TEACHER';

  // ดึงรายชื่อครูสำหรับ ADMIN
  const { data: teachersData, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: async () => {
      const response = await apiClient.get('/teachers', { params: { limit: 1000 } });
      return response.data;
    },
    enabled: isAdmin && isOpen, // ดึงเฉพาะเมื่อเป็น ADMIN และ modal เปิดอยู่
  });

  const teachers = Array.isArray(teachersData) ? teachersData : teachersData?.data || [];

  const handleClose = useCallback(() => {
    setFiles([]);
    setEvidenceType('CLASSROOM_PHOTO');
    setIndicatorCodes([]);
    setSelectedTeacherId('');
    setUploadProgress(null);
    setAiSuggestedIndicators([]);
    setUploadedItems([]);
    onClose();
  }, [onClose]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const list = Array.from(newFiles);
    const valid: File[] = [];
    const rejected: string[] = [];

    for (const f of list) {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        rejected.push(`${f.name} (เกิน ${MAX_FILE_SIZE_MB}MB)`);
        continue;
      }
      valid.push(f);
    }

    setFiles((prev) => {
      const merged = [...prev];
      for (const f of valid) {
        if (merged.length >= MAX_FILES) break;
        merged.push(f);
      }
      return merged.slice(0, MAX_FILES);
    });

    if (rejected.length) {
      toast.warning(`ข้ามไฟล์: ${rejected.join(', ')}`, { autoClose: 5000 });
    }
    if (list.length > MAX_FILES) {
      toast.info(`เลือกได้ครั้งละไม่เกิน ${MAX_FILES} ไฟล์ จึงใช้เฉพาะ ${MAX_FILES} ไฟล์แรก`, {
        autoClose: 4000,
      });
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected?.length) addFiles(selected);
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) {
      toast.error('กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์');
      return;
    }
    if (files.length > MAX_FILES) {
      toast.error(`อัปโหลดได้ครั้งละไม่เกิน ${MAX_FILES} ไฟล์`);
      return;
    }

    // ตรวจสอบ teacherId สำหรับ ADMIN
    if (isAdmin && !selectedTeacherId) {
      toast.error('กรุณาเลือกครูที่ต้องการอัปโหลดไฟล์ให้');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    let successCount = 0;
    const failed: string[] = [];
    const uploaded: any[] = [];
    const allAiSuggestions: string[] = [];

    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ current: i + 1, total: files.length });
      const formData = new FormData();
      formData.append('file', files[i]);
      formData.append('evidenceType', evidenceType);
      indicatorCodes.forEach((code) => formData.append('indicatorCodes', code));
      
      // ส่ง teacherId สำหรับ ADMIN
      if (isAdmin && selectedTeacherId) {
        formData.append('teacherId', selectedTeacherId);
      }

      try {
        const response = await apiClient.post('/evidence/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploaded.push(response.data);
        successCount += 1;

        // เก็บ AI suggestions จาก response
        if (response.data.aiSummary?.suggestedIndicators) {
          allAiSuggestions.push(...response.data.aiSummary.suggestedIndicators);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'ไม่ทราบสาเหตุ';
        failed.push(`${files[i].name}: ${msg}`);
      }
    }

    setIsUploading(false);
    setUploadProgress(null);
    setUploadedItems(uploaded);

    // แสดง AI suggestions (ถ้ามี)
    if (allAiSuggestions.length > 0) {
      const uniqueSuggestions = Array.from(new Set(allAiSuggestions));
      setAiSuggestedIndicators(uniqueSuggestions);
      toast.info(
        `AI แนะนำตัวชี้วัด: ${uniqueSuggestions.join(', ')}`,
        { autoClose: 5000 }
      );
    }

    if (failed.length) {
      toast.error(
        `อัปโหลดสำเร็จ ${successCount}/${files.length} ไฟล์ ไม่สำเร็จ: ${failed.join('; ')}`,
        { autoClose: 7000 }
      );
    } else {
      toast.success(`อัปโหลดสำเร็จ ${successCount} ไฟล์`);
    }

    // ถ้าไม่มี indicator codes ที่เลือก และมี AI suggestions ให้แสดง
    if (indicatorCodes.length === 0 && allAiSuggestions.length > 0) {
      // ไม่ปิด modal ทันที ให้ผู้ใช้เลือกตัวชี้วัดได้
      return;
    }

    if (successCount > 0) onSuccess();
    handleClose();
  };

  if (!isOpen) return null;

  const hasFiles = files.length > 0;
  const canAddMore = files.length < MAX_FILES;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">อัพโหลดไฟล์</h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center transition-colors
                ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
                ${hasFiles ? 'bg-green-50/50 border-green-400' : ''}
                ${canAddMore ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}
              `}
              onClick={() => canAddMore && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT}
                onChange={handleFileChange}
                className="hidden"
              />

              <svg
                className={`mx-auto h-10 w-10 ${hasFiles ? 'text-green-500' : 'text-gray-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-primary-600">
                  คลิกเพื่อเลือกไฟล์
                </span>{' '}
                หรือลากไฟล์มาวาง <span className="text-gray-500">(ครั้งละไม่เกิน {MAX_FILES} ไฟล์)</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                รองรับ: PDF, JPG, PNG, DOC, DOCX (ไฟล์ละสูงสุด {MAX_FILE_SIZE_MB}MB)
              </p>
              {hasFiles && (
                <p className="mt-2 text-sm font-medium text-gray-700">
                  เลือกแล้ว {files.length} ไฟล์
                  {canAddMore && ` — เพิ่มได้อีก ${MAX_FILES - files.length}`}
                </p>
              )}
            </div>

            {hasFiles && (
              <ul className="space-y-2 rounded-lg border border-gray-200 divide-y divide-gray-100 bg-gray-50/50 max-h-40 overflow-y-auto">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${f.size}-${i}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-gray-800" title={f.name}>
                      {truncateName(f.name)}
                    </span>
                    <span className="shrink-0 text-gray-500">
                      {(f.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="shrink-0 text-red-600 hover:text-red-700 px-1"
                        title="ลบออกจากรายการ"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Teacher Selection สำหรับ ADMIN */}
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกครู <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                  disabled={loadingTeachers || isUploading}
                >
                  <option value="">-- เลือกครู --</option>
                  {teachers.map((teacher: any) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.fullName} - {teacher.school?.schoolName || 'ไม่มีโรงเรียน'}
                    </option>
                  ))}
                </select>
                {loadingTeachers && (
                  <p className="mt-1 text-xs text-gray-500">กำลังโหลดรายชื่อครู...</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทหลักฐาน <span className="text-red-500">*</span>
              </label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
                {EVIDENCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <IndicatorSelector
              selectedCodes={indicatorCodes}
              onSelectionChange={setIndicatorCodes}
              aiSuggestedCodes={aiSuggestedIndicators}
              className="mb-4"
            />

            {/* AI Re-analysis Button (เมื่อเลือกตัวชี้วัดแล้ว) */}
            {indicatorCodes.length > 0 && uploadedItems.length > 0 && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-800">
                      ✨ วิเคราะห์ความเชื่อมโยงกับตัวชี้วัดที่เลือก
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      AI จะวิเคราะห์ว่าไฟล์ที่อัปโหลดเชื่อมโยงกับตัวชี้วัดที่เลือกอย่างไร
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        toast.info('กำลังวิเคราะห์ความเชื่อมโยง...', { autoClose: 2000 });
                        
                        // วิเคราะห์แต่ละไฟล์ที่อัปโหลด
                        const analyses = await Promise.all(
                          uploadedItems.map(async (item) => {
                            try {
                              const response = await apiClient.post(
                                `/evidence/${item.id}/analyze-connection`,
                                { indicatorCodes }
                              );
                              return response.data;
                            } catch (err: any) {
                              console.error(`Failed to analyze ${item.id}:`, err);
                              return null;
                            }
                          })
                        );

                        const successful = analyses.filter((a) => a !== null).length;
                        if (successful > 0) {
                          toast.success(
                            `วิเคราะห์ความเชื่อมโยงเสร็จแล้ว ${successful}/${uploadedItems.length} ไฟล์`,
                            { autoClose: 4000 }
                          );
                        } else {
                          toast.error('ไม่สามารถวิเคราะห์ความเชื่อมโยงได้', { autoClose: 3000 });
                        }
                      } catch (error: any) {
                        toast.error(
                          error?.response?.data?.message || 'เกิดข้อผิดพลาดในการวิเคราะห์',
                          { autoClose: 3000 }
                        );
                      }
                    }}
                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    วิเคราะห์
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={!hasFiles || isUploading}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading && uploadProgress
                  ? `กำลังอัพโหลด ${uploadProgress.current}/${uploadProgress.total}...`
                  : `📤 อัพโหลด${hasFiles ? ` (${files.length} ไฟล์)` : ''}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
