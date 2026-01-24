'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';
import { Combobox } from '@/components/ui/combobox';
import type { Dayjs } from 'dayjs';

const VISIT_TYPES = [
  { value: 'LESSON_STUDY', label: 'Lesson Study' },
  { value: 'COACHING', label: 'Coaching' },
  { value: 'OBSERVATION', label: 'Observation' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
] as const;

const FOCUS_AREAS = [
  { value: 'CLASSROOM', label: 'การจัดการชั้นเรียน' },
  { value: 'MANAGEMENT', label: 'การบริหารจัดการ' },
  { value: 'STUDENT_CARE', label: 'การดูแลนักเรียน' },
  { value: 'COMMUNITY', label: 'ชุมชนและผู้ปกครอง' },
  { value: 'PEDAGOGY', label: 'การสอนและวิชาการ' },
] as const;

export default function MentoringNewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    teacherId: '',
    visitDate: null as Dayjs | null,
    visitType: 'LESSON_STUDY',
    observer: '',
    focusArea: 'CLASSROOM',
    strengths: '',
    challenges: '',
    suggestions: '',
    followUpRequired: false,
  });

  // Fetch teachers for dropdown
  const { data: teachersData } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: async () => {
      const response = await apiClient.get('/teachers', { params: { limit: 1000 } });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await apiClient.post('/mentoring', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mentoring-visits'] });
      toast.success('เพิ่มข้อมูลสำเร็จ', {
        position: 'top-right',
        autoClose: 3000,
      });
      router.push(`/mentoring/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.visitDate) {
      toast.error('กรุณาเลือกวันที่ลงพื้นที่', { position: 'top-right', autoClose: 3000 });
      return;
    }
    createMutation.mutate({
      teacherId: formData.teacherId,
      visitDate: formData.visitDate.toDate(),
      visitType: formData.visitType,
      observer: formData.observer,
      focusArea: formData.focusArea,
      strengths: formData.strengths || undefined,
      challenges: formData.challenges || undefined,
      suggestions: formData.suggestions || undefined,
      followUpRequired: formData.followUpRequired,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/mentoring"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← กลับไปหน้ารายการ
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">บันทึกการลงพื้นที่ใหม่</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">ข้อมูลการลงพื้นที่</h2>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700 mb-1">
                  ครูที่รับการหนุนเสริม <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={
                    teachersData?.data?.map((teacher: any) => ({
                      value: teacher.id,
                      label: `${teacher.fullName} - ${teacher.school?.schoolName || ''}`,
                      searchText: `${teacher.fullName} ${teacher.school?.schoolName || ''}`,
                    })) || []
                  }
                  value={formData.teacherId}
                  onChange={(value) => setFormData((prev) => ({ ...prev, teacherId: value }))}
                  placeholder="-- เลือกครู --"
                  searchPlaceholder="ค้นหาชื่อครูหรือโรงเรียน..."
                  emptyText="ไม่พบครู"
                />
              </div>

              <div>
                <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่ลงพื้นที่ <span className="text-red-500">*</span>
                </label>
                <ThaiDatePicker
                  value={formData.visitDate}
                  onChange={(date) => setFormData((prev) => ({ ...prev, visitDate: date }))}
                  className="w-full"
                  placeholder="เลือกวันที่"
                />
              </div>

              <div>
                <label htmlFor="visitType" className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภทการลงพื้นที่ <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={VISIT_TYPES.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  value={formData.visitType}
                  onChange={(value) => setFormData((prev) => ({ ...prev, visitType: value }))}
                  placeholder="เลือกประเภท"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="observer" className="block text-sm font-medium text-gray-700 mb-1">
                  ผู้สังเกต / ทีมหนุนเสริม <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="observer"
                  name="observer"
                  required
                  value={formData.observer}
                  onChange={handleChange}
                  placeholder="ชื่อผู้สังเกตหรือทีมหนุนเสริม"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="focusArea" className="block text-sm font-medium text-gray-700 mb-1">
                  พื้นที่โฟกัส <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={FOCUS_AREAS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  value={formData.focusArea}
                  onChange={(value) => setFormData((prev) => ({ ...prev, focusArea: value }))}
                  placeholder="เลือกพื้นที่โฟกัส"
                />
              </div>

              <div className="sm:col-span-2 flex items-center">
                <input
                  type="checkbox"
                  id="followUpRequired"
                  name="followUpRequired"
                  checked={formData.followUpRequired}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="followUpRequired" className="ml-2 block text-sm text-gray-700">
                  ต้องติดตามต่อ
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-6">
              <div>
                <label htmlFor="strengths" className="block text-sm font-medium text-gray-700 mb-1">
                  จุดเด่น
                </label>
                <textarea
                  id="strengths"
                  name="strengths"
                  rows={4}
                  value={formData.strengths}
                  onChange={handleChange}
                  placeholder="จุดเด่นที่สังเกตได้จากการลงพื้นที่"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="challenges" className="block text-sm font-medium text-gray-700 mb-1">
                  ความท้าทาย
                </label>
                <textarea
                  id="challenges"
                  name="challenges"
                  rows={4}
                  value={formData.challenges}
                  onChange={handleChange}
                  placeholder="ความท้าทายหรือปัญหาที่พบ"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="suggestions" className="block text-sm font-medium text-gray-700 mb-1">
                  ข้อเสนอแนะ
                </label>
                <textarea
                  id="suggestions"
                  name="suggestions"
                  rows={4}
                  value={formData.suggestions}
                  onChange={handleChange}
                  placeholder="ข้อเสนอแนะสำหรับการพัฒนาต่อไป"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <Link
              href="/mentoring"
              className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
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
