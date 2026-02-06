'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { formatThaiDate } from '@/lib/utils';

interface TeacherDetailModalProps {
  teacherId: string;
  onClose: () => void;
}

const levelLabels: Record<string, string> = {
  NEEDS_SUPPORT: 'ต้องเสริม',
  FAIR: 'พอใช้',
  GOOD: 'ดี',
  EXCELLENT: 'ดีเยี่ยม',
};

const visitTypeLabels: Record<string, string> = {
  LESSON_STUDY: 'Lesson Study',
  COACHING: 'Coaching',
  OBSERVATION: 'Observation',
  FOLLOW_UP: 'Follow Up',
};

export function TeacherDetailModal({
  teacherId,
  onClose,
}: TeacherDetailModalProps) {
  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher-detail', teacherId],
    queryFn: async () => {
      const response = await apiClient.get(`/teachers/${teacherId}`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
          <div className="relative bg-white rounded-lg p-8 max-w-4xl w-full">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
              <p className="mt-3 text-sm text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!teacher) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h3 className="text-lg font-semibold text-gray-900">
              รายละเอียดครู: {teacher.fullName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">ข้อมูลส่วนตัว</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">ชื่อ-สกุล:</span>
                  <span className="ml-2 font-medium">{teacher.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-600">รุ่น:</span>
                  <span className="ml-2 font-medium">รุ่น {teacher.cohort}</span>
                </div>
                <div>
                  <span className="text-gray-600">ตำแหน่ง:</span>
                  <span className="ml-2 font-medium">{teacher.position}</span>
                </div>
                <div>
                  <span className="text-gray-600">วิชาเอก:</span>
                  <span className="ml-2 font-medium">{teacher.major}</span>
                </div>
                <div>
                  <span className="text-gray-600">โรงเรียน:</span>
                  <span className="ml-2 font-medium">{teacher.school.schoolName}</span>
                </div>
                <div>
                  <span className="text-gray-600">จังหวัด:</span>
                  <span className="ml-2 font-medium">{teacher.school.province}</span>
                </div>
              </div>
            </div>

            {/* Competency Assessments */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                ประวัติการประเมินสมรรถนะ ({teacher.competencyAssessments?.length || 0} ครั้ง)
              </h4>
              {teacher.competencyAssessments && teacher.competencyAssessments.length > 0 ? (
                <div className="space-y-3">
                  {teacher.competencyAssessments.map((assessment: any) => (
                    <div key={assessment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            assessment.overallLevel === 'EXCELLENT' ? 'bg-green-100 text-green-800' :
                            assessment.overallLevel === 'GOOD' ? 'bg-blue-100 text-blue-800' :
                            assessment.overallLevel === 'FAIR' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {levelLabels[assessment.overallLevel]}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {formatThaiDate(assessment.createdAt)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">ประเมินโดย: {assessment.assessor}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-xs">
                        <div className="text-center">
                          <div className="text-gray-600">การสอน</div>
                          <div className="text-lg font-semibold text-primary-600">{assessment.pedagogyScore}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-600">การจัดการ</div>
                          <div className="text-lg font-semibold text-primary-600">{assessment.classroomScore}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-600">ชุมชน</div>
                          <div className="text-lg font-semibold text-primary-600">{assessment.communityScore}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-600">จิตวิญญาณ</div>
                          <div className="text-lg font-semibold text-primary-600">{assessment.professionalismScore}</div>
                        </div>
                      </div>
                      {assessment.notes && (
                        <div className="mt-3 text-xs text-gray-600 bg-gray-50 rounded p-2">
                          <span className="font-medium">หมายเหตุ:</span> {assessment.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">ยังไม่มีการประเมิน</p>
              )}
            </div>

            {/* Mentoring Visits */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                ประวัติการหนุนเสริม ({teacher.mentoringVisits?.length || 0} ครั้ง)
              </h4>
              {teacher.mentoringVisits && teacher.mentoringVisits.length > 0 ? (
                <div className="space-y-3">
                  {teacher.mentoringVisits.slice(0, 5).map((visit: any) => (
                    <div key={visit.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {visitTypeLabels[visit.visitType] || visit.visitType}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {formatThaiDate(visit.visitDate)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">โดย: {visit.observer}</span>
                      </div>
                      {visit.strengths && (
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="font-medium text-green-600">จุดเด่น:</span> {visit.strengths}
                        </div>
                      )}
                      {visit.suggestions && (
                        <div className="mt-1 text-xs text-gray-600">
                          <span className="font-medium text-blue-600">ข้อเสนอแนะ:</span> {visit.suggestions}
                        </div>
                      )}
                    </div>
                  ))}
                  {teacher.mentoringVisits.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">
                      แสดง 5 รายการล่าสุด จากทั้งหมด {teacher.mentoringVisits.length} รายการ
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">ยังไม่มีการหนุนเสริม</p>
              )}
            </div>

            {/* Other Activities Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {teacher.reflectiveJournals?.length || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Reflective Journals</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {teacher.plcActivities?.length || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">กิจกรรม PLC</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {teacher.developmentPlans?.length || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">แผนพัฒนา</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
