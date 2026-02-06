'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { ReportFilters } from '@/components/reports/report-filters';
import { TeacherAssessmentTable } from '@/components/reports/teacher-assessment-table';
import { SummaryCards } from '@/components/reports/summary-cards';
import { TeacherDetailModal } from '@/components/reports/teacher-detail-modal';
import { toast } from 'react-toastify';

interface ReportFilters {
  schoolId?: string;
  province?: string;
  region?: string;
  cohort?: number;
  status?: string;
}

export default function TeacherAssessmentReportPage() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch report data
  const { data, isLoading, error } = useQuery({
    queryKey: ['teacher-assessment-report', filters],
    queryFn: async () => {
      const response = await apiClient.get('/reports/teacher-assessment', {
        params: filters,
      });
      return response.data;
    },
  });

  // Export PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get('/reports/teacher-assessment/pdf', {
        params: filters,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `teacher-assessment-report-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('ดาวน์โหลดรายงาน PDF สำเร็จ');
    } catch (error: any) {
      console.error('PDF export error:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้าง PDF: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              รายงานสรุปผลการประเมินครูผู้ช่วย
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              แสดงผลการประเมินและกิจกรรมของครูผู้ช่วยทั้งหมด
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={isExporting || !data || data.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                กำลังสร้าง PDF...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export PDF
              </>
            )}
          </button>
        </div>

        {/* Filters */}
        <ReportFilters filters={filters} onChange={setFilters} />

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
              <p className="mt-3 text-sm text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700">
              เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
            </p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && data && (
          <>
            {/* Summary Cards */}
            <SummaryCards data={data} />

            {/* Data Table */}
            {data.length > 0 ? (
              <TeacherAssessmentTable
                data={data}
                onSelectTeacher={setSelectedTeacher}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  ไม่พบข้อมูล
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  ไม่มีข้อมูลครูผู้ช่วยที่ตรงกับเงื่อนไขที่เลือก
                </p>
              </div>
            )}
          </>
        )}

        {/* Detail Modal */}
        {selectedTeacher && (
          <TeacherDetailModal
            teacherId={selectedTeacher}
            onClose={() => setSelectedTeacher(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}
