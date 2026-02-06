'use client';

import { MainLayout } from '@/components/layout/main-layout';
import Link from 'next/link';

export default function ReportsPage() {
  const reports = [
    {
      title: 'รายงานครูผู้ช่วย',
      description: 'รายงานสรุปผลการประเมินและกิจกรรมของครูผู้ช่วยทั้งหมด',
      href: '/reports/teacher-assessment',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color: 'bg-blue-500',
    },
    {
      title: 'รายงานสรุปทั้งหมด',
      description: 'รายงานภาพรวมครูทั้งหมด สถิติ และกราฟแสดงผล',
      href: '/reports/overview',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color: 'bg-green-500',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
          <p className="mt-1 text-sm text-gray-600">
            เลือกประเภทรายงานที่ต้องการดู
          </p>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Link
              key={report.href}
              href={report.href}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
            >
              <div className="p-6">
                <div className={`inline-flex p-3 rounded-lg ${report.color} text-white group-hover:scale-110 transition-transform`}>
                  {report.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {report.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{report.description}</p>
                <div className="mt-4 flex items-center text-sm text-primary-600 font-medium">
                  ดูรายงาน
                  <svg
                    className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
