'use client';

import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { formatThaiDate } from '@/lib/utils';

export default function PLCPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['plc-activities'],
    queryFn: async () => {
      const response = await apiClient.get('/plc');
      return response.data;
    },
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PLC Activities</h1>
            <p className="mt-1 text-sm text-gray-600">
              Professional Learning Community - ชุมชนการเรียนรู้ทางวิชาชีพ
            </p>
          </div>
          <Link
            href="/plc/new"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            + บันทึกกิจกรรม PLC
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="text-center py-12">กำลังโหลด...</div>
            ) : !data || data.data.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">ยังไม่มีข้อมูลกิจกรรม PLC</p>
              </div>
            ) : (
              <div className="space-y-6">
                {data.data.map((activity: any) => (
                  <div key={activity.id} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{activity.topic}</h3>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            {activity.plcLevel}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {activity.teacher.fullName} • {activity.teacher.school.schoolName}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatThaiDate(activity.plcDate)} • บทบาท: {activity.role}
                        </p>

                        {activity.takeaway && (
                          <div className="mt-3 bg-blue-50 border-l-4 border-blue-400 p-3">
                            <p className="text-xs font-medium text-blue-800 mb-1">สิ่งที่ได้เรียนรู้</p>
                            <p className="text-sm text-blue-700">{activity.takeaway}</p>
                          </div>
                        )}
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
