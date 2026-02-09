'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';

interface AnalysisResultProps {
  job: {
    id: string;
    originalFilename: string | null;
    analysisMode: string;
    sourceType?: string;
    sourceUrl?: string | null;
    hasCover?: boolean;
    imageCount?: number;
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

type Tab = 'summary' | 'report' | 'indicators' | 'advice' | 'transcript';

function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  try {
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0]?.split('/')[0] || null;
    }
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.pathname.includes('/embed/')) {
      return u.pathname.split('/embed/')[1]?.split('?')[0] || null;
    }
    if (u.hostname.includes('youtube.com') && u.searchParams.has('v')) {
      return u.searchParams.get('v');
    }
  } catch {
    return null;
  }
  return null;
}

export function AnalysisResult({ job, onClose }: AnalysisResultProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [transcript, setTranscript] = useState<any>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [coverObjectUrl, setCoverObjectUrl] = useState<string | null>(null);
  const [rawImageUrls, setRawImageUrls] = useState<string[]>([]);
  const objectUrlsRef = useRef<string[]>([]);
  const report = job.analysisReport || {};
  const sourceType = job.sourceType || 'UPLOAD';
  const videoId = (job.sourceUrl && extractYouTubeVideoId(job.sourceUrl)) || null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'summary', label: 'สรุปภาพรวม' },
    { id: 'report', label: 'ผลวิเคราะห์' },
    { id: 'indicators', label: 'ตัวชี้วัด' },
    { id: 'advice', label: 'คำแนะนำ' },
    ...(job.hasTranscript ? [{ id: 'transcript' as Tab, label: 'ถอดเสียง' }] : []),
  ];

  // load transcript when tab is selected
  useEffect(() => {
    if (activeTab === 'transcript' && !transcript && !loadingTranscript) {
      setLoadingTranscript(true);
      apiClient
        .get(`/video-analysis/jobs/${job.id}/artifact/transcript.json`)
        .then((res) => setTranscript(res.data))
        .catch(() => setTranscript({ fullText: 'ไม่สามารถโหลดข้อความถอดเสียงได้' }))
        .finally(() => setLoadingTranscript(false));
    }
  }, [activeTab, job.id, transcript, loadingTranscript]);

  // load thumbnail: cover for UPLOAD/GDRIVE, raw images for IMAGES
  useEffect(() => {
    setCoverObjectUrl(null);
    setRawImageUrls([]);
    objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrlsRef.current = [];

    if ((sourceType === 'UPLOAD' || sourceType === 'GDRIVE') && job.hasCover) {
      apiClient
        .get(`/video-analysis/jobs/${job.id}/cover`, { responseType: 'blob' })
        .then((res) => {
          const url = URL.createObjectURL(res.data);
          objectUrlsRef.current.push(url);
          setCoverObjectUrl(url);
        })
        .catch(() => {});
    } else if (sourceType === 'IMAGES') {
      apiClient
        .get<{ files: string[] }>(`/video-analysis/jobs/${job.id}/raw-files`)
        .then((res) => {
          const files = res.data?.files?.slice(0, 6) || [];
          return Promise.all(
            files.map((filename) =>
              apiClient.get(`/video-analysis/jobs/${job.id}/raw/${encodeURIComponent(filename)}`, { responseType: 'blob' })
            )
          );
        })
        .then((responses) => {
          const list = responses.map((r) => URL.createObjectURL((r as any).data));
          list.forEach((u) => objectUrlsRef.current.push(u));
          setRawImageUrls(list);
        })
        .catch(() => {});
    }
  }, [job.id, sourceType, job.hasCover]);

  // revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current = [];
    };
  }, []);

  const subtitle = job.originalFilename || (videoId ? `YouTube: ${videoId}`) || 'ชิ้นงาน';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">ผลการวิเคราะห์ AI</h2>
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Thumbnail: Video (YouTube embed) or Cover / Image thumbnails */}
        {(videoId || coverObjectUrl || rawImageUrls.length > 0) && (
          <div className="px-5 pb-4 border-b">
            {videoId && (
              <div className="rounded-lg overflow-hidden bg-black">
                <iframe
                  title="YouTube วิดีโอ"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  className="w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <p className="text-xs text-gray-500 py-1.5 px-2">YouTube: {videoId}</p>
              </div>
            )}
            {!videoId && coverObjectUrl && (
              <div className="rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={coverObjectUrl}
                  alt="ภาพตัวอย่างชิ้นงาน"
                  className="w-full max-h-56 object-contain"
                />
                <p className="text-xs text-gray-500 py-1.5 px-2">{subtitle}</p>
              </div>
            )}
            {!videoId && !coverObjectUrl && rawImageUrls.length > 0 && (
              <div className="rounded-lg overflow-hidden">
                <div className="flex flex-wrap gap-2">
                  {rawImageUrls.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`รูปที่ ${i + 1}`}
                      className="h-24 w-auto max-w-[120px] object-cover rounded border border-gray-200"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 py-1.5 px-2">
                  รูปภาพที่วิเคราะห์ ({rawImageUrls.length} รูป)
                </p>
              </div>
            )}
          </div>
        )}

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

          {activeTab === 'transcript' && (
            <div className="space-y-4">
              {loadingTranscript ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                  <span className="ml-3 text-sm text-gray-500">กำลังโหลดข้อความถอดเสียง...</span>
                </div>
              ) : transcript ? (
                <>
                  {/* Meta info */}
                  {(transcript.language || transcript.duration || transcript.speakerCount) && (
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 pb-3 border-b">
                      {transcript.duration && <span>ความยาว: {transcript.duration}</span>}
                      {transcript.language && <span>ภาษา: {transcript.language === 'th' ? 'ไทย' : transcript.language}</span>}
                      {transcript.speakerCount && <span>ผู้พูด: {transcript.speakerCount} คน</span>}
                    </div>
                  )}

                  {/* Full text */}
                  {transcript.fullText && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">ข้อความทั้งหมด</h3>
                      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {transcript.fullText}
                      </div>
                    </div>
                  )}

                  {/* Segments */}
                  {transcript.segments?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        แยกตามช่วงเวลา ({transcript.segments.length} ช่วง)
                      </h3>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {transcript.segments.map((seg: any, i: number) => (
                          <div key={i} className="flex gap-3 p-2 rounded hover:bg-gray-50">
                            <span className="text-xs text-amber-600 font-mono whitespace-nowrap mt-0.5 min-w-[80px]">
                              {seg.start} – {seg.end}
                            </span>
                            <p className="text-sm text-gray-700">{seg.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">ไม่มีข้อมูลถอดเสียง</p>
              )}
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
