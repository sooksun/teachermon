'use client';

import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { REGIONS } from '@teachermon/shared';
import { formatThaiDate } from '@/lib/utils';

const SCHOOL_SIZE_LABELS: Record<string, string> = {
  SMALL: 'เล็ก',
  MEDIUM: 'กลาง',
  LARGE: 'ใหญ่',
};

const AREA_TYPE_LABELS: Record<string, string> = {
  REMOTE: 'พื้นที่ห่างไกล',
  VERY_REMOTE: 'พื้นที่ห่างไกลมาก',
  SPECIAL: 'พื้นที่พิเศษ',
};

export default function SchoolDetailPage() {
  const params = useParams();
  const schoolId = params.id as string;

  const { data: school, isLoading, error } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: async () => {
      const response = await apiClient.get(`/schools/${schoolId}`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <p className="mt-2 text-sm text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
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

  const teachers = school.teachers || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/schools"
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
            >
              &larr; กลับไปรายชื่อโรงเรียน
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{school.schoolName}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {school.province} • {REGIONS[school.region as keyof typeof REGIONS]}
            </p>
          </div>
          <Link
            href={`/schools/${schoolId}/edit`}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            แก้ไขข้อมูล
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">ข้อมูลโรงเรียน</h2>
            </div>
            <div className="px-6 py-4">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">จังหวัด</dt>
                  <dd className="mt-1 text-sm text-gray-900">{school.province}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">ภาค</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {REGIONS[school.region as keyof typeof REGIONS]}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">ขนาดโรงเรียน</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {SCHOOL_SIZE_LABELS[school.schoolSize] ?? school.schoolSize}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">ประเภทพื้นที่</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {AREA_TYPE_LABELS[school.areaType] ?? school.areaType}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">จำนวนนักเรียน</dt>
                  <dd className="mt-1 text-sm text-gray-900">{school.studentTotal} คน</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">ผู้อำนวยการ</dt>
                  <dd className="mt-1 text-sm text-gray-900">{school.directorName || '-'}</dd>
                </div>
                {school.qualitySchoolFlag && (
                  <div className="sm:col-span-2">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      ⭐ โรงเรียนคุณภาพชุมชน
                    </span>
                  </div>
                )}
                {school.communityContext && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">บริบทชุมชน</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {school.communityContext}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">สรุป</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">จำนวนครู</span>
                <span className="text-lg font-semibold text-gray-900">{teachers.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">ครูในโรงเรียน</h2>
            <Link
              href={`/teachers/create?schoolId=${schoolId}`}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              + เพิ่มครู
            </Link>
          </div>
          <div className="px-6 py-4">
            {teachers.length === 0 ? (
              <p className="text-sm text-gray-500">ยังไม่มีครูในโรงเรียนนี้</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        ชื่อ-นามสกุล
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        ตำแหน่ง
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        รุ่น
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        วันที่บรรจุ
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        สถานะ
                      </th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {teachers.map((t: any) => (
                      <tr key={t.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{t.fullName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.position}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">รุ่นที่ {t.cohort}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {t.appointmentDate ? formatThaiDate(t.appointmentDate) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              t.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {t.status === 'ACTIVE' ? 'ปฏิบัติงาน' : t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/teachers/${t.id}`}
                            className="text-sm text-primary-600 hover:text-primary-800"
                          >
                            ดู
                          </Link>
                          <span className="mx-1 text-gray-300">|</span>
                          <Link
                            href={`/teachers/${t.id}/edit`}
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            แก้ไข
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
