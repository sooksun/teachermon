'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';
import dayjs, { Dayjs } from 'dayjs';

type PLCLevel = 'PROVINCIAL' | 'REGIONAL' | 'NATIONAL';
type PLCRole = 'PARTICIPANT' | 'PRESENTER' | 'FACILITATOR';

export default function NewPLCPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    teacherId: '',
    plcDate: dayjs(), // Use dayjs object
    plcLevel: 'PROVINCIAL' as PLCLevel,
    topic: '',
    role: 'PARTICIPANT' as PLCRole,
    takeaway: '',
  });

  // Fetch teachers
  const { data: teachersData, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await apiClient.get('/teachers');
      return response.data;
    },
  });

  // Extract teachers array from response
  const teachers = Array.isArray(teachersData) ? teachersData : teachersData?.data || [];

  // Create PLC mutation
  const createPLC = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/plc', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plc'] });
      router.push('/plc');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createPLC.mutate({
      teacherId: formData.teacherId,
      plcDate: formData.plcDate.toISOString(), // Convert dayjs to ISO string
      plcLevel: formData.plcLevel,
      topic: formData.topic,
      role: formData.role,
      takeaway: formData.takeaway,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        plcDate: date
      }));
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">เพิ่มกิจกรรม PLC</h1>
          <p className="mt-1 text-sm text-gray-600">
            บันทึกการเข้าร่วมกิจกรรมชุมชนแห่งการเรียนรู้ทางวิชาชีพ (Professional Learning Community)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Teacher Selection */}
          <div>
            <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700">
              เลือกครู <span className="text-red-500">*</span>
            </label>
            <select
              id="teacherId"
              name="teacherId"
              required
              value={formData.teacherId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 font-medium"
              disabled={loadingTeachers}
            >
              <option value="" className="text-gray-500">-- เลือกครู --</option>
              {teachers?.map((teacher: any) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.fullName} - {teacher.school.schoolName}
                </option>
              ))}
            </select>
          </div>

          {/* PLC Date */}
          <div>
            <label htmlFor="plcDate" className="block text-sm font-medium text-gray-700 mb-2">
              วันที่จัดกิจกรรม <span className="text-red-500">*</span>
            </label>
            <ThaiDatePicker
              value={formData.plcDate}
              onChange={handleDateChange}
              className="w-full"
              placeholder="เลือกวันที่"
            />
          </div>

          {/* PLC Level */}
          <div>
            <label htmlFor="plcLevel" className="block text-sm font-medium text-gray-700">
              ระดับ PLC <span className="text-red-500">*</span>
            </label>
            <select
              id="plcLevel"
              name="plcLevel"
              required
              value={formData.plcLevel}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 font-medium"
            >
              <option value="PROVINCIAL">ระดับจังหวัด (Provincial)</option>
              <option value="REGIONAL">ระดับภูมิภาค (Regional)</option>
              <option value="NATIONAL">ระดับประเทศ (National)</option>
            </select>
          </div>

          {/* Topic */}
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
              หัวข้อกิจกรรม <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="topic"
              name="topic"
              required
              value={formData.topic}
              onChange={handleChange}
              placeholder="เช่น การจัดการเรียนรู้แบบ Active Learning"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 font-medium placeholder:text-gray-500 placeholder:font-normal"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              บทบาท <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 font-medium"
            >
              <option value="PARTICIPANT">ผู้เข้าร่วม (Participant)</option>
              <option value="PRESENTER">วิทยากร (Presenter)</option>
              <option value="FACILITATOR">ผู้อำนวยความสะดวก (Facilitator)</option>
            </select>
          </div>

          {/* Takeaway */}
          <div>
            <label htmlFor="takeaway" className="block text-sm font-medium text-gray-700">
              สิ่งที่ได้เรียนรู้ / สิ่งที่ได้รับ
            </label>
            <textarea
              id="takeaway"
              name="takeaway"
              rows={5}
              value={formData.takeaway}
              onChange={handleChange}
              placeholder="บันทึกสิ่งที่ได้เรียนรู้จากกิจกรรมครั้งนี้..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 font-medium placeholder:text-gray-500 placeholder:font-normal"
            />
            <p className="mt-1 text-xs text-gray-500">
              ระบุสิ่งที่ได้เรียนรู้, ความรู้ที่ได้รับ, หรือแนวทางที่จะนำไปใช้
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={createPLC.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {createPLC.isPending ? 'กำลังบันทึก...' : 'บันทึกกิจกรรม PLC'}
            </button>
          </div>

          {/* Error Message */}
          {createPLC.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                เกิดข้อผิดพลาด: {(createPLC.error as any)?.message || 'ไม่สามารถบันทึกได้'}
              </p>
            </div>
          )}
        </form>
      </div>
    </MainLayout>
  );
}
