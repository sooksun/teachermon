'use client';

import { Suspense, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';
import { Combobox } from '@/components/ui/combobox';
import type { Dayjs } from 'dayjs';

export default function CreateTeacherPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="py-12 text-center text-sm text-gray-600">
            กำลังโหลดข้อมูล...
          </div>
        </MainLayout>
      }
    >
      <CreateTeacherForm />
    </Suspense>
  );
}

function CreateTeacherForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const schoolIdFromQuery = searchParams.get('schoolId') || '';

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
    schoolId: '',
  });

  const { data: schoolsData, isLoading: loadingSchools } = useQuery({
    queryKey: ['schools-list'],
    queryFn: async () => {
      const response = await apiClient.get('/schools', { params: { limit: 1000 } });
      return response.data;
    },
  });

  const schools = Array.isArray(schoolsData) ? schoolsData : schoolsData?.data || [];

  useEffect(() => {
    if (schoolIdFromQuery && schools.length > 0 && !formData.schoolId) {
      const exists = schools.some((s: { id: string }) => s.id === schoolIdFromQuery);
      if (exists) setFormData((prev) => ({ ...prev, schoolId: schoolIdFromQuery }));
    }
  }, [schoolIdFromQuery, schools, formData.schoolId]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/teachers', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('เพิ่มข้อมูลครูสำเร็จ', { position: 'top-right', autoClose: 3000 });
      router.push(`/teachers/${data.id}`);
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

    if (!formData.birthDate || !formData.appointmentDate) {
      toast.error('กรุณาเลือกวันที่ให้ครบถ้วน', { position: 'top-right', autoClose: 3000 });
      return;
    }

    if (!formData.schoolId) {
      toast.error('กรุณาเลือกโรงเรียน', { position: 'top-right', autoClose: 3000 });
      return;
    }

    createMutation.mutate({
      ...formData,
      birthDate: formData.birthDate.toDate(),
      appointmentDate: formData.appointmentDate.toDate(),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/teachers"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            &larr; กลับไปหน้ารายชื่อครู
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">เพิ่มครูใหม่</h1>
          <p className="mt-1 text-sm text-gray-600">
            กรอกข้อมูลครูรัก(ษ์)ถิ่นเพื่อเพิ่มเข้าสู่ระบบ
          </p>
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
                  pattern="[0-9]{13}"
                  value={formData.citizenId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="1234567890123"
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
                <label htmlFor="cohort" className="block text-sm font-medium text-gray-700 mb-1">
                  รุ่นครูรัก(ษ์)ถิ่น <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="cohort"
                  name="cohort"
                  required
                  min={1}
                  value={formData.cohort}
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
                <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-1">
                  โรงเรียน <span className="text-red-500">*</span>
                </label>
                <select
                  id="schoolId"
                  name="schoolId"
                  required
                  value={formData.schoolId}
                  onChange={handleChange}
                  disabled={loadingSchools}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">-- เลือกโรงเรียน --</option>
                  {schools?.map((school: { id: string; schoolName: string; province: string }) => (
                    <option key={school.id} value={school.id}>
                      {school.schoolName} ({school.province})
                    </option>
                  ))}
                </select>
                {loadingSchools && (
                  <p className="mt-1 text-xs text-gray-500">กำลังโหลดรายการโรงเรียน...</p>
                )}
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
                  placeholder="เช่น ภาษาไทย, คณิตศาสตร์"
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
                  placeholder="เช่น ครูผู้ช่วย, ครูประจำการ"
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
                  placeholder="teacher@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="081-234-5678"
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
              href="/teachers"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending || loadingSchools}
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
