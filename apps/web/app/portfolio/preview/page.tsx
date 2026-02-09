'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';

// Colors/status helpers
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

// ─────────────────────────────────────────
// ProgressBar Component
// ─────────────────────────────────────────
function ProgressBar({ value, label, size = 'md' }: { value: number; label: string; size?: 'sm' | 'md' | 'lg' }) {
  const h = size === 'lg' ? 'h-5' : size === 'md' ? 'h-3' : 'h-2';
  return (
    <div className="my-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={`font-semibold ${getTextColor(value)}`}>{value}%</span>
      </div>
      <div className={`${h} bg-gray-200 rounded-full overflow-hidden`}>
        <div
          className={`${h} rounded-full transition-all duration-500 ${getBarColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// CircularProgress Component
// ─────────────────────────────────────────
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
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
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

// ─────────────────────────────────────────
// IndicatorCard Component
// ─────────────────────────────────────────
function IndicatorCard({ item, expanded, onToggle }: { item: any; expanded: boolean; onToggle: () => void }) {
  const status = statusColors[item.status] || statusColors.INSUFFICIENT;

  return (
    <div className={`border rounded-lg overflow-hidden ${status.border}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 ${status.bg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getBarColor(item.score)} text-white`}>
            {item.score}
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900 text-sm">{item.name}</div>
            <div className={`text-xs ${status.text}`}>{statusLabels[item.status]}</div>
          </div>
        </div>
        <svg className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="p-3 bg-white space-y-2">
          {/* Checks */}
          {item.checks?.map((check: any) => (
            <div key={check.id} className="flex items-start gap-2">
              {check.passed ? (
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`text-sm ${check.passed ? 'text-gray-700' : 'text-gray-400'}`}>
                {check.label}
                <span className="ml-1 text-xs text-gray-400">({check.weight}%)</span>
              </span>
            </div>
          ))}

          {/* Missing items */}
          {item.missing?.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="text-xs font-medium text-red-600 mb-1">สิ่งที่ยังขาด:</div>
              {item.missing.map((m: string, i: number) => (
                <div key={i} className="text-xs text-red-500 ml-2">- {m}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// SlidePreviewCard
// ─────────────────────────────────────────
function SlidePreviewCard({ slide }: { slide: any }) {
  const status = statusColors[slide.status] || statusColors.INSUFFICIENT;
  return (
    <div className={`border rounded-lg p-4 ${status.border} ${status.bg} min-w-[200px]`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">SLIDE</span>
        <span className={`text-sm font-bold ${getTextColor(slide.score)}`}>{slide.score}%</span>
      </div>
      <div className="text-sm font-medium text-gray-800 mb-2">{slide.name}</div>
      <div className={`h-1.5 bg-gray-200 rounded-full overflow-hidden`}>
        <div
          className={`h-1.5 rounded-full ${getBarColor(slide.score)}`}
          style={{ width: `${slide.score}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────
export default function PreviewDashboardPage() {
  const { user } = useAuth();
  const [selectedRound, setSelectedRound] = useState(1);
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);

  const teacherId = user?.teacherId;

  const { data: completeness, isLoading, error } = useQuery({
    queryKey: ['completeness', teacherId, selectedRound],
    queryFn: async () => {
      if (!teacherId) return null;
      const res = await apiClient.get(`/completeness/teacher/${teacherId}?round=${selectedRound}`);
      return res.data;
    },
    enabled: !!teacherId,
    refetchInterval: false,
  });

  const domains = completeness?.domains || {};
  const items = completeness?.items || {};
  const slides = completeness?.slides || [];
  const criteria = completeness?.passCriteria;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/portfolio" className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Preview ความสมบูรณ์ (ว19/2568)
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-600 ml-8">
              ตรวจสอบความพร้อมหลักฐานก่อนวันประเมิน
            </p>
          </div>

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
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {round}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            <p className="mt-3 text-gray-500">กำลังคำนวณความสมบูรณ์...</p>
          </div>
        ) : !completeness ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <p className="text-gray-500">ไม่พบข้อมูล กรุณาเข้าสู่ระบบในฐานะครูผู้ช่วย</p>
          </div>
        ) : (
          <>
            {/* ส่วน A: Progress รวม */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                {/* Deck Score */}
                <div className="flex justify-center">
                  <CircularProgress
                    value={completeness.deck.score}
                    size={140}
                    label="ความสมบูรณ์รวม"
                  />
                </div>

                {/* Domain Scores */}
                <div className="lg:col-span-2 space-y-3">
                  {domains.PROFESSIONAL && (
                    <ProgressBar value={domains.PROFESSIONAL.score} label={`ด้านวิชาชีพ (${domains.PROFESSIONAL.passedCount}/${domains.PROFESSIONAL.itemCount} ข้อ)`} size="md" />
                  )}
                  {domains.SOCIAL && (
                    <ProgressBar value={domains.SOCIAL.score} label={`ด้านสังคม (${domains.SOCIAL.passedCount}/${domains.SOCIAL.itemCount} ข้อ)`} size="md" />
                  )}
                  {domains.PERSONAL && (
                    <ProgressBar value={domains.PERSONAL.score} label={`ด้านคุณลักษณะส่วนบุคคล (${domains.PERSONAL.passedCount}/${domains.PERSONAL.itemCount} ข้อ)`} size="md" />
                  )}
                </div>

                {/* Pass Criteria */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800">เกณฑ์ผ่าน (ครั้งที่ {selectedRound})</h3>

                  {criteria && (
                    <div className="space-y-2">
                      <div className={`flex items-center gap-2 text-xs ${criteria.professional.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {criteria.professional.passed ? '✅' : '❌'}
                        วิชาชีพ: {criteria.professional.actual}/{criteria.professional.required}
                      </div>
                      {criteria.social && (
                        <div className={`flex items-center gap-2 text-xs ${criteria.social.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {criteria.social.passed ? '✅' : '❌'}
                          สังคม: {criteria.social.actual}/{criteria.social.required}
                        </div>
                      )}
                      <div className={`flex items-center gap-2 text-xs ${criteria.personal.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {criteria.personal.passed ? '✅' : '❌'}
                        คุณลักษณะ: {criteria.personal.actual}/{criteria.personal.required}
                      </div>
                      <div className={`mt-2 pt-2 border-t text-sm font-semibold ${criteria.overall ? 'text-green-700' : 'text-red-700'}`}>
                        {criteria.overall ? '✅ ผ่านเกณฑ์' : '❌ ยังไม่ผ่านเกณฑ์'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4 flex items-center justify-center">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${statusColors[completeness.deck.status]?.bg} ${statusColors[completeness.deck.status]?.text} ${statusColors[completeness.deck.status]?.border} border`}>
                  {completeness.deck.status === 'READY' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  )}
                  {statusLabels[completeness.deck.status]}
                </span>
              </div>
            </div>

            {/* ส่วน B: รายการตัวชี้วัด */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ด้านวิชาชีพ */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  ด้านวิชาชีพ ({domains.PROFESSIONAL?.score || 0}%)
                </h2>
                <div className="space-y-2">
                  {Object.entries(items)
                    .filter(([id]) => id.startsWith('PRO_'))
                    .map(([id, item]: [string, any]) => (
                      <IndicatorCard
                        key={id}
                        item={item}
                        expanded={expandedIndicator === id}
                        onToggle={() => setExpandedIndicator(expandedIndicator === id ? null : id)}
                      />
                    ))}
                </div>
              </div>

              {/* ด้านสังคม */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  ด้านสังคม ({domains.SOCIAL?.score || 0}%)
                  {selectedRound < 3 && (
                    <span className="text-xs text-gray-400 font-normal">(เริ่มครั้งที่ 3)</span>
                  )}
                </h2>
                {selectedRound >= 3 ? (
                  <div className="space-y-2">
                    {Object.entries(items)
                      .filter(([id]) => id.startsWith('SOC_'))
                      .map(([id, item]: [string, any]) => (
                        <IndicatorCard
                          key={id}
                          item={item}
                          expanded={expandedIndicator === id}
                          onToggle={() => setExpandedIndicator(expandedIndicator === id ? null : id)}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-sm text-gray-400">ใช้ในครั้งที่ 3-4</p>
                  </div>
                )}

                {/* ด้านคุณลักษณะ - การพัฒนาตนเอง */}
                <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-500" />
                  การพัฒนาตนเอง
                  {selectedRound < 3 && (
                    <span className="text-xs text-gray-400 font-normal">(เน้นครั้งที่ 3-4)</span>
                  )}
                </h2>
                {selectedRound >= 3 ? (
                  <div className="space-y-2">
                    {Object.entries(items)
                      .filter(([id]) => id.startsWith('PER_2'))
                      .map(([id, item]: [string, any]) => (
                        <IndicatorCard
                          key={id}
                          item={item}
                          expanded={expandedIndicator === id}
                          onToggle={() => setExpandedIndicator(expandedIndicator === id ? null : id)}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-sm text-gray-400">เน้นในครั้งที่ 3-4</p>
                  </div>
                )}
              </div>

              {/* ด้านคุณลักษณะ - วินัย */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  วินัย คุณธรรม จริยธรรม ({domains.PERSONAL?.score || 0}%)
                </h2>
                <div className="space-y-2">
                  {Object.entries(items)
                    .filter(([id]) => id.startsWith('PER_1'))
                    .map(([id, item]: [string, any]) => (
                      <IndicatorCard
                        key={id}
                        item={item}
                        expanded={expandedIndicator === id}
                        onToggle={() => setExpandedIndicator(expandedIndicator === id ? null : id)}
                      />
                    ))}
                </div>
              </div>
            </div>

            {/* ส่วน C: Preview สไลด์ */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Preview สไลด์ (ครั้งที่ {selectedRound})
                </h2>
                <span className="text-sm text-gray-500">
                  {slides.length} สไลด์
                </span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {slides.map((slide: any) => (
                  <SlidePreviewCard key={slide.id} slide={slide} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
