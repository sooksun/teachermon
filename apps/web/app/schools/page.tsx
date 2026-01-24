'use client';

import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { REGIONS } from '@teachermon/shared';

export default function SchoolsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const response = await apiClient.get('/schools');
      return response.data;
    },
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">โรงเรียน</h1>
            <p className="mt-1 text-sm text-gray-600">
              โรงเรียนปลายทางในโครงการครูรัก(ษ์)ถิ่น
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="text-center py-12">กำลังโหลด...</div>
            ) : !data || data.data.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">ไม่พบข้อมูลโรงเรียน</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.data.map((school: any) => (
                  <Link
                    key={school.id}
                    href={`/schools/${school.id}`}
                    className="block p-6 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {school.schoolName}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {school.province} • {REGIONS[school.region as keyof typeof REGIONS]}
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          <span>👨‍🎓 {school.studentTotal} คน</span>
                          <span>👨‍🏫 {school._count?.teachers || 0} ครู</span>
                        </div>
                        {school.qualitySchoolFlag && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              ⭐ โรงเรียนคุณภาพชุมชน
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
