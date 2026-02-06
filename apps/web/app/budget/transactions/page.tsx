'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import dayjs from 'dayjs';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { formatThaiDate } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { toast } from 'react-toastify';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';

const CATEGORY_LABELS: Record<string, string> = {
  MENTORING: 'หนุนเสริม/นิเทศ',
  PLC: 'กิจกรรม PLC',
  TRAINING: 'อบรม/พัฒนา',
  MATERIAL: 'วัสดุ/อุปกรณ์',
  TRAVEL: 'ค่าเดินทาง',
  ACCOMMODATION: 'ค่าที่พัก',
  FOOD: 'ค่าอาหาร',
  PRINTING: 'พิมพ์/เอกสาร',
  COMMUNICATION: 'ค่าสื่อสาร',
  OTHER: 'อื่นๆ',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธ',
};

const CATEGORIES = [
  { value: '', label: 'ทุกหมวดหมู่' },
  { value: 'MENTORING', label: 'หนุนเสริม/นิเทศ' },
  { value: 'PLC', label: 'กิจกรรม PLC' },
  { value: 'TRAINING', label: 'อบรม/พัฒนา' },
  { value: 'MATERIAL', label: 'วัสดุ/อุปกรณ์' },
  { value: 'TRAVEL', label: 'ค่าเดินทาง' },
  { value: 'ACCOMMODATION', label: 'ค่าที่พัก' },
  { value: 'FOOD', label: 'ค่าอาหาร' },
  { value: 'PRINTING', label: 'พิมพ์/เอกสาร' },
  { value: 'COMMUNICATION', label: 'ค่าสื่อสาร' },
  { value: 'OTHER', label: 'อื่นๆ' },
];

const STATUSES = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'PENDING', label: 'รออนุมัติ' },
  { value: 'APPROVED', label: 'อนุมัติแล้ว' },
  { value: 'REJECTED', label: 'ปฏิเสธ' },
];

export default function TransactionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
  });

  const isAdminOrPM = user && ['ADMIN', 'PROJECT_MANAGER'].includes(user.role);

  const { data, isLoading } = useQuery({
    queryKey: ['budget-transactions', filters],
    queryFn: async () => {
      const params: any = { page: filters.page, limit: 20 };
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const res = await apiClient.get('/budget/transactions', { params });
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      rejectionReason,
    }: {
      id: string;
      action: 'APPROVED' | 'REJECTED';
      rejectionReason?: string;
    }) => {
      const res = await apiClient.patch(`/budget/transactions/${id}/approve`, {
        action,
        rejectionReason,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('อัปเดตสถานะสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
    },
    onError: () => {
      toast.error('เกิดข้อผิดพลาด');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/budget/transactions/${id}`);
    },
    onSuccess: () => {
      toast.success('ลบรายการสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
    },
    onError: () => {
      toast.error('เกิดข้อผิดพลาด');
    },
  });

  const handleApprove = (id: string) => {
    if (confirm('ยืนยันอนุมัติรายการนี้?')) {
      approveMutation.mutate({ id, action: 'APPROVED' });
    }
  };

  const handleReject = (id: string) => {
    const reason = prompt('กรุณาระบุเหตุผลที่ปฏิเสธ:');
    if (reason !== null) {
      approveMutation.mutate({ id, action: 'REJECTED', rejectionReason: reason });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('ยืนยันลบรายการนี้?')) {
      deleteMutation.mutate(id);
    }
  };

  const transactions = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายการจ่ายทั้งหมด</h1>
            <p className="mt-1 text-sm text-gray-600">
              {data?.total || 0} รายการ
            </p>
          </div>
          <Link
            href="/budget/transactions/new"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
          >
            + บันทึกรายจ่าย
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">หมวดหมู่</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">สถานะ</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ตั้งแต่วันที่</label>
              <ThaiDatePicker
                value={filters.startDate ? dayjs(filters.startDate) : null}
                onChange={(date) => setFilters({ ...filters, startDate: date ? date.format('YYYY-MM-DD') : '', page: 1 })}
                className="w-full"
                placeholder="เลือกวันที่"
                allowClear
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ถึงวันที่</label>
              <ThaiDatePicker
                value={filters.endDate ? dayjs(filters.endDate) : null}
                onChange={(date) => setFilters({ ...filters, endDate: date ? date.format('YYYY-MM-DD') : '', page: 1 })}
                className="w-full"
                placeholder="เลือกวันที่"
                allowClear
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-12">กำลังโหลด...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">ไม่พบรายการ</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">รายละเอียด</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">หมวดหมู่</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">จำนวนเงิน</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatThaiDate(tx.transactionDate)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {tx.description}
                      </p>
                      {tx.recipient && (
                        <p className="text-xs text-gray-500">ผู้รับ: {tx.recipient}</p>
                      )}
                      {tx.receiptNumber && (
                        <p className="text-xs text-gray-500">ใบเสร็จ: {tx.receiptNumber}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {CATEGORY_LABELS[tx.category] || tx.category}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
                      {Number(tx.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          tx.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : tx.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {STATUS_LABELS[tx.status] || tx.status}
                      </span>
                      {tx.status === 'REJECTED' && tx.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1">{tx.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {tx.status === 'PENDING' && isAdminOrPM && (
                          <>
                            <button
                              onClick={() => handleApprove(tx.id)}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => handleReject(tx.id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              ปฏิเสธ
                            </button>
                          </>
                        )}
                        {tx.status === 'PENDING' && (
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            ลบ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                หน้า {filters.page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                  disabled={filters.page <= 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  ก่อนหน้า
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(totalPages, filters.page + 1) })}
                  disabled={filters.page >= totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
