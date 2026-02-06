'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { formatThaiDate } from '@/lib/utils';

const FOCUS_FILTER_OPTIONS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'WP.2', label: 'Active Learning (WP.2)' },
  { value: 'WP.1', label: 'WP.1 - การออกแบบการจัดการเรียนรู้' },
  { value: 'WP.3', label: 'WP.3 - การวัดและประเมินผล' },
  { value: 'ET.1', label: 'ET.1 - ความเป็นครู' },
  { value: 'ET.2', label: 'ET.2 - การจัดการชั้นเรียน' },
  { value: 'ET.3', label: 'ET.3 - ภาวะผู้นำทางวิชาการ' },
  { value: 'ET.4', label: 'ET.4 - การพัฒนาตนเอง' },
];

export default function AssessmentPage() {
  const [focusFilter, setFocusFilter] = useState('');
  const { data: assessments, isLoading, error: assessmentsError } = useQuery({
    queryKey: ['assessments'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/assessment/competency');
        const result = response.data;
        return Array.isArray(result) ? result : (result?.data ?? []);
      } catch (error: any) {
        console.error('Error fetching assessments:', error);
        throw error;
      }
    },
    retry: 1,
  });

  const { data: plans, error: plansError } = useQuery({
    queryKey: ['development-plans'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/assessment/plans');
        const result = response.data;
        return Array.isArray(result) ? result : (result?.data ?? []);
      } catch (error: any) {
        console.error('Error fetching plans:', error);
        throw error;
      }
    },
    retry: 1,
  });

  const filteredPlans = useMemo(() => {
    if (!plans || !Array.isArray(plans)) return [];
    if (!focusFilter) return plans;
    return plans.filter(
      (p: any) =>
        String(p.focusCompetency || '').toUpperCase().replace('_', '.') ===
        focusFilter.toUpperCase().replace('_', '.'),
    );
  }, [plans, focusFilter]);

  const isActiveLearning = (code: string) =>
    String(code || '').toUpperCase().includes('WP.2') || String(code || '').toUpperCase().includes('WP_2');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การประเมินสมรรถนะและแผนพัฒนา</h1>
          <p className="mt-1 text-sm text-gray-600">
            ติดตามการประเมินสมรรถนะและแผนพัฒนารายบุคคล (IDP)
          </p>
        </div>

        {/* Competency Assessments */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">การประเมินสมรรถนะ</h2>
            <Link
              href="/assessment/new"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
            >
              + เพิ่มการประเมิน
            </Link>
          </div>
          <div className="px-6 py-4">
            {assessmentsError ? (
              <div className="text-center py-12">
                <p className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                <p className="text-sm text-gray-500 mt-2">
                  {assessmentsError instanceof Error ? assessmentsError.message : 'Unknown error'}
                </p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">กำลังโหลด...</div>
            ) : !assessments || assessments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">ยังไม่มีข้อมูลการประเมิน</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.slice(0, 5).map((assessment: any) => (
                  <div key={assessment.id} className="border-l-4 border-primary-500 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {assessment.teacher.fullName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {assessment.teacher.school.schoolName} • ครั้งที่ {assessment.assessmentPeriod}
                        </p>
                        <div className="mt-2 flex gap-4 text-xs">
                          <span>การสอน: {assessment.pedagogyScore}/5</span>
                          <span>จัดการชั้นเรียน: {assessment.classroomScore}/5</span>
                          <span>ชุมชน: {assessment.communityScore}/5</span>
                          <span>จิตวิญญาณ: {assessment.professionalismScore}/5</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        assessment.overallLevel === 'EXCELLENT' ? 'bg-green-100 text-green-800' :
                        assessment.overallLevel === 'GOOD' ? 'bg-blue-100 text-blue-800' :
                        assessment.overallLevel === 'FAIR' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {assessment.overallLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Development Plans */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">แผนพัฒนารายบุคคล (IDP)</h2>
            <div className="flex items-center gap-3">
              <select
                value={focusFilter}
                onChange={(e) => setFocusFilter(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-primary-500 focus:ring-primary-500"
              >
                {FOCUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Link
                href="/assessment/plans/new"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                + สร้างแผนพัฒนา
              </Link>
            </div>
          </div>
          <div className="px-6 py-4">
            {plansError ? (
              <div className="text-center py-12">
                <p className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                <p className="text-sm text-gray-500 mt-2">
                  {plansError instanceof Error ? plansError.message : 'Unknown error'}
                </p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {focusFilter ? 'ไม่พบแผนที่ตรงกับตัวกรอง' : 'ยังไม่มีแผนพัฒนา'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPlans.slice(0, 10).map((plan: any) => (
                  <div
                    key={plan.id}
                    className={`border-l-4 pl-4 py-2 ${
                      isActiveLearning(plan.focusCompetency) ? 'border-teal-500 bg-teal-50/50' : 'border-green-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {plan.focusCompetency}
                            {isActiveLearning(plan.focusCompetency) && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded bg-teal-100 text-teal-800">
                                Active Learning
                              </span>
                            )}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            plan.progressStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            plan.progressStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            plan.progressStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {plan.progressStatus === 'DRAFT' && 'ร่าง'}
                            {plan.progressStatus === 'IN_PROGRESS' && 'กำลังดำเนินการ'}
                            {plan.progressStatus === 'COMPLETED' && 'เสร็จสิ้น'}
                            {plan.progressStatus === 'CANCELLED' && 'ยกเลิก'}
                            {!['DRAFT','IN_PROGRESS','COMPLETED','CANCELLED'].includes(plan.progressStatus) && plan.progressStatus}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-600">
                          {plan.teacher?.fullName} • {plan.teacher?.school?.schoolName}
                        </p>
                        <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                          {plan.actionPlan}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatThaiDate(plan.startDate)} - {formatThaiDate(plan.endDate)}
                        </p>
                        {(plan.budgetAllocated != null || plan.budgetUsed != null) && (
                          <p className="mt-1 text-xs text-gray-600">
                            งบ: จัดสรร {Number(plan.budgetAllocated || 0).toLocaleString('th-TH')} บาท
                            {plan.budgetUsed != null && ` • ใช้แล้ว ${Number(plan.budgetUsed).toLocaleString('th-TH')} บาท`}
                          </p>
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
