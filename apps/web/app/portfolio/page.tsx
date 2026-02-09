'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { PortfolioItemCard } from '@/components/portfolio/portfolio-item-card';
import { UploadModal } from '@/components/portfolio/upload-modal';
import { VideoLinkModal } from '@/components/portfolio/video-link-modal';
import { DetailModal } from '@/components/portfolio/detail-modal';

const EVIDENCE_TYPE_OPTIONS = [
  { value: '', label: 'ทุกประเภท' },
  { value: 'LESSON_PLAN', label: 'แผนการสอน' },
  { value: 'CLASSROOM_PHOTO', label: 'ภาพถ่ายการสอน' },
  { value: 'STUDENT_WORK', label: 'ผลงานนักเรียน' },
  { value: 'TEACHING_MATERIAL', label: 'สื่อการสอน' },
  { value: 'ASSESSMENT_RESULT', label: 'ผลการประเมิน' },
  { value: 'CERTIFICATE', label: 'ใบประกาศนียบัตร' },
  { value: 'OTHER', label: 'อื่นๆ' },
];

const ITEM_TYPE_OPTIONS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'FILE', label: 'ไฟล์' },
  { value: 'VIDEO_LINK', label: 'วิดีโอลิงก์' },
];

export default function PortfolioPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    evidenceType: '',
    itemType: '',
    search: '',
  });

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const teacherId = user?.teacherId;

  const { data: portfolioItems, isLoading, refetch } = useQuery({
    queryKey: ['portfolio-items', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      const response = await apiClient.get(`/evidence/teacher/${teacherId}`);
      return response.data;
    },
    enabled: !!teacherId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/evidence/${id}`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['portfolio-items'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
    },
  });

  const handleView = (item: any) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Filter items
  const filteredItems = portfolioItems?.filter((item: any) => {
    if (filters.evidenceType && item.evidenceType !== filters.evidenceType) {
      return false;
    }
    if (filters.itemType && item.itemType !== filters.itemType) {
      return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const title = item.itemType === 'VIDEO_LINK'
        ? item.videoTitle
        : item.originalFilename || item.standardFilename;
      return (
        title?.toLowerCase().includes(searchLower) ||
        item.aiSummary?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  // Calculate stats
  const stats = {
    total: portfolioItems?.length || 0,
    files: portfolioItems?.filter((i: any) => i.itemType === 'FILE').length || 0,
    videos: portfolioItems?.filter((i: any) => i.itemType === 'VIDEO_LINK').length || 0,
    totalSize: portfolioItems
      ?.filter((i: any) => i.fileSize)
      .reduce((sum: number, i: any) => sum + i.fileSize, 0) || 0,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              e-Portfolio
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              จัดการหลักฐานการสอนและพัฒนาวิชาชีพ
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/portfolio/development-summary"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              สรุปผลพัฒนาอย่างเข้ม
            </Link>
            <Link
              href="/portfolio/preview"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Preview ความสมบูรณ์
            </Link>
            <Link
              href="/portfolio/ai-analyze"
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              AI วิเคราะห์ชิ้นงาน
            </Link>
            <button
              onClick={() => setVideoModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              เพิ่มวิดีโอ
            </button>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              อัพโหลดไฟล์
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      ทั้งหมด
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.total}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      ไฟล์
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.files}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      วิดีโอ
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.videos}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      ขนาดรวม
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {(stats.totalSize / 1024 / 1024).toFixed(1)} MB
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ค้นหา
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="ชื่อไฟล์, คำอธิบาย..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
            </div>

            {/* Evidence Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ประเภทหลักฐาน
              </label>
              <select
                value={filters.evidenceType}
                onChange={(e) =>
                  setFilters({ ...filters, evidenceType: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                {EVIDENCE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Item Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ประเภทรายการ
              </label>
              <select
                value={filters.itemType}
                onChange={(e) =>
                  setFilters({ ...filters, itemType: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                {ITEM_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.evidenceType || filters.itemType || filters.search) && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-500">กรองโดย:</span>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ค้นหา: {filters.search}
                    <button
                      onClick={() => setFilters({ ...filters, search: '' })}
                      className="hover:text-blue-900"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                )}
                {filters.evidenceType && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {EVIDENCE_TYPE_OPTIONS.find(o => o.value === filters.evidenceType)?.label}
                    <button
                      onClick={() => setFilters({ ...filters, evidenceType: '' })}
                      className="hover:text-purple-900"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                )}
                {filters.itemType && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {ITEM_TYPE_OPTIONS.find(o => o.value === filters.itemType)?.label}
                    <button
                      onClick={() => setFilters({ ...filters, itemType: '' })}
                      className="hover:text-green-900"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                )}
                <button
                  onClick={() => setFilters({ evidenceType: '', itemType: '', search: '' })}
                  className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                >
                  ล้างทั้งหมด
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item: any) => (
              <PortfolioItemCard
                key={item.id}
                item={item}
                onView={handleView}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {portfolioItems?.length === 0
                ? 'ยังไม่มี Portfolio'
                : 'ไม่พบรายการที่ค้นหา'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {portfolioItems?.length === 0
                ? 'เริ่มต้นอัพโหลดไฟล์หรือเพิ่มวิดีโอลิงก์'
                : 'ลองเปลี่ยนเงื่อนไขการค้นหา'}
            </p>
            {portfolioItems?.length === 0 && (
              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  อัพโหลดไฟล์
                </button>
                <button
                  onClick={() => setVideoModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  เพิ่มวิดีโอ
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={refetch}
      />
      <VideoLinkModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        onSuccess={refetch}
      />
      <DetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        item={selectedItem}
      />
    </MainLayout>
  );
}
