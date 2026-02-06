'use client';

import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { PERIOD_MAP, LEVEL_MAP } from '@/lib/self-assessment-constants';

interface SelfAssessmentCardProps {
  assessment: any;
  onView: (id: string) => void;
  onRefresh: () => void;
}

const STATUS_CONFIG = {
  DRAFT: {
    label: 'ร่าง',
    color: 'bg-yellow-100 text-yellow-800',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    ),
  },
  SUBMITTED: {
    label: 'ส่งแล้ว',
    color: 'bg-purple-100 text-purple-800',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  REVIEWED: {
    label: 'ตรวจแล้ว',
    color: 'bg-green-100 text-green-800',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
};

export function SelfAssessmentCard({ assessment, onView, onRefresh }: SelfAssessmentCardProps) {
  const statusConfig = STATUS_CONFIG[assessment.status as keyof typeof STATUS_CONFIG];
  
  // คำนวณคะแนนเฉลี่ย
  const averageScore = (
    (assessment.pedagogyScore +
      assessment.classroomScore +
      assessment.communityScore +
      assessment.professionalismScore) / 4
  ).toFixed(2);

  // แปลงวันที่เป็นพุทธศักราช
  const formatThaiDate = (date: string) => {
    const d = new Date(date);
    const buddhistYear = d.getFullYear() + 543;
    return format(d, 'd MMM', { locale: th }) + ' ' + buddhistYear;
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
      <div className="p-5">
        {/* Header with Status */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {(PERIOD_MAP as Record<string, string>)[String(assessment.assessmentPeriod)] ?? assessment.assessmentPeriod}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {formatThaiDate(assessment.assessmentDate)}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </span>
        </div>

        {/* Scores Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">การสอน</div>
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold text-gray-900">
                {assessment.pedagogyScore}
              </span>
              <span className="ml-1 text-sm text-gray-500">/5</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">ห้องเรียน</div>
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold text-gray-900">
                {assessment.classroomScore}
              </span>
              <span className="ml-1 text-sm text-gray-500">/5</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">ชุมชน</div>
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold text-gray-900">
                {assessment.communityScore}
              </span>
              <span className="ml-1 text-sm text-gray-500">/5</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">มืออาชีพ</div>
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold text-gray-900">
                {assessment.professionalismScore}
              </span>
              <span className="ml-1 text-sm text-gray-500">/5</span>
            </div>
          </div>
        </div>

        {/* Average Score & Level */}
        <div className="mt-4 flex items-center justify-between p-3 bg-primary-50 rounded-lg">
          <div>
            <div className="text-xs text-primary-600 mb-1">คะแนนเฉลี่ย</div>
            <div className="text-xl font-bold text-primary-700">{averageScore}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-primary-600 mb-1">ระดับ</div>
            <div className="text-sm font-semibold text-primary-700">
              {(LEVEL_MAP as Record<string, string>)[String(assessment.overallLevel)] ?? assessment.overallLevel}
            </div>
          </div>
        </div>

        {/* Portfolio Items Count */}
        {assessment.portfolioItems && assessment.portfolioItems.length > 0 && (
          <div className="mt-3 flex items-center text-sm text-gray-500">
            <svg
              className="w-4 h-4 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            {assessment.portfolioItems.length} รายการหลักฐาน
          </div>
        )}

        {/* Reviewer Comments (if reviewed) */}
        {assessment.status === 'REVIEWED' && assessment.reviewerComments && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xs font-medium text-green-800 mb-1">
              ความเห็นผู้ตรวจสอบ
            </div>
            <p className="text-sm text-green-700 line-clamp-2">
              {assessment.reviewerComments}
            </p>
          </div>
        )}
      </div>

      {/* Footer with Action Button */}
      <div className="bg-gray-50 px-5 py-3">
        <button
          onClick={() => onView(assessment.id)}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 transition-colors"
        >
          ดูรายละเอียด
          <svg
            className="ml-2 w-4 h-4"
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
        </button>
      </div>
    </div>
  );
}
