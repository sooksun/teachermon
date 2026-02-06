'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { TeacherFilters } from '@/components/teachers/teacher-filters';
import { TeacherTable } from '@/components/teachers/teacher-table';
import Link from 'next/link';

export default function TeachersPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    region: '',
    province: '',
    status: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['teachers', filters],
    queryFn: async () => {
      const response = await apiClient.get('/teachers', { params: filters });
      return response.data;
    },
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ข้อมูลครูรัก(ษ์)ถิ่น</h1>
            <p className="mt-1 text-sm text-gray-600">
              จัดการและติดตามข้อมูลครูทั้งหมด 327 คน
            </p>
          </div>
          <Link
            href="/teachers/create"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            + เพิ่มครูใหม่
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <TeacherFilters filters={filters} onFilterChange={handleFilterChange} />
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-sm text-gray-600">กำลังโหลดข้อมูล...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
              </div>
            ) : (
              <TeacherTable
                teachers={data?.data || []}
                pagination={data?.pagination}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
