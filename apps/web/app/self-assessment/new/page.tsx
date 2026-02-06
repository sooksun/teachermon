'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { ScoreSelector } from '@/components/self-assessment/score-selector';
import { PortfolioSelector } from '@/components/self-assessment/portfolio-selector';
import { PERIOD_MAP, LEVEL_MAP } from '@/lib/self-assessment-constants';

export default function NewSelfAssessmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    assessmentPeriod: 'BEFORE',
    pedagogyScore: 0,
    classroomScore: 0,
    communityScore: 0,
    professionalismScore: 0,
    pedagogyReflection: '',
    classroomReflection: '',
    communityReflection: '',
    professionalismReflection: '',
    overallLevel: 'GOOD',
    strengths: '',
    areasForImprovement: '',
    actionPlan: '',
    portfolioItemIds: [] as string[],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/self-assessment', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('บันทึกการประเมินสำเร็จ', {
        position: 'top-right',
        autoClose: 3000,
      });
      router.push('/self-assessment');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      const response = await apiClient.patch(`/self-assessment/${assessmentId}/submit`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('ส่งการประเมินสำเร็จ', {
        position: 'top-right',
        autoClose: 3000,
      });
      router.push('/self-assessment');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'เกิดข้อผิดพลาดในการส่ง', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent, shouldSubmit: boolean = false) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast.warning('กรุณาให้คะแนนทั้ง 4 ด้าน (ค่าต้องมากกว่า 0)', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    setIsSaving(true);

    try {
      // สร้างการประเมิน
      const assessment = await createMutation.mutateAsync(formData);

      // ถ้าต้องการ submit เลย
      if (shouldSubmit && assessment.id) {
        await submitMutation.mutateAsync(assessment.id);
      } else {
        // ถ้าแค่ save จะ redirect ใน onSuccess ของ createMutation
      }
    } catch (error: any) {
      // Error handling อยู่ใน onError ของ mutations
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.pedagogyScore > 0 &&
      formData.classroomScore > 0 &&
      formData.communityScore > 0 &&
      formData.professionalismScore > 0
    );
  };

  const averageScore =
    formData.pedagogyScore &&
    formData.classroomScore &&
    formData.communityScore &&
    formData.professionalismScore
      ? (
          (formData.pedagogyScore +
            formData.classroomScore +
            formData.communityScore +
            formData.professionalismScore) /
          4
        ).toFixed(2)
      : '0.00';

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              สร้างการประเมินตนเอง
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              แบบสรุปผลการประเมินการเตรียมความพร้อมและพัฒนาอย่างเข้ม
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← ย้อนกลับ
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Assessment Period */}
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              ข้อมูลการประเมิน
            </h2>

            <div>
              <label
                htmlFor="assessmentPeriod"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ช่วงเวลาการประเมิน <span className="text-red-500">*</span>
              </label>
              <select
                id="assessmentPeriod"
                value={formData.assessmentPeriod}
                onChange={(e) =>
                  setFormData({ ...formData, assessmentPeriod: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
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
                คะแนนประเมินตนเอง (1-5)
              </h2>
              {isFormValid() && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">คะแนนเฉลี่ย</div>
                  <div className="text-xl font-bold text-primary-600">
                    {averageScore}
                  </div>
                </div>
              )}
            </div>

            {/* Pedagogy Score */}
            <div className="space-y-3">
              <ScoreSelector
                label="1. การพัฒนาการสอน (Pedagogy)"
                value={formData.pedagogyScore}
                onChange={(value) =>
                  setFormData({ ...formData, pedagogyScore: value })
                }
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การสะท้อนคิด (Reflection)
                </label>
                <textarea
                  value={formData.pedagogyReflection}
                  onChange={(e) =>
                    setFormData({ ...formData, pedagogyReflection: e.target.value })
                  }
                  rows={3}
                  placeholder="ฉันพัฒนาการสอนอย่างไร? มีการเปลี่ยนแปลงอะไรบ้าง?"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                />
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Classroom Score */}
            <div className="space-y-3">
              <ScoreSelector
                label="2. การจัดการชั้นเรียน (Classroom Management)"
                value={formData.classroomScore}
                onChange={(value) =>
                  setFormData({ ...formData, classroomScore: value })
                }
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การสะท้อนคิด
                </label>
                <textarea
                  value={formData.classroomReflection}
                  onChange={(e) =>
                    setFormData({ ...formData, classroomReflection: e.target.value })
                  }
                  rows={3}
                  placeholder="ฉันจัดการชั้นเรียนอย่างไร? นักเรียนมีส่วนร่วมหรือไม่?"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                />
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Community Score */}
            <div className="space-y-3">
              <ScoreSelector
                label="3. การทำงานกับชุมชน (Community Engagement)"
                value={formData.communityScore}
                onChange={(value) =>
                  setFormData({ ...formData, communityScore: value })
                }
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การสะท้อนคิด
                </label>
                <textarea
                  value={formData.communityReflection}
                  onChange={(e) =>
                    setFormData({ ...formData, communityReflection: e.target.value })
                  }
                  rows={3}
                  placeholder="ฉันมีส่วนร่วมกับชุมชนอย่างไร? มีความสัมพันธ์อย่างไร?"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                />
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Professionalism Score */}
            <div className="space-y-3">
              <ScoreSelector
                label="4. ความเป็นมืออาชีพ (Professionalism)"
                value={formData.professionalismScore}
                onChange={(value) =>
                  setFormData({ ...formData, professionalismScore: value })
                }
                required
              />
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
                  rows={3}
                  placeholder="ฉันแสดงความเป็นมืออาชีพอย่างไร? พัฒนาตนเองอย่างต่อเนื่องหรือไม่?"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
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
              <label
                htmlFor="overallLevel"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ระดับความสามารถโดยรวม <span className="text-red-500">*</span>
              </label>
              <select
                id="overallLevel"
                value={formData.overallLevel}
                onChange={(e) =>
                  setFormData({ ...formData, overallLevel: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
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
                rows={3}
                placeholder="จุดแข็งหรือความสามารถพิเศษของฉันคืออะไร?"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
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
                rows={3}
                placeholder="ฉันต้องพัฒนาในด้านใดบ้าง?"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
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
                rows={4}
                placeholder="ฉันจะพัฒนาตนเองอย่างไรในช่วงเวลาต่อไป?"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>

          {/* Portfolio Items */}
          {user?.teacherId && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                หลักฐานประกอบการประเมิน
              </h2>
              <PortfolioSelector
                selectedIds={formData.portfolioItemIds}
                onChange={(ids) =>
                  setFormData({ ...formData, portfolioItemIds: ids })
                }
                teacherId={user.teacherId}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={!isFormValid() || isSaving}
                className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกร่าง'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={!isFormValid() || isSaving}
                className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'กำลังส่ง...' : 'บันทึกและส่ง'}
              </button>
            </div>

            {/* Validation Message */}
            {!isFormValid() && (
              <p className="mt-3 text-sm text-red-600 text-center">
                กรุณาให้คะแนนทั้ง 4 ด้าน (ค่าต้องมากกว่า 0)
              </p>
            )}

            {/* Average Score Display */}
            {isFormValid() && (
              <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary-900">
                    คะแนนเฉลี่ยของคุณ:
                  </span>
                  <span className="text-2xl font-bold text-primary-700">
                    {averageScore} / 5.00
                  </span>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
