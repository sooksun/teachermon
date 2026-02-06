'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { formatThaiDate } from '@/lib/utils';

export default function MentoringDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: visit, isLoading, error } = useQuery({
    queryKey: ['mentoring-visit', id],
    queryFn: async () => {
      const response = await apiClient.get(`/mentoring/${id}`);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete(`/mentoring/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentoring-visits'] });
      toast.success('ลบข้อมูลสำเร็จ', {
        position: 'top-right',
        autoClose: 3000,
      });
      router.push('/mentoring');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const handleDelete = () => {
    const toastId = toast.info(
      <div className="flex flex-col gap-3 py-1">
        <p className="font-semibold text-gray-900">ยืนยันการลบข้อมูล</p>
        <p className="text-sm text-gray-600">
          คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลการลงพื้นที่นี้? การกระทำนี้ไม่สามารถยกเลิกได้
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

  if (error || !visit) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-600">ไม่พบข้อมูลการลงพื้นที่</p>
          <Link
            href="/mentoring"
            className="mt-4 inline-block text-primary-600 hover:text-primary-800"
          >
            ← กลับไปหน้ารายการ
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/mentoring"
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
            >
              ← กลับไปหน้ารายการ
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              รายละเอียดการลงพื้นที่
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {visit.teacher?.fullName} - {visit.teacher?.school?.schoolName}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/mentoring/${id}/edit`}
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
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">ครูที่รับการหนุนเสริม</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {visit.teacher?.fullName}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {visit.teacher?.position}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">โรงเรียน</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {visit.teacher?.school?.schoolName}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {visit.teacher?.school?.province} • {visit.teacher?.school?.region}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">วันที่ลงพื้นที่</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {formatThaiDate(visit.visitDate, 'D MMMM BBBB')}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">ประเภทการลงพื้นที่</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {visit.visitType}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">ผู้สังเกต</h3>
                <p className="text-lg font-semibold text-gray-900">{visit.observer}</p>
              </div>

              {visit.followUpRequired && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">สถานะ</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    ⚠️ ต้องติดตามต่อ
                  </span>
                </div>
              )}
            </div>

            {/* Objectives */}
            {visit.objectives && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">วัตถุประสงค์</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{visit.objectives}</p>
                </div>
              </div>
            )}

            {/* Activities */}
            {visit.activities && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">กิจกรรมที่ดำเนินการ</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{visit.activities}</p>
                </div>
              </div>
            )}

            {/* Strengths */}
            {visit.strengths && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  จุดเด่น
                </h3>
                <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{visit.strengths}</p>
                </div>
              </div>
            )}

            {/* Challenges */}
            {visit.challenges && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  ความท้าทาย
                </h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{visit.challenges}</p>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {visit.suggestions && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  ข้อเสนอแนะ
                </h3>
                <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{visit.suggestions}</p>
                </div>
              </div>
            )}

            {/* Follow-up Plan */}
            {visit.followUpPlan && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">แผนการติดตาม</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{visit.followUpPlan}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {visit.notes && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">หมายเหตุ</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{visit.notes}</p>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                  <p>สร้างเมื่อ: {new Date(visit.createdAt).toLocaleString('th-TH')}</p>
                  {visit.updatedAt && visit.updatedAt !== visit.createdAt && (
                    <p className="mt-1">
                      แก้ไขล่าสุด: {new Date(visit.updatedAt).toLocaleString('th-TH')}
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
