'use client';

import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatThaiMonthYear } from '@/lib/utils';

export default function JournalsPage() {
  const { user } = useAuth();

  const { data: journals, isLoading } = useQuery({
    queryKey: ['journals', user?.teacherId],
    queryFn: async () => {
      const params = user?.role === 'TEACHER' ? { teacherId: user.teacherId } : {};
      const response = await apiClient.get('/journals', { params });
      const result = response.data;
      // Support both paginated { data: [] } and legacy array format
      return Array.isArray(result) ? result : (result?.data ?? []);
    },
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">บันทึกการสะท้อนตนเอง</h1>
            <p className="mt-1 text-sm text-gray-600">
              บันทึกการสะท้อนตนเองรายเดือน
            </p>
          </div>
          {user?.role === 'TEACHER' && (
            <Link
              href="/journals/new"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              + เขียนบันทึกการสะท้อนตนเองใหม่
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="text-center py-12">กำลังโหลด...</div>
            ) : !journals || journals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">ยังไม่มีบันทึกการสะท้อนตนเอง</p>
              </div>
            ) : (
              <div className="space-y-6">
                {journals.map((journal: any) => (
                  <div key={journal.id} className="border-l-4 border-purple-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {formatThaiMonthYear(journal.month)}
                          </h3>
                          {user?.role !== 'TEACHER' && journal.teacher && (
                            <span className="text-sm text-gray-600">
                              โดย {journal.teacher.fullName}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-700">{journal.reflectionText}</p>
                        
                        {journal.successStory && (
                          <div className="mt-3 bg-green-50 border-l-4 border-green-400 p-3">
                            <p className="text-xs font-medium text-green-800 mb-1">
                              ความสำเร็จ
                            </p>
                            <p className="text-sm text-green-700">{journal.successStory}</p>
                          </div>
                        )}

                        {journal.difficulty && (
                          <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-3">
                            <p className="text-xs font-medium text-yellow-800 mb-1">
                              ความท้าทาย
                            </p>
                            <p className="text-sm text-yellow-700">{journal.difficulty}</p>
                          </div>
                        )}

                        {journal.supportRequest && (
                          <div className="mt-2 bg-blue-50 border-l-4 border-blue-400 p-3">
                            <p className="text-xs font-medium text-blue-800 mb-1">
                              ต้องการความช่วยเหลือ
                            </p>
                            <p className="text-sm text-blue-700">{journal.supportRequest}</p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Link
                          href={`/journals/${journal.id}`}
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
