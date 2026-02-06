'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { toast } from 'react-toastify';
import { ThaiMonthPicker } from '@/components/ui/thai-month-picker';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { AIJournalHelper } from '@/components/ai/ai-journal-helper';

export default function NewJournalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    month: dayjs() as Dayjs | null,
    reflectionText: '',
    successStory: '',
    difficulty: '',
    supportRequest: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/journals', {
        teacher: { connect: { id: user?.teacherId } },
        ...data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      toast.success('บันทึก Journal สำเร็จ', { position: 'top-right', autoClose: 3000 });
      router.push('/journals');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก Journal', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.month) {
      toast.error('กรุณาเลือกเดือน', { position: 'top-right', autoClose: 3000 });
      return;
    }
    createMutation.mutate({
      ...formData,
      month: formData.month.format('YYYY-MM'),
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/journals"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            &larr; กลับไปหน้า Journals
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">เขียนบันทึกการสะท้อนตนเอง</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">บันทึกการสะท้อนตนเอง</h2>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                เดือน <span className="text-red-500">*</span>
              </label>
              <ThaiMonthPicker
                value={formData.month}
                onChange={(date) => setFormData((prev) => ({ ...prev, month: date }))}
                className="w-full"
                placeholder="เลือกเดือน"
              />
            </div>

            <div>
              <label htmlFor="reflectionText" className="block text-sm font-medium text-gray-700 mb-1">
                การสะท้อนตนเอง <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reflectionText"
                name="reflectionText"
                required
                rows={6}
                value={formData.reflectionText}
                onChange={handleChange}
                placeholder="บันทึกสิ่งที่ได้เรียนรู้ในเดือนนี้..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              
              {/* AI Helper */}
              <div className="mt-3">
                <AIJournalHelper 
                  text={formData.reflectionText}
                  onTextImproved={(improved) => setFormData(prev => ({ ...prev, reflectionText: improved }))}
                  indicatorCode="WP.1"
                />
              </div>
            </div>

            <div>
              <label htmlFor="successStory" className="block text-sm font-medium text-gray-700 mb-1">
                เรื่องเล่าความสำเร็จ
              </label>
              <textarea
                id="successStory"
                name="successStory"
                rows={4}
                value={formData.successStory}
                onChange={handleChange}
                placeholder="สิ่งที่ทำได้ดี หรือความสำเร็จในเดือนนี้..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                ความท้าทาย/ปัญหาที่พบ
              </label>
              <textarea
                id="difficulty"
                name="difficulty"
                rows={4}
                value={formData.difficulty}
                onChange={handleChange}
                placeholder="ปัญหาหรืออุปสรรคที่เจอในเดือนนี้..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="supportRequest" className="block text-sm font-medium text-gray-700 mb-1">
                ต้องการความช่วยเหลือ
              </label>
              <textarea
                id="supportRequest"
                name="supportRequest"
                rows={4}
                value={formData.supportRequest}
                onChange={handleChange}
                placeholder="สิ่งที่ต้องการความช่วยเหลือหรือคำแนะนำ..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <Link
              href="/journals"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>

        </form>
      </div>
    </MainLayout>
  );
}
