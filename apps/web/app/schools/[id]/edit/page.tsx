'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Combobox } from '@/components/ui/combobox';
import { REGIONS } from '@teachermon/shared';

const REGION_OPTIONS = [
  { value: 'NORTH', label: REGIONS.NORTH },
  { value: 'NORTHEAST', label: REGIONS.NORTHEAST },
  { value: 'CENTRAL', label: REGIONS.CENTRAL },
  { value: 'SOUTH', label: REGIONS.SOUTH },
];

const SCHOOL_SIZE_OPTIONS = [
  { value: 'SMALL', label: 'เล็ก' },
  { value: 'MEDIUM', label: 'กลาง' },
  { value: 'LARGE', label: 'ใหญ่' },
];

const AREA_TYPE_OPTIONS = [
  { value: 'REMOTE', label: 'พื้นที่ห่างไกล' },
  { value: 'VERY_REMOTE', label: 'พื้นที่ห่างไกลมาก' },
  { value: 'SPECIAL', label: 'พื้นที่พิเศษ' },
];

export default function SchoolEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const schoolId = params.id as string;

  const [formData, setFormData] = useState({
    schoolName: '',
    province: '',
    region: 'CENTRAL',
    schoolSize: 'SMALL',
    areaType: 'REMOTE',
    studentTotal: 0,
    directorName: '',
    communityContext: '',
    qualitySchoolFlag: false,
  });

  const { data: school, isLoading, error } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: async () => {
      const response = await apiClient.get(`/schools/${schoolId}`);
      return response.data;
    },
  });

  useEffect(() => {
    if (school) {
      setFormData({
        schoolName: school.schoolName || '',
        province: school.province || '',
        region: school.region || 'CENTRAL',
        schoolSize: school.schoolSize || 'SMALL',
        areaType: school.areaType || 'REMOTE',
        studentTotal: school.studentTotal ?? 0,
        directorName: school.directorName || '',
        communityContext: school.communityContext || '',
        qualitySchoolFlag: school.qualitySchoolFlag ?? false,
      });
    }
  }, [school]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.put(`/schools/${schoolId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('บันทึกข้อมูลโรงเรียนสำเร็จ', { position: 'top-right', autoClose: 3000 });
      router.push(`/schools/${schoolId}`);
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
    if (!formData.schoolName.trim()) {
      toast.error('กรุณากรอกชื่อโรงเรียน', { position: 'top-right', autoClose: 3000 });
      return;
    }
    if (!formData.province.trim()) {
      toast.error('กรุณากรอกจังหวัด', { position: 'top-right', autoClose: 3000 });
      return;
    }
    if (formData.studentTotal < 0) {
      toast.error('จำนวนนักเรียนต้องไม่ติดลบ', { position: 'top-right', autoClose: 3000 });
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) || 0 : value,
    }));
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12">กำลังโหลด...</div>
      </MainLayout>
    );
  }

  if (error || !school) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-600">ไม่พบข้อมูลโรงเรียน</p>
          <Link href="/schools" className="mt-4 inline-block text-primary-600 hover:text-primary-800">
            กลับไปหน้ารายชื่อโรงเรียน
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link
            href={`/schools/${schoolId}`}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            &larr; กลับไปหน้ารายละเอียด
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">แก้ไขข้อมูลโรงเรียน</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">ข้อมูลโรงเรียน</h2>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อโรงเรียน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="schoolName"
                  name="schoolName"
                  required
                  value={formData.schoolName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="เช่น โรงเรียนบ้านพญาไพร"
                />
              </div>

              <div>
                <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                  จังหวัด <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="province"
                  name="province"
                  required
                  value={formData.province}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="เช่น เชียงราย"
                />
              </div>

              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                  ภาค <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={REGION_OPTIONS}
                  value={formData.region}
                  onChange={(value) => setFormData((prev) => ({ ...prev, region: value }))}
                  placeholder="เลือกภาค"
                />
              </div>

              <div>
                <label htmlFor="schoolSize" className="block text-sm font-medium text-gray-700 mb-1">
                  ขนาดโรงเรียน <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={SCHOOL_SIZE_OPTIONS}
                  value={formData.schoolSize}
                  onChange={(value) => setFormData((prev) => ({ ...prev, schoolSize: value }))}
                  placeholder="เลือกขนาด"
                />
              </div>

              <div>
                <label htmlFor="areaType" className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภทพื้นที่ <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={AREA_TYPE_OPTIONS}
                  value={formData.areaType}
                  onChange={(value) => setFormData((prev) => ({ ...prev, areaType: value }))}
                  placeholder="เลือกประเภทพื้นที่"
                />
              </div>

              <div>
                <label htmlFor="studentTotal" className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนนักเรียน <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="studentTotal"
                  name="studentTotal"
                  required
                  min={0}
                  value={formData.studentTotal}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="directorName" className="block text-sm font-medium text-gray-700 mb-1">
                  ผู้อำนวยการ
                </label>
                <input
                  type="text"
                  id="directorName"
                  name="directorName"
                  value={formData.directorName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="ชื่อผู้อำนวยการ"
                />
              </div>

              <div className="sm:col-span-2 flex items-center">
                <input
                  type="checkbox"
                  id="qualitySchoolFlag"
                  name="qualitySchoolFlag"
                  checked={formData.qualitySchoolFlag}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="qualitySchoolFlag" className="ml-2 text-sm text-gray-700">
                  ⭐ โรงเรียนคุณภาพชุมชน
                </label>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="communityContext" className="block text-sm font-medium text-gray-700 mb-1">
                  บริบทชุมชน
                </label>
                <textarea
                  id="communityContext"
                  name="communityContext"
                  rows={4}
                  value={formData.communityContext}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="บริบทหรือข้อมูลชุมชนรอบโรงเรียน..."
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <Link
              href={`/schools/${schoolId}`}
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
