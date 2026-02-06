'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-toastify';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';

const CATEGORIES = [
  { value: 'MENTORING', label: 'ค่าหนุนเสริม/นิเทศ' },
  { value: 'PLC', label: 'ค่ากิจกรรม PLC' },
  { value: 'TRAINING', label: 'ค่าอบรม/พัฒนา' },
  { value: 'MATERIAL', label: 'ค่าวัสดุ/อุปกรณ์' },
  { value: 'TRAVEL', label: 'ค่าเดินทาง' },
  { value: 'ACCOMMODATION', label: 'ค่าที่พัก' },
  { value: 'FOOD', label: 'ค่าอาหาร' },
  { value: 'PRINTING', label: 'ค่าพิมพ์/เอกสาร' },
  { value: 'COMMUNICATION', label: 'ค่าสื่อสาร' },
  { value: 'OTHER', label: 'อื่นๆ' },
];

const ACTIVITY_TYPES = [
  { value: '', label: '-- ไม่เชื่อมโยง --' },
  { value: 'MENTORING', label: 'การหนุนเสริม' },
  { value: 'PLC', label: 'กิจกรรม PLC' },
  { value: 'TRAINING', label: 'การอบรม' },
];

export default function NewTransactionPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    projectBudgetId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'MENTORING',
    description: '',
    recipient: '',
    receiptNumber: '',
    relatedActivityType: '',
    relatedActivityId: '',
  });

  const { data: budgets } = useQuery({
    queryKey: ['project-budgets'],
    queryFn: async () => {
      const res = await apiClient.get('/budget');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/budget/transactions', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('บันทึกรายจ่ายสำเร็จ รอการอนุมัติ');
      router.push('/budget/transactions');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'เกิดข้อผิดพลาด';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      toast.error('กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }
    if (!formData.projectBudgetId) {
      toast.error('กรุณาเลือกงบประมาณโครงการ');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('กรุณาระบุรายละเอียด');
      return;
    }

    const payload: any = {
      projectBudgetId: formData.projectBudgetId,
      transactionDate: formData.transactionDate,
      amount,
      category: formData.category,
      description: formData.description.trim(),
    };

    if (formData.recipient.trim()) payload.recipient = formData.recipient.trim();
    if (formData.receiptNumber.trim()) payload.receiptNumber = formData.receiptNumber.trim();
    if (formData.relatedActivityType) payload.relatedActivityType = formData.relatedActivityType;
    if (formData.relatedActivityId.trim()) payload.relatedActivityId = formData.relatedActivityId.trim();

    createMutation.mutate(payload);
  };

  // Auto-select first budget if only one
  if (budgets && budgets.length > 0 && !formData.projectBudgetId) {
    const activeBudgets = budgets.filter((b: any) => b.isActive);
    if (activeBudgets.length === 1) {
      setFormData((prev) => ({ ...prev, projectBudgetId: activeBudgets[0].id }));
    }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">บันทึกรายจ่ายใหม่</h1>
          <p className="mt-1 text-sm text-gray-600">
            กรอกข้อมูลรายจ่าย รายการจะอยู่ในสถานะ "รออนุมัติ" จนกว่าจะได้รับการอนุมัติ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">ข้อมูลรายจ่าย</h2>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Project Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                งบประมาณโครงการ <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.projectBudgetId}
                onChange={(e) => setFormData({ ...formData, projectBudgetId: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">-- เลือกงบประมาณ --</option>
                {budgets
                  ?.filter((b: any) => b.isActive)
                  .map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.fiscalYear}) - งบ{' '}
                      {Number(b.totalAllocated).toLocaleString('th-TH')} บาท
                    </option>
                  ))}
              </select>
              {budgets && budgets.filter((b: any) => b.isActive).length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  ยังไม่มีงบประมาณโครงการ กรุณาสร้างก่อน
                </p>
              )}
            </div>

            {/* Date & Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่ <span className="text-red-500">*</span>
                </label>
                <ThaiDatePicker
                  value={formData.transactionDate ? dayjs(formData.transactionDate) : null}
                  onChange={(date) => setFormData({ ...formData, transactionDate: date ? date.format('YYYY-MM-DD') : '' })}
                  className="w-full"
                  placeholder="เลือกวันที่"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนเงิน (บาท) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                required
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รายละเอียด <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="อธิบายรายละเอียดค่าใช้จ่าย..."
                required
              />
            </div>

            {/* Recipient & Receipt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ผู้รับเงิน</label>
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="ชื่อผู้รับเงิน"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่ใบเสร็จ</label>
                <input
                  type="text"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="เลขที่ใบเสร็จ/ใบสำคัญ"
                />
              </div>
            </div>

            {/* Related Activity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เชื่อมโยงกิจกรรม (ถ้ามี)
                </label>
                <select
                  value={formData.relatedActivityType}
                  onChange={(e) => setFormData({ ...formData, relatedActivityType: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  {ACTIVITY_TYPES.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
              {formData.relatedActivityType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID กิจกรรม
                  </label>
                  <input
                    type="text"
                    value={formData.relatedActivityId}
                    onChange={(e) => setFormData({ ...formData, relatedActivityId: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="ID ของกิจกรรมที่เกี่ยวข้อง"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 rounded-b-lg">
            <button
              type="button"
              onClick={() => router.push('/budget/transactions')}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกรายจ่าย'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
