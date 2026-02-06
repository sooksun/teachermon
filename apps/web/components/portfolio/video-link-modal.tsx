'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface VideoLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EVIDENCE_TYPES = [
  { value: 'LESSON_PLAN', label: 'แผนการสอน' },
  { value: 'CLASSROOM_PHOTO', label: 'ภาพถ่ายการสอน' },
  { value: 'STUDENT_WORK', label: 'ผลงานนักเรียน' },
  { value: 'TEACHING_MATERIAL', label: 'สื่อการสอน' },
  { value: 'ASSESSMENT_RESULT', label: 'ผลการประเมิน' },
  { value: 'CERTIFICATE', label: 'ใบประกาศนียบัตร' },
  { value: 'OTHER', label: 'อื่นๆ' },
];

const PLATFORM_EXAMPLES = [
  { name: 'YouTube', example: 'https://www.youtube.com/watch?v=xxxxx' },
  { name: 'Google Drive', example: 'https://drive.google.com/file/d/xxxxx' },
  { name: 'Vimeo', example: 'https://vimeo.com/xxxxx' },
  { name: 'Facebook', example: 'https://www.facebook.com/watch?v=xxxxx' },
];

export function VideoLinkModal({ isOpen, onClose, onSuccess }: VideoLinkModalProps) {
  const [formData, setFormData] = useState({
    videoUrl: '',
    videoTitle: '',
    videoDescription: '',
    evidenceType: 'CLASSROOM_PHOTO',
    indicatorCodes: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        indicatorCodes: data.indicatorCodes
          ? data.indicatorCodes.split(',').map((c: string) => c.trim()).filter(Boolean)
          : [],
      };
      const response = await apiClient.post('/evidence/video-link', payload);
      return response.data;
    },
    onSuccess: () => {
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'เกิดข้อผิดพลาด');
    },
  });

  const handleClose = () => {
    setFormData({
      videoUrl: '',
      videoTitle: '',
      videoDescription: '',
      evidenceType: 'CLASSROOM_PHOTO',
      indicatorCodes: '',
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">เพิ่มลิงก์วิดีโอ</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Platform Examples */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                แพลตฟอร์มที่รองรับ:
              </h3>
              <div className="space-y-1">
                {PLATFORM_EXAMPLES.map((platform) => (
                  <div key={platform.name} className="text-xs text-blue-700">
                    <span className="font-medium">{platform.name}:</span>{' '}
                    <code className="bg-blue-100 px-1 py-0.5 rounded">
                      {platform.example}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL วิดีโอ <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, videoUrl: e.target.value })
                }
                placeholder="https://www.youtube.com/watch?v=xxxxx"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>

            {/* Video Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อวิดีโอ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.videoTitle}
                onChange={(e) =>
                  setFormData({ ...formData, videoTitle: e.target.value })
                }
                placeholder="เช่น การสาธิตการสอนวิชาคณิตศาสตร์"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>

            {/* Video Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รายละเอียด
              </label>
              <textarea
                value={formData.videoDescription}
                onChange={(e) =>
                  setFormData({ ...formData, videoDescription: e.target.value })
                }
                rows={3}
                placeholder="อธิบายเนื้อหาวิดีโอ..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            {/* Evidence Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทหลักฐาน <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.evidenceType}
                onChange={(e) =>
                  setFormData({ ...formData, evidenceType: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
                {EVIDENCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Indicator Codes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสตัวชี้วัด (คั่นด้วยเครื่องหมายจุลภาค)
              </label>
              <input
                type="text"
                value={formData.indicatorCodes}
                onChange={(e) =>
                  setFormData({ ...formData, indicatorCodes: e.target.value })
                }
                placeholder="เช่น WP_1, WP_2, CM_1"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                ตัวอย่าง: WP_1, WP_2, CM_1, CE_1, PR_1
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={createMutation.isPending}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'กำลังเพิ่ม...' : '📹 เพิ่มวิดีโอ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
