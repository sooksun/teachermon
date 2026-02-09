'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { QuotaIndicator } from '@/components/video-analysis/quota-indicator';
import { VideoUploadForm } from '@/components/video-analysis/video-upload-form';
import { JobStatusCard } from '@/components/video-analysis/job-status-card';
import { AnalysisResult } from '@/components/video-analysis/analysis-result';

export default function AIAnalyzePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  // ─── Quota ───
  const { data: quota } = useQuery({
    queryKey: ['analysis-quota'],
    queryFn: async () => {
      const res = await apiClient.get('/video-analysis/quota');
      return res.data;
    },
    refetchInterval: 30000, // refresh every 30s
  });

  // ─── Jobs list ───
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['analysis-jobs'],
    queryFn: async () => {
      const res = await apiClient.get('/video-analysis/jobs');
      return res.data;
    },
    refetchInterval: 5000, // poll every 5s for status updates
  });

  // ─── Delete job ───
  const deleteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await apiClient.delete(`/video-analysis/jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['analysis-quota'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
    },
  });

  const handleJobCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['analysis-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['analysis-quota'] });
  }, [queryClient]);

  const handleDelete = useCallback((jobId: string) => {
    if (confirm('ต้องการลบงานนี้หรือไม่? ข้อมูลทั้งหมดจะถูกลบถาวร')) {
      deleteMutation.mutate(jobId);
    }
  }, [deleteMutation]);

  const handleSelectJob = useCallback((job: any) => {
    setSelectedJob(job);
    setShowResult(true);
  }, []);

  // Split jobs by status
  const activeJobs = (jobs || []).filter((j: any) =>
    ['UPLOADING', 'UPLOADED', 'QUEUED', 'PROCESSING_ASR', 'ASR_DONE', 'PROCESSING_FRAMES', 'ANALYZING'].includes(j.status)
  );
  const completedJobs = (jobs || []).filter((j: any) => j.status === 'DONE');
  const failedJobs = (jobs || []).filter((j: any) =>
    ['FAILED', 'REJECTED_QUOTA'].includes(j.status)
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/portfolio"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  AI วิเคราะห์ชิ้นงาน
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  อัพโหลดวิดีโอหรือรูปภาพการสอน ให้ AI วิเคราะห์และให้คำแนะนำ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* คอลัมน์ซ้าย: พื้นที่ใช้งาน + วิเคราะห์เสร็จแล้ว | คอลัมน์ขวา: อัพโหลด */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ซ้าย: พื้นที่ใช้งาน แล้วตามด้วย วิเคราะห์เสร็จแล้ว */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <QuotaIndicator
              limitBytes={quota?.limitBytes || 1073741824}
              usageBytes={quota?.usageBytes || 0}
              remainingBytes={quota?.remainingBytes || 1073741824}
            />
            {completedJobs.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  วิเคราะห์เสร็จแล้ว ({completedJobs.length})
                </h2>
                <div className="space-y-4">
                  {completedJobs.map((job: any) => (
                    <JobStatusCard
                      key={job.id}
                      job={job}
                      onSelect={handleSelectJob}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* ขวา: อัพโหลดชิ้นงาน */}
          <div className="lg:col-span-2">
            <VideoUploadForm
              onJobCreated={handleJobCreated}
              remainingBytes={quota?.remainingBytes || 1073741824}
            />
          </div>
        </div>

        {/* กำลังประมวลผล */}
        {activeJobs.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              กำลังประมวลผล ({activeJobs.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeJobs.map((job: any) => (
                <JobStatusCard
                  key={job.id}
                  job={job}
                  onSelect={handleSelectJob}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* ล้มเหลว */}
        {failedJobs.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              ล้มเหลว ({failedJobs.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {failedJobs.map((job: any) => (
                <JobStatusCard
                  key={job.id}
                  job={job}
                  onSelect={handleSelectJob}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!jobsLoading && (!jobs || jobs.length === 0) && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">ยังไม่มีงานวิเคราะห์</h3>
            <p className="mt-1 text-sm text-gray-500">อัพโหลดวิดีโอหรือรูปภาพการสอนเพื่อเริ่มต้น</p>
          </div>
        )}
      </div>

      {/* Analysis Result Modal */}
      {showResult && selectedJob && (
        <AnalysisResult
          job={selectedJob}
          onClose={() => {
            setShowResult(false);
            setSelectedJob(null);
          }}
        />
      )}
    </MainLayout>
  );
}
