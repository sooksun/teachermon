'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { formatThaiDate } from '@/lib/utils';

export default function MentoringPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    visitType: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['mentoring-visits', filters],
    queryFn: async () => {
      const response = await apiClient.get('/mentoring', { params: filters });
      return response.data;
    },
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">การหนุนเสริมและลงพื้นที่</h1>
            <p className="mt-1 text-sm text-gray-600">
              บันทึกการลงพื้นที่ Lesson Study และ Coaching
            </p>
          </div>
          <Link
            href="/mentoring/new"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            + บันทึกการลงพื้นที่
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="text-center py-12">กำลังโหลด...</div>
            ) : !data || data.data.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">ยังไม่มีข้อมูลการลงพื้นที่</p>
              </div>
            ) : (
              <div className="space-y-6">
                {data.data.map((visit: any) => (
                  <div key={visit.id} className="border-l-4 border-yellow-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {visit.teacher.fullName}
                          </h3>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {visit.visitType}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {visit.teacher.school.schoolName} • {visit.teacher.school.province}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatThaiDate(visit.visitDate)} • ผู้สังเกต: {visit.observer}
                        </p>

                        {visit.strengths && (
                          <div className="mt-3 bg-green-50 border-l-4 border-green-400 p-3">
                            <p className="text-xs font-medium text-green-800 mb-1">จุดเด่น</p>
                            <p className="text-sm text-green-700">{visit.strengths}</p>
                          </div>
                        )}

                        {visit.challenges && (
                          <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-3">
                            <p className="text-xs font-medium text-yellow-800 mb-1">ความท้าทาย</p>
                            <p className="text-sm text-yellow-700">{visit.challenges}</p>
                          </div>
                        )}

                        {visit.suggestions && (
                          <div className="mt-2 bg-blue-50 border-l-4 border-blue-400 p-3">
                            <p className="text-xs font-medium text-blue-800 mb-1">ข้อเสนอแนะ</p>
                            <p className="text-sm text-blue-700">{visit.suggestions}</p>
                          </div>
                        )}

                        {visit.followUpRequired && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              ⚠️ ต้องติดตามต่อ
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Link
                          href={`/mentoring/${visit.id}`}
                          className="text-sm text-primary-600 hover:text-primary-800"
                        >
                          ดูเพิ่มเติม
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
