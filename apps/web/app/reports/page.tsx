'use client';

import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { REGIONS, TEACHER_STATUS } from '@teachermon/shared';

export default function ReportsPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/stats');
      return response.data;
    },
  });

  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers-all'],
    queryFn: async () => {
      const response = await apiClient.get('/teachers', {
        params: { limit: 1000 },
      });
      return response.data;
    },
  });

  const isLoading = statsLoading || teachersLoading;

  // คำนวณสถิติเพิ่มเติม
  const cohortStats = teachers?.data?.reduce((acc: any, teacher: any) => {
    acc[teacher.cohort] = (acc[teacher.cohort] || 0) + 1;
    return acc;
  }, {});

  const provinceStats = teachers?.data?.reduce((acc: any, teacher: any) => {
    const province = teacher.school?.province || 'ไม่ระบุ';
    acc[province] = (acc[province] || 0) + 1;
    return acc;
  }, {});

  // จัดเรียง top 10 provinces
  const topProvinces = provinceStats
    ? Object.entries(provinceStats)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 10)
    : [];

  const handleExport = () => {
    if (!teachers?.data) return;

    // สร้าง CSV
    const headers = [
      'ลำดับ',
      'ชื่อ-นามสกุล',
      'รุ่น',
      'โรงเรียน',
      'จังหวัด',
      'ภูมิภาค',
      'สถานะ',
      'อีเมล',
    ];

    const rows = teachers.data.map((teacher: any, index: number) => [
      index + 1,
      teacher.fullName,
      teacher.cohort,
      teacher.school?.schoolName || '-',
      teacher.school?.province || '-',
      REGIONS[teacher.school?.region as keyof typeof REGIONS] || '-',
      TEACHER_STATUS[teacher.status as keyof typeof TEACHER_STATUS],
      teacher.email || '-',
    ]);

    const csvContent = [
      '\uFEFF' + headers.join(','), // BOM for Thai encoding
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `รายงานครูทั้งหมด_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              รายงานสรุปครูทั้งหมด
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              ข้อมูลสถิติและรายงานสรุปครูรัก(ษ์)ถิ่นทั้งหมด
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={!teachers?.data}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📥 ส่งออก CSV
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      ครูทั้งหมด
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.summary?.totalTeachers || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      ครูที่ปฏิบัติงาน
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.summary?.activeTeachers || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      โรงเรียน
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.summary?.totalSchools || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      การเยี่ยมเยือน
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.summary?.totalVisits || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ครูแยกตามภูมิภาค */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  จำนวนครูแยกตามภูมิภาค
                </h3>
                <div className="space-y-3">
                  {stats?.teachersByRegion &&
                    Object.entries(stats.teachersByRegion).map(
                      ([region, count]: any) => (
                        <div key={region}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {REGIONS[region as keyof typeof REGIONS]}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {count} คน
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{
                                width: `${(count / stats.summary.totalTeachers) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )
                    )}
                </div>
              </div>

              {/* ครูแยกตามสถานะ */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  จำนวนครูแยกตามสถานะ
                </h3>
                <div className="space-y-3">
                  {stats?.teachersByStatus &&
                    Object.entries(stats.teachersByStatus).map(
                      ([status, count]: any) => (
                        <div key={status}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {TEACHER_STATUS[status as keyof typeof TEACHER_STATUS]}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {count} คน
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                status === 'ACTIVE'
                                  ? 'bg-green-500'
                                  : status === 'ON_LEAVE'
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                              style={{
                                width: `${(count / stats.summary.totalTeachers) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )
                    )}
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ครูแยกตาม Cohort */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  จำนวนครูแยกตามรุ่น (Cohort)
                </h3>
                <div className="space-y-3">
                  {cohortStats &&
                    Object.entries(cohortStats)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([cohort, count]: any) => (
                        <div key={cohort}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              รุ่นที่ {cohort}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {count} คน
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${(count / teachers.pagination.total) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                </div>
              </div>

              {/* Top 10 จังหวัด */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  10 จังหวัดที่มีครูมากที่สุด
                </h3>
                <div className="space-y-3">
                  {topProvinces.map(([province, count]: any, index) => (
                    <div key={province}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {index + 1}. {province}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {count} คน
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${(count / teachers.pagination.total) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  รายชื่อครูทั้งหมด ({teachers?.pagination?.total || 0} คน)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ลำดับ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ชื่อ-นามสกุล
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        รุ่น
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        โรงเรียน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        จังหวัด
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ภูมิภาค
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teachers?.data?.slice(0, 50).map((teacher: any, index: number) => (
                      <tr key={teacher.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {teacher.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {teacher.position}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          รุ่นที่ {teacher.cohort}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {teacher.school?.schoolName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {teacher.school?.province || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {REGIONS[teacher.school?.region as keyof typeof REGIONS] ||
                            '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              teacher.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : teacher.status === 'ON_LEAVE'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {TEACHER_STATUS[teacher.status as keyof typeof TEACHER_STATUS]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {teachers?.data?.length > 50 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                  แสดง 50 รายการแรก จากทั้งหมด {teachers.pagination.total} รายการ
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
