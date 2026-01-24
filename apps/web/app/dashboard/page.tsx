'use client';

import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/stats');
      return response.data;
    },
  });

  const { data: trends } = useQuery({
    queryKey: ['dashboard-trends'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/trends');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12">กำลังโหลด...</div>
      </MainLayout>
    );
  }

  const regionLabels: any = {
    NORTH: 'ภาคเหนือ',
    NORTHEAST: 'ภาคตะวันออกเฉียงเหนือ',
    CENTRAL: 'ภาคกลาง',
    SOUTH: 'ภาคใต้',
  };

  const regionData = stats?.teachersByRegion
    ? Object.entries(stats.teachersByRegion).map(([region, count]) => ({
        region: regionLabels[region] || region,
        count,
      }))
    : [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
          <p className="mt-1 text-sm text-gray-600">
            ภาพรวมระบบติดตามและหนุนเสริมการพัฒนาครูรัก(ษ์)ถิ่น
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">ครูทั้งหมด</dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats?.summary?.totalTeachers || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <a href="/teachers" className="text-sm text-primary-600 hover:text-primary-900">
                ดูรายละเอียด &rarr;
              </a>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">โรงเรียน</dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats?.summary?.totalSchools || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <a href="/schools" className="text-sm text-green-600 hover:text-green-900">
                ดูรายละเอียด &rarr;
              </a>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">การลงพื้นที่</dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats?.summary?.totalVisits || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <a href="/mentoring" className="text-sm text-yellow-600 hover:text-yellow-900">
                ดูรายละเอียด &rarr;
              </a>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Journals</dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats?.summary?.totalJournals || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <a href="/journals" className="text-sm text-purple-600 hover:text-purple-900">
                ดูรายละเอียด &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Teachers by Region */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              การกระจายตัวครูตามภูมิภาค
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0ea5e9" name="จำนวนครู" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trends */}
          {trends && trends.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                แนวโน้มกิจกรรมรายเดือน
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="visits" stroke="#f59e0b" name="การลงพื้นที่" />
                  <Line type="monotone" dataKey="journals" stroke="#8b5cf6" name="Journals" />
                  <Line type="monotone" dataKey="plc" stroke="#10b981" name="PLC" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">การหนุนเสริมล่าสุด</h3>
            </div>
            <div className="px-6 py-4">
              {stats?.recentActivities?.visits && stats.recentActivities.visits.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivities.visits.slice(0, 5).map((visit: any) => (
                    <div key={visit.id} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 mt-2 bg-yellow-500 rounded-full"></div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {visit.teacher.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {visit.teacher.school.schoolName} • {new Date(visit.visitDate).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">ยังไม่มีข้อมูล</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Journals ล่าสุด</h3>
            </div>
            <div className="px-6 py-4">
              {stats?.recentActivities?.journals && stats.recentActivities.journals.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivities.journals.slice(0, 5).map((journal: any) => (
                    <div key={journal.id} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 mt-2 bg-purple-500 rounded-full"></div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {journal.teacher.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {journal.month} • {journal.reflectionText.slice(0, 50)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">ยังไม่มีข้อมูล</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
