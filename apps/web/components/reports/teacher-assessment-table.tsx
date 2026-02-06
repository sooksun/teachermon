'use client';

import { formatThaiDate } from '@/lib/utils';

interface TeacherAssessmentTableProps {
  data: any[];
  onSelectTeacher: (teacherId: string) => void;
}

const levelLabels: Record<string, string> = {
  NEEDS_SUPPORT: 'ต้องเสริม',
  FAIR: 'พอใช้',
  GOOD: 'ดี',
  EXCELLENT: 'ดีเยี่ยม',
};

const levelColors: Record<string, string> = {
  NEEDS_SUPPORT: 'bg-red-100 text-red-800',
  FAIR: 'bg-yellow-100 text-yellow-800',
  GOOD: 'bg-blue-100 text-blue-800',
  EXCELLENT: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'ปฏิบัติงาน',
  TRANSFERRED: 'ย้าย',
  RESIGNED: 'ลาออก',
  ON_LEAVE: 'ลา',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'text-green-600',
  TRANSFERRED: 'text-yellow-600',
  RESIGNED: 'text-gray-600',
  ON_LEAVE: 'text-blue-600',
};

export function TeacherAssessmentTable({
  data,
  onSelectTeacher,
}: TeacherAssessmentTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ลำดับ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ชื่อ-สกุล / รุ่น
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                โรงเรียน / จังหวัด
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                การประเมินล่าสุด
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                คะแนนเฉลี่ย
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                หนุนเสริม
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Journal
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                PLC
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                การดำเนินการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((teacher, index) => (
              <tr key={teacher.teacherId} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {index + 1}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {teacher.fullName}
                  </div>
                  <div className="text-xs text-gray-500">รุ่น {teacher.cohort}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">
                    {teacher.school.schoolName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {teacher.school.province}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {teacher.latestAssessment ? (
                    <div className="space-y-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          levelColors[teacher.latestAssessment.overallLevel] ||
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {levelLabels[teacher.latestAssessment.overallLevel] ||
                          teacher.latestAssessment.overallLevel}
                      </span>
                      <div className="text-xs text-gray-500">
                        {formatThaiDate(teacher.latestAssessment.date)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">ยังไม่มีข้อมูล</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  {teacher.averageScore !== null ? (
                    <span className="text-sm font-medium text-gray-900">
                      {teacher.averageScore.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {teacher.mentoringCount > 0 ? (
                    <span className="font-medium">{teacher.mentoringCount}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {teacher.journalCount > 0 ? (
                    <span className="font-medium">{teacher.journalCount}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {teacher.plcCount > 0 ? (
                    <span className="font-medium">{teacher.plcCount}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`text-sm font-medium ${
                      statusColors[teacher.status] || 'text-gray-600'
                    }`}
                  >
                    {statusLabels[teacher.status] || teacher.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                  <button
                    onClick={() => onSelectTeacher(teacher.teacherId)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    ดูรายละเอียด
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Info */}
      <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="text-sm text-gray-700">
          แสดง <span className="font-medium">{data.length}</span> รายการ
        </div>
      </div>
    </div>
  );
}
