'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';
import { Combobox } from '@/components/ui/combobox';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

export default function TeacherEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const teacherId = params.id as string;

  const [formData, setFormData] = useState({
    fullName: '',
    citizenId: '',
    gender: 'MALE',
    birthDate: null as Dayjs | null,
    cohort: 1,
    appointmentDate: null as Dayjs | null,
    position: 'ครูผู้ช่วย',
    major: '',
    email: '',
    phone: '',
    status: 'ACTIVE',
  });

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: async () => {
      const response = await apiClient.get(`/teachers/${teacherId}`);
      return response.data;
    },
  });

  useEffect(() => {
    if (teacher) {
      setFormData({
        fullName: teacher.fullName || '',
        citizenId: teacher.citizenId || '',
        gender: teacher.gender || 'MALE',
        birthDate: teacher.birthDate ? dayjs(teacher.birthDate) : null,
        cohort: teacher.cohort || 1,
        appointmentDate: teacher.appointmentDate ? dayjs(teacher.appointmentDate) : null,
        position: teacher.position || 'ครูผู้ช่วย',
        major: teacher.major || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        status: teacher.status || 'ACTIVE',
      });
    }
  }, [teacher]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.put(`/teachers/${teacherId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', teacherId] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('บันทึกข้อมูลครูสำเร็จ', { position: 'top-right', autoClose: 3000 });
      router.push(`/teachers/${teacherId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.birthDate || !formData.appointmentDate) {
      toast.error('กรุณาเลือกวันที่ให้ครบถ้วน', { position: 'top-right', autoClose: 3000 });
      return;
    }
    updateMutation.mutate({
      ...formData,
      birthDate: formData.birthDate.toDate(),
      appointmentDate: formData.appointmentDate.toDate(),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12">กำลังโหลด...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link
            href={`/teachers/${teacherId}`}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            &larr; กลับไปหน้ารายละเอียด
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">แก้ไขข้อมูลครู</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">ข้อมูลส่วนตัว</h2>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="citizenId" className="block text-sm font-medium text-gray-700 mb-1">
                  เลขบัตรประชาชน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="citizenId"
                  name="citizenId"
                  required
                  maxLength={13}
                  value={formData.citizenId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  เพศ <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={[
                    { value: 'MALE', label: 'ชาย' },
                    { value: 'FEMALE', label: 'หญิง' },
                    { value: 'OTHER', label: 'อื่นๆ' },
                  ]}
                  value={formData.gender}
                  onChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                  placeholder="เลือกเพศ"
                />
              </div>

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                  วันเกิด <span className="text-red-500">*</span>
                </label>
                <ThaiDatePicker
                  value={formData.birthDate}
                  onChange={(date) => setFormData((prev) => ({ ...prev, birthDate: date }))}
                  className="w-full"
                  placeholder="เลือกวันเกิด"
                />
              </div>

              <div>
                <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">
                  วิชาเอก <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="major"
                  name="major"
                  required
                  value={formData.major}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่บรรจุ <span className="text-red-500">*</span>
                </label>
                <ThaiDatePicker
                  value={formData.appointmentDate}
                  onChange={(date) => setFormData((prev) => ({ ...prev, appointmentDate: date }))}
                  className="w-full"
                  placeholder="เลือกวันที่บรรจุ"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  อีเมล
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  เบอร์โทร
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  ตำแหน่ง
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  สถานะ <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={[
                    { value: 'ACTIVE', label: 'ปฏิบัติงาน' },
                    { value: 'ON_LEAVE', label: 'ลา' },
                    { value: 'TRANSFERRED', label: 'ย้าย' },
                    { value: 'RESIGNED', label: 'ลาออก' },
                  ]}
                  value={formData.status}
                  onChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  placeholder="เลือกสถานะ"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <Link
              href={`/teachers/${teacherId}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>

        </form>
      </div>
    </MainLayout>
  );
}
