'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { ScoreSelector } from '@/components/self-assessment/score-selector';
import { PortfolioSelector } from '@/components/self-assessment/portfolio-selector';
import { PERIOD_MAP, LEVEL_MAP } from '@/lib/self-assessment-constants';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { confirmToast, confirmDeleteToast } from '@/lib/utils/toast-helpers';

export default function SelfAssessmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const assessmentId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const { data: assessment, isLoading, refetch } = useQuery({
    queryKey: ['self-assessment', assessmentId],
    queryFn: async () => {
      const response = await apiClient.get(`/self-assessment/${assessmentId}`);
      return response.data;
    },
  });

  useEffect(() => {
    if (assessment && !formData) {
      setFormData({
        assessmentPeriod: assessment.assessmentPeriod,
        pedagogyScore: assessment.pedagogyScore,
        classroomScore: assessment.classroomScore,
        communityScore: assessment.communityScore,
        professionalismScore: assessment.professionalismScore,
        pedagogyReflection: assessment.pedagogyReflection || '',
        classroomReflection: assessment.classroomReflection || '',
        communityReflection: assessment.communityReflection || '',
        professionalismReflection: assessment.professionalismReflection || '',
        overallLevel: assessment.overallLevel,
        strengths: assessment.strengths || '',
        areasForImprovement: assessment.areasForImprovement || '',
        actionPlan: assessment.actionPlan || '',
        portfolioItemIds: assessment.portfolioItems?.map((item: any) => item.id) || [],
      });
    }
  }, [assessment, formData]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.put(`/self-assessment/${assessmentId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('บันทึกการแก้ไขสำเร็จ', {
        position: 'top-right',
        autoClose: 3000,
      });
      refetch();
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch(`/self-assessment/${assessmentId}/submit`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('ส่งการประเมินสำเร็จ', {
        position: 'top-right',
        autoClose: 3000,
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'เกิดข้อผิดพลาดในการส่ง', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/self-assessment/${assessmentId}`);
    },
    onSuccess: () => {
      toast.success('ลบการประเมินสำเร็จ', {
        position: 'top-right',
        autoClose: 3000,
      });
      router.push('/self-assessment');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync(formData);
    } catch (error: any) {
      // Error handling อยู่ใน onError ของ mutation
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    confirmToast(
      'คุณต้องการส่งการประเมินนี้หรือไม่? (จะไม่สามารถแก้ไขได้)',
      () => {
        submitMutation.mutate();
      }
    );
  };

  const handleDelete = async () => {
    confirmDeleteToast(
      'คุณต้องการลบการประเมินนี้หรือไม่?',
      () => {
        deleteMutation.mutate();
      }
    );
  };

  const formatThaiDate = (date: string) => {
    const d = new Date(date);
    const buddhistYear = d.getFullYear() + 543;
    return format(d, 'd MMMM yyyy', { locale: th }).replace(d.getFullYear().toString(), buddhistYear.toString());
  };

  const canEdit = assessment?.status === 'DRAFT';
  const canSubmit = assessment?.status === 'DRAFT';
  const canDelete = assessment?.status !== 'REVIEWED';

  const averageScore =
    formData && formData.pedagogyScore > 0
      ? (
          (formData.pedagogyScore +
            formData.classroomScore +
            formData.communityScore +
            formData.professionalismScore) /
          4
        ).toFixed(2)
      : '0.00';

  if (isLoading || !formData) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'แก้ไขการประเมินตนเอง' : 'รายละเอียดการประเมินตนเอง'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              สร้างเมื่อ: {formatThaiDate(assessment.createdAt)}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← ย้อนกลับ
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              assessment.status === 'DRAFT'
                ? 'bg-yellow-100 text-yellow-800'
                : assessment.status === 'SUBMITTED'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
            }`}
          >
            {assessment.status === 'DRAFT' && '📝 ร่าง'}
            {assessment.status === 'SUBMITTED' && '✓ ส่งแล้ว'}
            {assessment.status === 'REVIEWED' && '✓✓ ตรวจแล้ว'}
          </span>

          {assessment.status === 'SUBMITTED' && (
            <span className="text-sm text-gray-500">
              ส่งเมื่อ: {formatThaiDate(assessment.submittedAt)}
            </span>
          )}

          {assessment.status === 'REVIEWED' && (
            <span className="text-sm text-gray-500">
              ตรวจเมื่อ: {formatThaiDate(assessment.reviewedAt)}
            </span>
          )}
        </div>

        {/* Reviewer Comments (if reviewed) */}
        {assessment.status === 'REVIEWED' && assessment.reviewerComments && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5"
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
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900 mb-1">
                  ความเห็นผู้ตรวจสอบ
                </h3>
                <p className="text-sm text-green-800 whitespace-pre-wrap">
                  {assessment.reviewerComments}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning when submitted/reviewed */}
        {!canEdit && !isEditing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ℹ️ การประเมินนี้{assessment.status === 'SUBMITTED' ? 'ส่งแล้ว' : 'ตรวจสอบแล้ว'} ไม่สามารถแก้ไขได้
            </p>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Assessment Period */}
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              ข้อมูลการประเมิน
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ช่วงเวลาการประเมิน
              </label>
              <select
                value={formData.assessmentPeriod}
                onChange={(e) =>
                  setFormData({ ...formData, assessmentPeriod: e.target.value })
                }
                disabled={!isEditing}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {Object.entries(PERIOD_MAP).map(([key, value]) => (
                  <option key={key} value={key}>
                    {String(value)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scores Section */}
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                คะแนนประเมินตนเอง
              </h2>
              <div className="text-right">
                <div className="text-xs text-gray-500">คะแนนเฉลี่ย</div>
                <div className="text-xl font-bold text-primary-600">
                  {averageScore}
                </div>
              </div>
            </div>

            {/* Pedagogy */}
            <div className="space-y-3">
              {isEditing ? (
                <ScoreSelector
                  label="1. การพัฒนาการสอน (Pedagogy)"
                  value={formData.pedagogyScore}
                  onChange={(value) =>
                    setFormData({ ...formData, pedagogyScore: value })
                  }
                  required
                />
              ) : (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    1. การพัฒนาการสอน (Pedagogy)
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary-600">
                      {formData.pedagogyScore}
                    </span>
                    <span className="text-gray-500">/ 5</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การสะท้อนคิด
                </label>
                <textarea
                  value={formData.pedagogyReflection}
                  onChange={(e) =>
                    setFormData({ ...formData, pedagogyReflection: e.target.value })
                  }
                  disabled={!isEditing}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Classroom */}
            <div className="space-y-3">
              {isEditing ? (
                <ScoreSelector
                  label="2. การจัดการชั้นเรียน (Classroom Management)"
                  value={formData.classroomScore}
                  onChange={(value) =>
                    setFormData({ ...formData, classroomScore: value })
                  }
                  required
                />
              ) : (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    2. การจัดการชั้นเรียน (Classroom Management)
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary-600">
                      {formData.classroomScore}
                    </span>
                    <span className="text-gray-500">/ 5</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การสะท้อนคิด
                </label>
                <textarea
                  value={formData.classroomReflection}
                  onChange={(e) =>
                    setFormData({ ...formData, classroomReflection: e.target.value })
                  }
                  disabled={!isEditing}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Community */}
            <div className="space-y-3">
              {isEditing ? (
                <ScoreSelector
                  label="3. การทำงานกับชุมชน (Community Engagement)"
                  value={formData.communityScore}
                  onChange={(value) =>
                    setFormData({ ...formData, communityScore: value })
                  }
                  required
                />
              ) : (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    3. การทำงานกับชุมชน (Community Engagement)
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary-600">
                      {formData.communityScore}
                    </span>
                    <span className="text-gray-500">/ 5</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การสะท้อนคิด
                </label>
                <textarea
                  value={formData.communityReflection}
                  onChange={(e) =>
                    setFormData({ ...formData, communityReflection: e.target.value })
                  }
                  disabled={!isEditing}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Professionalism */}
            <div className="space-y-3">
              {isEditing ? (
                <ScoreSelector
                  label="4. ความเป็นมืออาชีพ (Professionalism)"
                  value={formData.professionalismScore}
                  onChange={(value) =>
                    setFormData({ ...formData, professionalismScore: value })
                  }
                  required
                />
              ) : (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    4. ความเป็นมืออาชีพ (Professionalism)
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary-600">
                      {formData.professionalismScore}
                    </span>
                    <span className="text-gray-500">/ 5</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การสะท้อนคิด
                </label>
                <textarea
                  value={formData.professionalismReflection}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professionalismReflection: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Overall Assessment */}
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              สรุปผลการประเมินโดยรวม
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ระดับความสามารถโดยรวม
              </label>
              <select
                value={formData.overallLevel}
                onChange={(e) =>
                  setFormData({ ...formData, overallLevel: e.target.value })
                }
                disabled={!isEditing}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {Object.entries(LEVEL_MAP).map(([key, value]) => (
                  <option key={key} value={key}>
                    {String(value)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จุดเด่น (Strengths)
              </label>
              <textarea
                value={formData.strengths}
                onChange={(e) =>
                  setFormData({ ...formData, strengths: e.target.value })
                }
                disabled={!isEditing}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จุดที่ต้องพัฒนา (Areas for Improvement)
              </label>
              <textarea
                value={formData.areasForImprovement}
                onChange={(e) =>
                  setFormData({ ...formData, areasForImprovement: e.target.value })
                }
                disabled={!isEditing}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                แผนการพัฒนา (Action Plan)
              </label>
              <textarea
                value={formData.actionPlan}
                onChange={(e) =>
                  setFormData({ ...formData, actionPlan: e.target.value })
                }
                disabled={!isEditing}
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Portfolio Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              หลักฐานประกอบการประเมิน
            </h2>

            {isEditing && user?.teacherId ? (
              <PortfolioSelector
                selectedIds={formData.portfolioItemIds}
                onChange={(ids) =>
                  setFormData({ ...formData, portfolioItemIds: ids })
                }
                teacherId={user.teacherId}
              />
            ) : (
              <div>
                {assessment.portfolioItems && assessment.portfolioItems.length > 0 ? (
                  <div className="space-y-2">
                    {assessment.portfolioItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <svg
                          className="w-5 h-5 text-gray-400 mt-0.5 mr-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {item.itemType === 'VIDEO_LINK'
                              ? item.videoTitle
                              : item.originalFilename || item.standardFilename}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.evidenceType}
                            {item.itemType === 'VIDEO_LINK' && ' - 📹 วิดีโอ'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">ไม่มีหลักฐานประกอบ</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              {/* Left: Delete Button */}
              <div>
                {canDelete && !isEditing && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'กำลังลบ...' : '🗑️ ลบการประเมิน'}
                  </button>
                )}
              </div>

              {/* Right: Action Buttons */}
              <div className="flex gap-3">
                {!isEditing && canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 border border-primary-600 rounded-md text-sm font-medium text-primary-700 bg-white hover:bg-primary-50 transition-colors"
                  >
                    ✏️ แก้ไข
                  </button>
                )}

                {!isEditing && canSubmit && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {submitMutation.isPending ? 'กำลังส่ง...' : '📤 ส่งการประเมิน'}
                  </button>
                )}

                {isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form data
                        setFormData({
                          assessmentPeriod: assessment.assessmentPeriod,
                          pedagogyScore: assessment.pedagogyScore,
                          classroomScore: assessment.classroomScore,
                          communityScore: assessment.communityScore,
                          professionalismScore: assessment.professionalismScore,
                          pedagogyReflection: assessment.pedagogyReflection || '',
                          classroomReflection: assessment.classroomReflection || '',
                          communityReflection: assessment.communityReflection || '',
                          professionalismReflection: assessment.professionalismReflection || '',
                          overallLevel: assessment.overallLevel,
                          strengths: assessment.strengths || '',
                          areasForImprovement: assessment.areasForImprovement || '',
                          actionPlan: assessment.actionPlan || '',
                          portfolioItemIds: assessment.portfolioItems?.map((item: any) => item.id) || [],
                        });
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'กำลังบันทึก...' : '💾 บันทึกการแก้ไข'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
