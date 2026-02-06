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

const FOCUS_COMPETENCY_OPTIONS = [
  { value: 'WP.1', label: 'WP.1 - การออกแบบการจัดการเรียนรู้' },
  { value: 'WP.2', label: 'WP.2 - การจัดการเรียนรู้ที่เน้นผู้เรียนเป็นสำคัญ (Active Learning)' },
  { value: 'WP.3', label: 'WP.3 - การวัดและประเมินผล' },
  { value: 'ET.1', label: 'ET.1 - ความเป็นครู' },
  { value: 'ET.2', label: 'ET.2 - การจัดการชั้นเรียน' },
  { value: 'ET.3', label: 'ET.3 - ภาวะผู้นำทางวิชาการ' },
  { value: 'ET.4', label: 'ET.4 - การพัฒนาตนเอง' },
] as const;

const SUPPORT_TYPE_OPTIONS = [
  { value: 'COACHING', label: 'Coaching' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'MENTORING', label: 'Mentoring' },
  { value: 'WORKSHOP', label: 'Workshop' },
] as const;

const PROGRESS_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'ร่าง/กำลังวางแผน' },
  { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' },
  { value: 'COMPLETED', label: 'เสร็จสิ้น' },
  { value: 'CANCELLED', label: 'ยกเลิก' },
] as const;

export default function NewDevelopmentPlanPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    teacherId: '',
    focusCompetency: 'WP.2',
    actionPlan: '',
    supportType: 'COACHING',
    resources: '',
    budgetAllocated: '' as string,
    budgetUsed: '' as string,
    startDate: null as Dayjs | null,
    endDate: null as Dayjs | null,
    progressStatus: 'DRAFT',
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
      const response = await apiClient.post('/assessment/plans', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['development-plans'] });
      toast.success('สร้างแผนพัฒนาสำเร็จ', {
        position: 'top-right',
        autoClose: 3000,
      });
      router.push('/assessment');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างแผนพัฒนา', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      toast.error('กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด', { position: 'top-right', autoClose: 3000 });
      return;
    }
    if (!formData.teacherId) {
      toast.error('กรุณาเลือกครู', { position: 'top-right', autoClose: 3000 });
      return;
    }
    const budgetAlloc = formData.budgetAllocated ? parseFloat(formData.budgetAllocated) : undefined;
    const budgetUsedVal = formData.budgetUsed ? parseFloat(formData.budgetUsed) : undefined;
    createMutation.mutate({
      teacherId: formData.teacherId,
      focusCompetency: formData.focusCompetency,
      actionPlan: formData.actionPlan,
      supportType: formData.supportType,
      startDate: formData.startDate.toDate(),
      endDate: formData.endDate.toDate(),
      progressStatus: formData.progressStatus,
      ...(budgetAlloc != null && !Number.isNaN(budgetAlloc) && { budgetAllocated: budgetAlloc }),
      ...(budgetUsedVal != null && !Number.isNaN(budgetUsedVal) && { budgetUsed: budgetUsedVal }),
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/assessment"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← กลับไปหน้าการประเมิน
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">สร้างแผนพัฒนารายบุคคล (IDP)</h1>
          <p className="mt-1 text-sm text-gray-600">
            Individual Development Plan - วางแผนพัฒนาสมรรถนะครู
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">ข้อมูลแผนพัฒนา</h2>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* ครูที่จะพัฒนา */}
            <div>
              <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700 mb-1">
                ครูที่จะพัฒนา <span className="text-red-500">*</span>
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

            {/* สมรรถนะที่โฟกัส */}
            <div>
              <label htmlFor="focusCompetency" className="block text-sm font-medium text-gray-700 mb-1">
                สมรรถนะที่โฟกัส <span className="text-red-500">*</span>
              </label>
              <Combobox
                options={FOCUS_COMPETENCY_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
                value={formData.focusCompetency}
                onChange={(value) => setFormData((prev) => ({ ...prev, focusCompetency: value }))}
                placeholder="เลือกสมรรถนะ"
              />
            </div>

            {/* ประเภทการสนับสนุน */}
            <div>
              <label htmlFor="supportType" className="block text-sm font-medium text-gray-700 mb-1">
                ประเภทการสนับสนุน <span className="text-red-500">*</span>
              </label>
              <Combobox
                options={SUPPORT_TYPE_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
                value={formData.supportType}
                onChange={(value) => setFormData((prev) => ({ ...prev, supportType: value }))}
                placeholder="เลือกประเภท"
              />
            </div>

            {/* แผนการดำเนินงาน */}
            <div>
              <label htmlFor="actionPlan" className="block text-sm font-medium text-gray-700 mb-1">
                แผนการดำเนินงาน <span className="text-red-500">*</span>
              </label>
              <textarea
                id="actionPlan"
                name="actionPlan"
                required
                rows={6}
                value={formData.actionPlan}
                onChange={handleChange}
                placeholder="ระบุแผนการพัฒนา เช่น เข้าร่วมอบรม, ศึกษาดูงาน, ฝึกปฏิบัติ..."
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            {/* ทรัพยากรที่ต้องการ */}
            <div>
              <label htmlFor="resources" className="block text-sm font-medium text-gray-700 mb-1">
                ทรัพยากรที่ต้องการ
              </label>
              <textarea
                id="resources"
                name="resources"
                rows={3}
                value={formData.resources}
                onChange={handleChange}
                placeholder="เช่น อุปกรณ์, วิทยากร, เวลา..."
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            {/* งบประมาณ (ติดตามการใช้เงิน) */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="budgetAllocated" className="block text-sm font-medium text-gray-700 mb-1">
                  งบประมาณที่จัดสรร (บาท)
                </label>
                <input
                  type="number"
                  id="budgetAllocated"
                  name="budgetAllocated"
                  min={0}
                  step={0.01}
                  value={formData.budgetAllocated}
                  onChange={handleChange}
                  placeholder="0"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="budgetUsed" className="block text-sm font-medium text-gray-700 mb-1">
                  งบที่ใช้ไปแล้ว (บาท)
                </label>
                <input
                  type="number"
                  id="budgetUsed"
                  name="budgetUsed"
                  min={0}
                  step={0.01}
                  value={formData.budgetUsed}
                  onChange={handleChange}
                  placeholder="0"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>

            {/* วันที่เริ่มต้น & สิ้นสุด */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่เริ่มต้น <span className="text-red-500">*</span>
                </label>
                <ThaiDatePicker
                  value={formData.startDate}
                  onChange={(date) => setFormData((prev) => ({ ...prev, startDate: date }))}
                  className="w-full"
                  placeholder="เลือกวันที่เริ่มต้น"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่สิ้นสุด <span className="text-red-500">*</span>
                </label>
                <ThaiDatePicker
                  value={formData.endDate}
                  onChange={(date) => setFormData((prev) => ({ ...prev, endDate: date }))}
                  className="w-full"
                  placeholder="เลือกวันที่สิ้นสุด"
                />
              </div>
            </div>

            {/* สถานะ */}
            <div>
              <label htmlFor="progressStatus" className="block text-sm font-medium text-gray-700 mb-1">
                สถานะ <span className="text-red-500">*</span>
              </label>
              <Combobox
                options={PROGRESS_STATUS_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
                value={formData.progressStatus}
                onChange={(value) => setFormData((prev) => ({ ...prev, progressStatus: value }))}
                placeholder="เลือกสถานะ"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <Link
              href="/assessment"
              className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'กำลังบันทึก...' : 'สร้างแผนพัฒนา'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
