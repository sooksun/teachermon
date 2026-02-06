'use client';

interface SummaryCardsProps {
  data: any[];
}

export function SummaryCards({ data }: SummaryCardsProps) {
  // Calculate summary statistics
  const totalTeachers = data.length;
  const teachersWithAssessment = data.filter((t) => t.assessmentCount > 0).length;
  const teachersAssessed = data.filter((t) => t.averageScore !== null);
  const averageScore =
    teachersAssessed.length > 0
      ? (
          teachersAssessed.reduce((sum, t) => sum + (t.averageScore || 0), 0) /
          teachersAssessed.length
        ).toFixed(2)
      : '0.00';
  const totalMentoring = data.reduce((sum, t) => sum + t.mentoringCount, 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Teachers */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-500 rounded-md p-3">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  ครูผู้ช่วยทั้งหมด
                </dt>
                <dd className="text-3xl font-semibold text-gray-900">
                  {totalTeachers}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <span className="font-medium text-gray-600">
              ผ่านการประเมิน: {teachersWithAssessment} คน
            </span>
          </div>
        </div>
      </div>

      {/* Average Score */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  คะแนนเฉลี่ย (จาก 5)
                </dt>
                <dd className="text-3xl font-semibold text-gray-900">
                  {averageScore}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <span className="font-medium text-gray-600">
              ประเมินแล้ว: {teachersAssessed.length} คน
            </span>
          </div>
        </div>
      </div>

      {/* Total Mentoring */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  การหนุนเสริมทั้งหมด
                </dt>
                <dd className="text-3xl font-semibold text-gray-900">
                  {totalMentoring}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <span className="font-medium text-gray-600">
              เฉลี่ย: {totalTeachers > 0 ? (totalMentoring / totalTeachers).toFixed(1) : 0} ครั้ง/คน
            </span>
          </div>
        </div>
      </div>

      {/* Level Distribution */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  ระดับดีเยี่ยม/ดี
                </dt>
                <dd className="text-3xl font-semibold text-gray-900">
                  {
                    data.filter(
                      (t) =>
                        t.latestAssessment?.overallLevel === 'EXCELLENT' ||
                        t.latestAssessment?.overallLevel === 'GOOD',
                    ).length
                  }
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <span className="font-medium text-gray-600">
              คิดเป็น:{' '}
              {teachersWithAssessment > 0
                ? (
                    (data.filter(
                      (t) =>
                        t.latestAssessment?.overallLevel === 'EXCELLENT' ||
                        t.latestAssessment?.overallLevel === 'GOOD',
                    ).length /
                      teachersWithAssessment) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
