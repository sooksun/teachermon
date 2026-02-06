'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { formatThaiMonthYear } from '@/lib/utils';
import { toast } from 'react-toastify';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';

const CATEGORY_LABELS: Record<string, string> = {
  MENTORING: 'ค่าหนุนเสริม/นิเทศ',
  PLC: 'ค่ากิจกรรม PLC',
  TRAINING: 'ค่าอบรม/พัฒนา',
  MATERIAL: 'ค่าวัสดุ/อุปกรณ์',
  TRAVEL: 'ค่าเดินทาง',
  ACCOMMODATION: 'ค่าที่พัก',
  FOOD: 'ค่าอาหาร',
  PRINTING: 'ค่าพิมพ์/เอกสาร',
  COMMUNICATION: 'ค่าสื่อสาร',
  OTHER: 'อื่นๆ',
};

const CATEGORY_COLORS = [
  '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

const RechartsBarChart = dynamic(
  () =>
    import('recharts').then((mod) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } = mod;
      return {
        default: ({ data, colors }: { data: any[]; colors?: string[] }) => (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) =>
                  value.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท'
                }
              />
              <Bar dataKey="total" name="จำนวนเงิน">
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={(colors || CATEGORY_COLORS)[index % (colors || CATEGORY_COLORS).length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ),
      };
    }),
  {
    ssr: false,
    loading: () => <div className="h-[350px] animate-pulse bg-gray-100 rounded" />,
  },
);

const RechartsLineChart = dynamic(
  () =>
    import('recharts').then((mod) => {
      const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
      return {
        default: ({ data }: { data: any[] }) => (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip
                formatter={(value: number) =>
                  value.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท'
                }
              />
              <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2} name="จำนวนเงิน" />
            </LineChart>
          </ResponsiveContainer>
        ),
      };
    }),
  {
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
  },
);

export default function BudgetReportsPage() {
  const [filters, setFilters] = useState({
    projectBudgetId: '',
    startDate: '',
    endDate: '',
  });
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const { data: budgets } = useQuery({
    queryKey: ['project-budgets'],
    queryFn: async () => {
      const res = await apiClient.get('/budget');
      return res.data;
    },
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ['budget-report-detail', filters],
    queryFn: async () => {
      const params: any = {};
      if (filters.projectBudgetId) params.projectBudgetId = filters.projectBudgetId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const res = await apiClient.get('/budget/reports', { params });
      return res.data;
    },
  });

  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      const params: any = {};
      if (filters.projectBudgetId) params.projectBudgetId = filters.projectBudgetId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await apiClient.get('/budget/reports/pdf', {
        params,
        responseType: 'text',
      });

      // เปิด HTML report ใน tab ใหม่ เพื่อใช้ print dialog บันทึกเป็น PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(response.data);
        printWindow.document.close();
      } else {
        toast.error('กรุณาอนุญาต popup เพื่อเปิดรายงาน');
      }
    } catch {
      toast.error('ไม่สามารถสร้างรายงานได้');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCSV = () => {
    if (!report) return;

    const headers = ['หมวดหมู่', 'จำนวนรายการ', 'จำนวนเงิน (บาท)', 'สัดส่วน (%)'];
    const rows = (report.categoryBreakdown || []).map((c: any) => [
      CATEGORY_LABELS[c.category] || c.category,
      c.count,
      c.total.toFixed(2),
      c.percentage,
    ]);

    // Add monthly data
    const monthlyHeaders = ['', '', '', ''];
    const monthlyTitle = ['สรุปรายเดือน', '', '', ''];
    const monthlyColHeaders = ['เดือน', 'จำนวนรายการ', 'จำนวนเงิน (บาท)', ''];
    const monthlyRows = (report.monthlyBreakdown || []).map((m: any) => [
      formatThaiMonthYear(m.month),
      m.count,
      m.total.toFixed(2),
      '',
    ]);

    const allRows = [
      headers,
      ...rows,
      ['', '', '', ''],
      ['รวม', '', report.totalUsed?.toFixed(2) || '0.00', '100%'],
      monthlyHeaders,
      monthlyTitle,
      monthlyColHeaders,
      ...monthlyRows,
    ];

    const csvContent =
      '\uFEFF' + allRows.map((row) => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `budget-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('ดาวน์โหลด CSV สำเร็จ');
  };

  const categoryChartData = (report?.categoryBreakdown || []).map((c: any) => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    total: c.total,
  }));

  // แปลงเดือนในกราฟเป็น พ.ศ.
  const monthlyChartData = (report?.monthlyBreakdown || []).map((m: any) => ({
    ...m,
    month: formatThaiMonthYear(m.month),
  }));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายงานการเงินโครงการ</h1>
            <p className="mt-1 text-sm text-gray-600">สรุปการใช้จ่ายงบประมาณตามหมวดหมู่และรายเดือน</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={!report}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              ส่งออก CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExportingPdf || !report}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isExportingPdf ? 'กำลังสร้าง...' : 'ส่งออก PDF'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">งบประมาณโครงการ</label>
              <select
                value={filters.projectBudgetId}
                onChange={(e) => setFilters({ ...filters, projectBudgetId: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">ทุกงบประมาณ</option>
                {budgets?.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.fiscalYear})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ตั้งแต่วันที่</label>
              <ThaiDatePicker
                value={filters.startDate ? dayjs(filters.startDate) : null}
                onChange={(date) => setFilters({ ...filters, startDate: date ? date.format('YYYY-MM-DD') : '' })}
                className="w-full"
                placeholder="เลือกวันที่"
                allowClear
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ถึงวันที่</label>
              <ThaiDatePicker
                value={filters.endDate ? dayjs(filters.endDate) : null}
                onChange={(date) => setFilters({ ...filters, endDate: date ? date.format('YYYY-MM-DD') : '' })}
                className="w-full"
                placeholder="เลือกวันที่"
                allowClear
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">กำลังโหลด...</div>
        ) : !report ? (
          <div className="text-center py-12 text-gray-400">ไม่มีข้อมูล</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-5 text-center">
                <p className="text-sm text-gray-500">งบจัดสรร</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {(report.totalAllocated ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-400">บาท</p>
              </div>
              <div className="bg-white rounded-lg shadow p-5 text-center">
                <p className="text-sm text-gray-500">ใช้แล้ว</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {(report.totalUsed ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-400">บาท</p>
              </div>
              <div className="bg-white rounded-lg shadow p-5 text-center">
                <p className="text-sm text-gray-500">คงเหลือ</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {(report.totalRemaining ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-400">บาท</p>
              </div>
              <div className="bg-white rounded-lg shadow p-5 text-center">
                <p className="text-sm text-gray-500">ใช้ไปแล้ว</p>
                <p className={`text-2xl font-bold mt-1 ${
                  (report.usagePercentage ?? 0) > 90 ? 'text-red-600' :
                  (report.usagePercentage ?? 0) > 70 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {report.usagePercentage ?? 0}%
                </p>
                <p className="text-xs text-gray-400">ของงบจัดสรร</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ค่าใช้จ่ายตามหมวดหมู่
                </h3>
                {categoryChartData.length > 0 ? (
                  <RechartsBarChart data={categoryChartData} />
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-gray-400">
                    ไม่มีข้อมูล
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  แนวโน้มค่าใช้จ่ายรายเดือน
                </h3>
                {monthlyChartData.length > 0 ? (
                  <RechartsLineChart data={monthlyChartData} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    ไม่มีข้อมูล
                  </div>
                )}
              </div>
            </div>

            {/* Category Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">สรุปตามหมวดหมู่</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">หมวดหมู่</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จำนวนรายการ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จำนวนเงิน (บาท)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">สัดส่วน</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.categoryBreakdown?.length > 0 ? (
                      report.categoryBreakdown.map((c: any, idx: number) => (
                        <tr key={c.category} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm text-gray-900 flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                            />
                            {CATEGORY_LABELS[c.category] || c.category}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700 text-right">{c.count}</td>
                          <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">
                            {c.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700 text-right">{c.percentage}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                          ไม่มีข้อมูล
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {report.categoryBreakdown?.length > 0 && (
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-6 py-3 text-sm font-bold text-gray-900">รวมทั้งหมด</td>
                        <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">
                          {report.categoryBreakdown.reduce((sum: number, c: any) => sum + c.count, 0)}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">
                          {(report.totalUsed ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">100%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Monthly Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">สรุปรายเดือน</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เดือน</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จำนวนรายการ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จำนวนเงิน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.monthlyBreakdown?.length > 0 ? (
                      report.monthlyBreakdown.map((m: any) => (
                        <tr key={m.month} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm text-gray-900">{formatThaiMonthYear(m.month)}</td>
                          <td className="px-6 py-3 text-sm text-gray-700 text-right">{m.count}</td>
                          <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">
                            {m.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                          ไม่มีข้อมูล
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
