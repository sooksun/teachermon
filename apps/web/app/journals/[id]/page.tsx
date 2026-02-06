'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatThaiMonthYear } from '@/lib/utils';

export default function JournalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const id = params.id as string;

  const { data: journal, isLoading, error } = useQuery({
    queryKey: ['journal', id],
    queryFn: async () => {
      const response = await apiClient.get(`/journals/${id}`);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete(`/journals/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      toast.success('ลบ Journal สำเร็จ', {
        position: 'top-right',
        autoClose: 3000,
      });
      router.push('/journals');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ Journal', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const handleDelete = () => {
    const toastId = toast.info(
      <div className="flex flex-col gap-3 py-1">
        <p className="font-semibold text-gray-900">ยืนยันการลบ Journal</p>
        <p className="text-sm text-gray-600">
          คุณแน่ใจหรือไม่ว่าต้องการลบ Journal นี้? การกระทำนี้ไม่สามารถยกเลิกได้
        </p>
        <div className="flex gap-2 justify-end mt-2">
          <button
            type="button"
            onClick={() => {
              toast.dismiss(toastId);
              deleteMutation.mutate();
            }}
            className="px-4 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
          >
            ลบ
          </button>
          <button
            type="button"
            onClick={() => toast.dismiss(toastId)}
            className="px-4 py-1.5 bg-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-400"
          >
            ยกเลิก
          </button>
        </div>
      </div>,
      {
        position: 'top-center',
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: true,
      }
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !journal) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-600">ไม่พบข้อมูล Journal</p>
          <Link
            href="/journals"
            className="mt-4 inline-block text-primary-600 hover:text-primary-800"
          >
            ← กลับไปหน้ารายการ
          </Link>
        </div>
      </MainLayout>
    );
  }

  const canEdit = user?.role === 'TEACHER' && user?.teacherId === journal.teacherId;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/journals"
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
            >
              ← กลับไปหน้ารายการ
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              บันทึกการสะท้อนตนเอง
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {formatThaiMonthYear(journal.month)} - {journal.teacher?.fullName}
              {journal.teacher?.school && ` (${journal.teacher.school.schoolName})`}
            </p>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Link
                href={`/journals/${id}/edit`}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                แก้ไข
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteMutation.isPending ? 'กำลังลบ...' : 'ลบ'}
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 space-y-6">
            {/* Reflection Text */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                การสะท้อนตนเอง
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-line">
                  {journal.reflectionText}
                </p>
              </div>
            </div>

            {/* Success Story */}
            {journal.successStory && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  เรื่องเล่าความสำเร็จ
                </h3>
                <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">
                    {journal.successStory}
                  </p>
                </div>
              </div>
            )}

            {/* Difficulty */}
            {journal.difficulty && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  ความท้าทาย/ปัญหาที่พบ
                </h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">
                    {journal.difficulty}
                  </p>
                </div>
              </div>
            )}

            {/* Support Request */}
            {journal.supportRequest && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  ต้องการความช่วยเหลือ
                </h3>
                <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">
                    {journal.supportRequest}
                  </p>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                  <p>สร้างเมื่อ: {new Date(journal.createdAt).toLocaleString('th-TH')}</p>
                  {journal.updatedAt && journal.updatedAt !== journal.createdAt && (
                    <p className="mt-1">
                      แก้ไขล่าสุด: {new Date(journal.updatedAt).toLocaleString('th-TH')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
