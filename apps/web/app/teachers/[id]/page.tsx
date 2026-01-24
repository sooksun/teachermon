'use client';

import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { REGIONS, TEACHER_STATUS } from '@teachermon/shared';

export default function TeacherDetailPage() {
  const params = useParams();
  const teacherId = params.id as string;

  const { data: teacher, isLoading, error } = useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: async () => {
      const response = await apiClient.get(`/teachers/${teacherId}`);
      return response.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['teacher-stats', teacherId],
    queryFn: async () => {
      const response = await apiClient.get(`/teachers/${teacherId}/statistics`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !teacher) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-600">ไม่พบข้อมูลครู</p>
          <Link href="/teachers" className="mt-4 text-primary-600 hover:text-primary-800">
            กลับไปหน้ารายชื่อครู
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/teachers"
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
            >
              &larr; กลับไปรายชื่อครู
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{teacher.fullName}</h1>
            <p className="mt-1 text-sm text-gray-600">{teacher.position}</p>
          </div>
          <Link
            href={`/teachers/${teacherId}/edit`}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            แก้ไขข้อมูล
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Personal Info Card */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">ข้อมูลส่วนตัว</h2>
            </div>
            <div className="px-6 py-4">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">เลขบัตรประชาชน</dt>
                  <dd className="mt-1 text-sm text-gray-900">{teacher.citizenId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">เพศ</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {teacher.gender === 'MALE' ? 'ชาย' : teacher.gender === 'FEMALE' ? 'หญิง' : 'อื่นๆ'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">วันเกิด</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(teacher.birthDate).toLocaleDateString('th-TH')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">วิชาเอก</dt>
                  <dd className="mt-1 text-sm text-gray-900">{teacher.major}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">อีเมล</dt>
                  <dd className="mt-1 text-sm text-gray-900">{teacher.email || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">เบอร์โทร</dt>
                  <dd className="mt-1 text-sm text-gray-900">{teacher.phone || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">รุ่น</dt>
                  <dd className="mt-1 text-sm text-gray-900">รุ่นที่ {teacher.cohort}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">วันที่บรรจุ</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(teacher.appointmentDate).toLocaleDateString('th-TH')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">สถานะ</dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                        teacher.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {TEACHER_STATUS[teacher.status as keyof typeof TEACHER_STATUS]}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Stats Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">สถิติ</h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">การลงพื้นที่</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {stats?.visitsCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Journals</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {stats?.journalsCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">PLC Activities</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {stats?.plcCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* School Card */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">โรงเรียน</h2>
              </div>
              <div className="px-6 py-4">
                <h3 className="font-medium text-gray-900">{teacher.school.schoolName}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {teacher.school.province} •{' '}
                  {REGIONS[teacher.school.region as keyof typeof REGIONS]}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  นักเรียน: {teacher.school.studentTotal} คน
                </p>
                <Link
                  href={`/schools/${teacher.school.id}`}
                  className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-800"
                >
                  ดูข้อมูลโรงเรียน &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Mentoring Visits */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">การหนุนเสริมล่าสุด</h2>
            </div>
            <div className="px-6 py-4">
              {teacher.mentoringVisits && teacher.mentoringVisits.length > 0 ? (
                <div className="space-y-4">
                  {teacher.mentoringVisits.slice(0, 3).map((visit: any) => (
                    <div key={visit.id} className="border-l-4 border-primary-500 pl-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {visit.visitType}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(visit.visitDate).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">ผู้สังเกต: {visit.observer}</p>
                      {visit.suggestions && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {visit.suggestions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">ยังไม่มีข้อมูลการหนุนเสริม</p>
              )}
            </div>
          </div>

          {/* Recent Journals */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Reflective Journals ล่าสุด</h2>
            </div>
            <div className="px-6 py-4">
              {teacher.reflectiveJournals && teacher.reflectiveJournals.length > 0 ? (
                <div className="space-y-4">
                  {teacher.reflectiveJournals.slice(0, 3).map((journal: any) => (
                    <div key={journal.id} className="border-l-4 border-purple-500 pl-4">
                      <div className="text-sm font-medium text-gray-900">{journal.month}</div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {journal.reflectionText}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">ยังไม่มี Reflective Journal</p>
              )}
            </div>
          </div>
        </div>

        {/* Competency Assessment */}
        {stats?.latestAssessment && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">การประเมินสมรรถนะล่าสุด</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {stats.latestAssessment.pedagogyScore}
                  </div>
                  <div className="text-xs text-gray-600">การสอน</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {stats.latestAssessment.classroomScore}
                  </div>
                  <div className="text-xs text-gray-600">จัดการชั้นเรียน</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {stats.latestAssessment.communityScore}
                  </div>
                  <div className="text-xs text-gray-600">ชุมชน</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {stats.latestAssessment.professionalismScore}
                  </div>
                  <div className="text-xs text-gray-600">จิตวิญญาณครู</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-600">ระดับโดยรวม: </span>
                <span className="font-semibold text-gray-900">
                  {stats.latestAssessment.overallLevel}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
