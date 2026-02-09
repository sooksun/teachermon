'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';

// =============================================
// Status helpers
// =============================================

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  READY: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  DRAFT: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  INSUFFICIENT: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const statusLabels: Record<string, string> = {
  READY: 'พร้อมนำเสนอ',
  DRAFT: 'ฉบับร่าง',
  INSUFFICIENT: 'ยังไม่เพียงพอ',
};

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function getTextColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

// =============================================
// ProgressBar
// =============================================
function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="my-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={`font-semibold ${getTextColor(value)}`}>{value}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${getBarColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// =============================================
// CircularProgress
// =============================================
function CircularProgress({ value, size = 120, label }: { value: number; size?: number; label: string }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{value}%</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-gray-700">{label}</span>
    </div>
  );
}

// =============================================
// EvidenceCard
// =============================================
function EvidenceCard({ item }: { item: any }) {
  const typeIcon = item.type === 'file' ? '📄' : item.type === 'video_link' ? '🎬' : '🤖';
  const typeLabel = item.type === 'file' ? 'ไฟล์' : item.type === 'video_link' ? 'วิดีโอ' : 'AI วิเคราะห์';

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <span className="text-xl">{typeIcon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
        <div className="text-xs text-gray-500">{typeLabel}</div>
        {item.description && (
          <p className="mt-1 text-xs text-gray-600 line-clamp-2">{item.description}</p>
        )}
        {item.transcriptSummary && (
          <p className="mt-1 text-xs text-blue-600 line-clamp-2">
            สรุป: {item.transcriptSummary}
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================
// IndicatorSection
// =============================================
function IndicatorSection({ indicator, expanded, onToggle }: { indicator: any; expanded: boolean; onToggle: () => void }) {
  const totalCount = indicator.totalCount || 0;
  const status = statusColors[indicator.status] || statusColors.INSUFFICIENT;

  return (
    <div className={`border rounded-lg overflow-hidden ${status.border}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 ${status.bg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getBarColor(indicator.score)} text-white`}>
            {indicator.score}
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900 text-sm">{indicator.indicatorName}</div>
            <div className="text-xs text-gray-500">หลักฐาน {totalCount} ชิ้น</div>
          </div>
        </div>
        <svg className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="p-4 bg-white space-y-3">
          {/* Files */}
          {indicator.files?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">ไฟล์อัพโหลด ({indicator.files.length})</h4>
              <div className="space-y-2">
                {indicator.files.map((f: any) => <EvidenceCard key={f.id} item={f} />)}
              </div>
            </div>
          )}

          {/* Video Links */}
          {indicator.videoLinks?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">ลิงก์วิดีโอ ({indicator.videoLinks.length})</h4>
              <div className="space-y-2">
                {indicator.videoLinks.map((v: any) => <EvidenceCard key={v.id} item={v} />)}
              </div>
            </div>
          )}

          {/* AI Analyses */}
          {indicator.aiAnalyses?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">AI วิเคราะห์ ({indicator.aiAnalyses.length})</h4>
              <div className="space-y-2">
                {indicator.aiAnalyses.map((a: any) => <EvidenceCard key={a.id} item={a} />)}
              </div>
            </div>
          )}

          {/* No evidence */}
          {totalCount === 0 && (
            <div className="text-center py-4 text-sm text-gray-400">
              ยังไม่มีหลักฐานเชื่อมกับตัวชี้วัดนี้
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================
// DomainCard
// =============================================
function DomainCard({ domain, expandedIndicator, setExpandedIndicator }: {
  domain: any;
  expandedIndicator: string | null;
  setExpandedIndicator: (id: string | null) => void;
}) {
  const domainColors: Record<string, string> = {
    PROFESSIONAL: 'bg-blue-500',
    SOCIAL: 'bg-purple-500',
    PERSONAL: 'bg-orange-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${domainColors[domain.domainId] || 'bg-gray-500'}`} />
        <h2 className="text-lg font-semibold text-gray-900">
          {domain.domainName} ({domain.score}%)
        </h2>
        <span className="text-sm text-gray-500">
          ผ่าน {domain.passedCount}/{domain.indicatorCount} | หลักฐาน {domain.totalEvidence} ชิ้น
        </span>
      </div>

      <ProgressBar value={domain.score} label={domain.domainName} />

      {/* Highlights */}
      {domain.highlights?.length > 0 && (
        <div className="mt-3 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="text-xs font-semibold text-blue-700 mb-1">จุดเด่น (AI Insights)</h4>
          {domain.highlights.slice(0, 3).map((h: string, i: number) => (
            <p key={i} className="text-xs text-blue-600">- {h}</p>
          ))}
        </div>
      )}

      {/* Indicators */}
      <div className="space-y-2">
        {domain.indicators?.map((ind: any) => (
          <IndicatorSection
            key={ind.indicatorId}
            indicator={ind}
            expanded={expandedIndicator === ind.indicatorId}
            onToggle={() => setExpandedIndicator(expandedIndicator === ind.indicatorId ? null : ind.indicatorId)}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================
// Main Page
// =============================================
export default function DevelopmentSummaryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRound, setSelectedRound] = useState(1);
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);

  const [downloading, setDownloading] = useState(false);

  const teacherId = user?.teacherId;

  // Download PPTX handler
  const handleDownloadPptx = async () => {
    if (!teacherId) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || '/api'}/development-summary/teacher/${teacherId}/pptx?round=${selectedRound}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) throw new Error('Failed to generate PPTX');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `สรุปผลพัฒนาอย่างเข้ม-ครั้งที่${selectedRound}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download PPTX failed:', err);
      alert('ไม่สามารถสร้าง PowerPoint ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setDownloading(false);
    }
  };

  // Fetch existing summary
  const { data: summaryResponse, isLoading, refetch } = useQuery({
    queryKey: ['development-summary', teacherId, selectedRound],
    queryFn: async () => {
      if (!teacherId) return null;
      const res = await apiClient.get(`/development-summary/teacher/${teacherId}?round=${selectedRound}`);
      return res.data;
    },
    enabled: !!teacherId,
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!teacherId) throw new Error('No teacherId');
      const res = await apiClient.post(`/development-summary/generate/${teacherId}?round=${selectedRound}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['development-summary'] });
      refetch();
    },
  });

  const summary = summaryResponse?.success ? summaryResponse.data : null;
  const domains = summary?.domainSummaries || summary?.domains || {};
  const aiInsights = summary?.aiInsights || {};

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/portfolio" className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                สรุปผลการพัฒนาอย่างเข้ม
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-600 ml-8">
              รวบรวมหลักฐานจาก AI วิเคราะห์, วิดีโอ, และไฟล์อัพโหลด เพื่อสรุปผลและสร้างสไลด์รายงาน
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Round selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">ครั้งที่:</span>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                {[1, 2, 3, 4].map((round) => (
                  <button
                    key={round}
                    onClick={() => setSelectedRound(round)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      selectedRound === round
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {round}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {generateMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {summary ? 'สร้างใหม่' : 'สร้างสรุปผล'}
                </>
              )}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="mt-3 text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : !summary ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
            <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีสรุปผล</h3>
            <p className="text-sm text-gray-500 mb-4">
              กดปุ่ม &quot;สร้างสรุปผล&quot; เพื่อรวบรวมข้อมูลจาก AI วิเคราะห์, วิดีโอ, และไฟล์อัพโหลด
            </p>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {generateMutation.isPending ? 'กำลังสร้าง...' : 'สร้างสรุปผล ครั้งที่ ' + selectedRound}
            </button>
          </div>
        ) : (
          <>
            {/* Overview Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                <div className="flex justify-center">
                  <CircularProgress
                    value={summary.overallScore}
                    size={140}
                    label="ความสมบูรณ์รวม"
                  />
                </div>

                <div className="lg:col-span-2 space-y-3">
                  {domains.PROFESSIONAL && (
                    <ProgressBar
                      value={domains.PROFESSIONAL.score}
                      label={`ด้านวิชาชีพ (${domains.PROFESSIONAL.passedCount}/${domains.PROFESSIONAL.indicatorCount})`}
                    />
                  )}
                  {domains.SOCIAL && (
                    <ProgressBar
                      value={domains.SOCIAL.score}
                      label={`ด้านสังคม (${domains.SOCIAL.passedCount}/${domains.SOCIAL.indicatorCount})`}
                    />
                  )}
                  {domains.PERSONAL && (
                    <ProgressBar
                      value={domains.PERSONAL.score}
                      label={`ด้านคุณลักษณะ (${domains.PERSONAL.passedCount}/${domains.PERSONAL.indicatorCount})`}
                    />
                  )}
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800">หลักฐาน</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{summary.totalFiles || 0}</div>
                      <div className="text-xs text-blue-500">ไฟล์</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{summary.totalVideoLinks || 0}</div>
                      <div className="text-xs text-red-500">วิดีโอ</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{summary.totalAnalysisJobs || 0}</div>
                      <div className="text-xs text-purple-500">AI วิเคราะห์</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{summary.totalEvidence || 0}</div>
                      <div className="text-xs text-green-500">รวมทั้งหมด</div>
                    </div>
                  </div>

                  <div className={`text-center p-2 rounded-lg text-sm font-semibold ${
                    summary.overallPassed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {summary.overallPassed ? '✅ ผ่านเกณฑ์' : '❌ ยังไม่ผ่านเกณฑ์'}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights Card */}
            {(aiInsights.teachingStrengths?.length > 0 || aiInsights.recommendations?.length > 0) && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Insights (สรุปจากการวิเคราะห์อัตโนมัติ)
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Strengths */}
                  {aiInsights.teachingStrengths?.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <h3 className="text-sm font-semibold text-green-700 mb-2">จุดแข็ง</h3>
                      {aiInsights.teachingStrengths.slice(0, 5).map((s: string, i: number) => (
                        <p key={i} className="text-xs text-green-600 mb-1">🌟 {s}</p>
                      ))}
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {aiInsights.areasForImprovement?.length > 0 && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <h3 className="text-sm font-semibold text-amber-700 mb-2">สิ่งที่ควรพัฒนา</h3>
                      {aiInsights.areasForImprovement.slice(0, 5).map((a: string, i: number) => (
                        <p key={i} className="text-xs text-amber-600 mb-1">📌 {a}</p>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {aiInsights.recommendations?.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h3 className="text-sm font-semibold text-blue-700 mb-2">คำแนะนำจาก AI</h3>
                      {aiInsights.recommendations.slice(0, 3).map((r: string, i: number) => (
                        <p key={i} className="text-xs text-blue-600 mb-1">
                          💡 {typeof r === 'string' ? r.substring(0, 150) : JSON.stringify(r).substring(0, 150)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Domain Sections */}
            <div className="space-y-6">
              {domains.PROFESSIONAL && (
                <DomainCard
                  domain={domains.PROFESSIONAL}
                  expandedIndicator={expandedIndicator}
                  setExpandedIndicator={setExpandedIndicator}
                />
              )}
              {domains.SOCIAL && (
                <DomainCard
                  domain={domains.SOCIAL}
                  expandedIndicator={expandedIndicator}
                  setExpandedIndicator={setExpandedIndicator}
                />
              )}
              {domains.PERSONAL && (
                <DomainCard
                  domain={domains.PERSONAL}
                  expandedIndicator={expandedIndicator}
                  setExpandedIndicator={setExpandedIndicator}
                />
              )}
            </div>

            {/* Narrative Summary */}
            {summary.summaryNarrative && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">สรุปผลแบบข้อความ</h2>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans bg-gray-50 p-4 rounded-lg">
                    {summary.summaryNarrative}
                  </pre>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ดาวน์โหลดรายงาน</h2>
              <div className="flex flex-wrap gap-4">
                {/* Primary: PowerPoint Download */}
                <button
                  onClick={handleDownloadPptx}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm transition-colors"
                >
                  {downloading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      กำลังสร้าง PowerPoint...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      ดาวน์โหลด PowerPoint (.pptx)
                    </>
                  )}
                </button>

                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || '/api'}/development-summary/teacher/${teacherId}/deck?round=${selectedRound}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  ดาวน์โหลด Slides (Markdown)
                </a>

                <Link
                  href={`/portfolio/preview`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  ดู Preview ตัวชี้วัด
                </Link>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                อัปเดตล่าสุด: {summary.generatedAt ? new Date(summary.generatedAt).toLocaleString('th-TH') : '-'}
              </p>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
