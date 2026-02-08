'use client';

import { useState } from 'react';

interface AnalysisResultProps {
  job: {
    id: string;
    originalFilename: string | null;
    analysisMode: string;
    transcriptSummary: string | null;
    analysisReport: any | null;
    evaluationResult: any | null;
    aiAdvice: string | null;
    hasTranscript: boolean;
    hasFrames: boolean;
    hasReport: boolean;
    doneAt: string | null;
  };
  onClose: () => void;
}

type Tab = 'summary' | 'report' | 'indicators' | 'advice';

export function AnalysisResult({ job, onClose }: AnalysisResultProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const report = job.analysisReport || {};

  const tabs: { id: Tab; label: string }[] = [
    { id: 'summary', label: 'สรุปภาพรวม' },
    { id: 'report', label: 'ผลวิเคราะห์' },
    { id: 'indicators', label: 'ตัวชี้วัด' },
    { id: 'advice', label: 'คำแนะนำ' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">ผลการวิเคราะห์ AI</h2>
            <p className="text-sm text-gray-500 mt-0.5">{job.originalFilename || 'ชิ้นงาน'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {/* Overall Score */}
              {report.overallScore && (
                <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg">
                  <div className="text-4xl font-bold text-amber-600">
                    {report.overallScore}/5
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">คะแนนรวม</div>
                    <div className="text-sm text-gray-600">จากการวิเคราะห์ AI</div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">สรุปภาพรวมการสอน</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {job.transcriptSummary || report.summary || 'ไม่มีสรุป'}
                </p>
              </div>

              {/* Student Engagement */}
              {report.studentEngagement && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">การมีส่วนร่วมของผู้เรียน</h3>
                  <p className="text-sm text-gray-600">{report.studentEngagement}</p>
                </div>
              )}

              {/* Teaching Techniques */}
              {report.teachingTechniques?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">เทคนิคการสอนที่ใช้</h3>
                  <div className="flex flex-wrap gap-2">
                    {report.teachingTechniques.map((t: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="text-xs text-gray-400 pt-2 border-t">
                วิเคราะห์เมื่อ: {job.doneAt ? new Date(job.doneAt).toLocaleString('th-TH') : '-'} |
                โหมด: {job.analysisMode === 'FULL' ? 'วิเคราะห์แบบเต็ม' : 'เฉพาะเสียง'}
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-4">
              {/* Strengths */}
              <div>
                <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  จุดแข็ง
                </h3>
                {report.strengths?.length > 0 ? (
                  <ul className="space-y-2">
                    {report.strengths.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">+</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">ไม่มีข้อมูล</p>
                )}
              </div>

              {/* Improvements */}
              <div>
                <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  ข้อเสนอปรับปรุง
                </h3>
                {report.improvements?.length > 0 ? (
                  <ul className="space-y-2">
                    {report.improvements.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-amber-500 mt-0.5">!</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">ไม่มีข้อมูล</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'indicators' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-3">ผลการประเมินตามตัวชี้วัดสมรรถนะครู</p>
              {job.evaluationResult && typeof job.evaluationResult === 'object' ? (
                Object.entries(job.evaluationResult).map(([code, desc]) => (
                  <div key={code} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
                        {code}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{String(desc)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">ไม่มีข้อมูลตัวชี้วัด</p>
              )}
            </div>
          )}

          {activeTab === 'advice' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="text-sm font-semibold text-amber-800 mb-2">คำแนะนำจาก AI</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {job.aiAdvice || 'ไม่มีคำแนะนำ'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
