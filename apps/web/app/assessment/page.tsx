'use client';

import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

export default function AssessmentPage() {
  const { data: assessments, isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: async () => {
      const response = await apiClient.get('/assessment/competency');
      return response.data;
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['development-plans'],
    queryFn: async () => {
      const response = await apiClient.get('/assessment/plans');
      return response.data;
    },
  });

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
            {isLoading ? (
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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">แผนพัฒนารายบุคคล (IDP)</h2>
            <Link
              href="/assessment/plans/new"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              + สร้างแผนพัฒนา
            </Link>
          </div>
          <div className="px-6 py-4">
            {!plans || plans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">ยังไม่มีแผนพัฒนา</p>
              </div>
            ) : (
              <div className="space-y-4">
                {plans.slice(0, 5).map((plan: any) => (
                  <div key={plan.id} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {plan.focusCompetency}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            plan.progressStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            plan.progressStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            plan.progressStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {plan.progressStatus}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-600">
                          {plan.teacher.fullName} • {plan.teacher.school.schoolName}
                        </p>
                        <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                          {plan.actionPlan}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(plan.startDate).toLocaleDateString('th-TH')} - {new Date(plan.endDate).toLocaleDateString('th-TH')}
                        </p>
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
