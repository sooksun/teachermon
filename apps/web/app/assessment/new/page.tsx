'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';

type CompetencyLevel = 'NEEDS_SUPPORT' | 'FAIR' | 'GOOD' | 'EXCELLENT';
type AssessmentPeriod = 'BEFORE' | 'MID' | 'AFTER';

export default function NewAssessmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    teacherId: '',
    assessmentPeriod: 'MID' as AssessmentPeriod,
    pedagogyScore: 3,
    classroomScore: 3,
    communityScore: 3,
    professionalismScore: 3,
    notes: '',
  });

  // Fetch teachers
  const { data: teachersData, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await apiClient.get('/teachers');
      return response.data;
    },
  });

  // Extract teachers array from response
  const teachers = Array.isArray(teachersData) ? teachersData : teachersData?.data || [];

  // Create assessment mutation
  const createAssessment = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/assessment/competency', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      router.push('/assessment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate overall level
    const avgScore = (formData.pedagogyScore + formData.classroomScore + 
                     formData.communityScore + formData.professionalismScore) / 4;
    
    let overallLevel: CompetencyLevel;
    if (avgScore >= 4.5) overallLevel = 'EXCELLENT';
    else if (avgScore >= 3.5) overallLevel = 'GOOD';
    else if (avgScore >= 2.5) overallLevel = 'FAIR';
    else overallLevel = 'NEEDS_SUPPORT';

    createAssessment.mutate({
      ...formData,
      overallLevel,
      assessor: user?.fullName || user?.email || 'Unknown', // ชื่อผู้ประเมิน
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Convert to number for range and number inputs
    const isNumericInput = type === 'number' || type === 'range';
    setFormData(prev => ({
      ...prev,
      [name]: isNumericInput ? Number(value) : value
    }));
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">เพิ่มการประเมินสมรรถนะ</h1>
          <p className="mt-1 text-sm text-gray-600">
            บันทึกผลการประเมินสมรรถนะครูตามกรอบ 4 มิติ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Teacher Selection */}
          <div>
            <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700">
              เลือกครู <span className="text-red-500">*</span>
            </label>
            <select
              id="teacherId"
              name="teacherId"
              required
              value={formData.teacherId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              disabled={loadingTeachers}
            >
              <option value="">-- เลือกครู --</option>
              {teachers?.map((teacher: any) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.fullName} - {teacher.school.schoolName}
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Period */}
          <div>
            <label htmlFor="assessmentPeriod" className="block text-sm font-medium text-gray-700">
              ช่วงการประเมิน <span className="text-red-500">*</span>
            </label>
            <select
              id="assessmentPeriod"
              name="assessmentPeriod"
              required
              value={formData.assessmentPeriod}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="BEFORE">ก่อนรับการพัฒนา (BEFORE)</option>
              <option value="MID">ระหว่างรับการพัฒนา (MID)</option>
              <option value="AFTER">หลังรับการพัฒนา (AFTER)</option>
            </select>
          </div>

          {/* Competency Scores */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900">คะแนนสมรรถนะ (1-5)</h3>
            
            {/* Pedagogy Score */}
            <div>
              <label htmlFor="pedagogyScore" className="block text-sm font-medium text-gray-700">
                1. มิติการสอน (Pedagogy)
              </label>
              <div className="mt-1 flex items-center gap-4">
                <input
                  type="range"
                  id="pedagogyScore"
                  name="pedagogyScore"
                  min="1"
                  max="5"
                  step="1"
                  value={formData.pedagogyScore}
                  onChange={handleChange}
                  className="flex-1"
                />
                <span className="w-12 text-center font-semibold text-primary-600">
                  {formData.pedagogyScore}
                </span>
              </div>
            </div>

            {/* Classroom Score */}
            <div>
              <label htmlFor="classroomScore" className="block text-sm font-medium text-gray-700">
                2. มิติการจัดการชั้นเรียน (Classroom Management)
              </label>
              <div className="mt-1 flex items-center gap-4">
                <input
                  type="range"
                  id="classroomScore"
                  name="classroomScore"
                  min="1"
                  max="5"
                  step="1"
                  value={formData.classroomScore}
                  onChange={handleChange}
                  className="flex-1"
                />
                <span className="w-12 text-center font-semibold text-primary-600">
                  {formData.classroomScore}
                </span>
              </div>
            </div>

            {/* Community Score */}
            <div>
              <label htmlFor="communityScore" className="block text-sm font-medium text-gray-700">
                3. มิติการเชื่อมโยงชุมชน (Community Engagement)
              </label>
              <div className="mt-1 flex items-center gap-4">
                <input
                  type="range"
                  id="communityScore"
                  name="communityScore"
                  min="1"
                  max="5"
                  step="1"
                  value={formData.communityScore}
                  onChange={handleChange}
                  className="flex-1"
                />
                <span className="w-12 text-center font-semibold text-primary-600">
                  {formData.communityScore}
                </span>
              </div>
            </div>

            {/* Professionalism Score */}
            <div>
              <label htmlFor="professionalismScore" className="block text-sm font-medium text-gray-700">
                4. มิติจิตวิญญาณครู (Teacher Professionalism)
              </label>
              <div className="mt-1 flex items-center gap-4">
                <input
                  type="range"
                  id="professionalismScore"
                  name="professionalismScore"
                  min="1"
                  max="5"
                  step="1"
                  value={formData.professionalismScore}
                  onChange={handleChange}
                  className="flex-1"
                />
                <span className="w-12 text-center font-semibold text-primary-600">
                  {formData.professionalismScore}
                </span>
              </div>
            </div>

            {/* Average Display */}
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">คะแนนเฉลี่ย:</span>
                <span className="text-2xl font-bold text-primary-600">
                  {((formData.pedagogyScore + formData.classroomScore + 
                     formData.communityScore + formData.professionalismScore) / 4).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              หมายเหตุ (จุดแข็ง / จุดที่ควรพัฒนา)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={5}
              value={formData.notes}
              onChange={handleChange}
              placeholder="บันทึกหมายเหตุ, จุดแข็ง, จุดที่ควรพัฒนา..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={createAssessment.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {createAssessment.isPending ? 'กำลังบันทึก...' : 'บันทึกการประเมิน'}
            </button>
          </div>

          {/* Error Message */}
          {createAssessment.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                เกิดข้อผิดพลาด: {(createAssessment.error as any)?.message || 'ไม่สามารถบันทึกได้'}
              </p>
            </div>
          )}
        </form>
      </div>
    </MainLayout>
  );
}
