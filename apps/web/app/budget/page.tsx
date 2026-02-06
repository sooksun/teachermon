'use client';

import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { formatThaiDate, formatThaiMonthYear } from '@/lib/utils';

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

const CATEGORY_COLORS = [
  '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

const RechartsPieChart = dynamic(
  () =>
    import('recharts').then((mod) => {
      const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = mod;
      return {
        default: ({ data }: { data: any[] }) => (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }: any) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  value.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท'
                }
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ),
      };
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] animate-pulse bg-gray-100 rounded" />
    ),
  },
);

const RechartsBarChart = dynamic(
  () =>
    import('recharts').then((mod) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
      return {
        default: ({ data }: { data: any[] }) => (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
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
              <Bar dataKey="total" fill="#0ea5e9" name="จำนวนเงิน" />
            </BarChart>
          </ResponsiveContainer>
        ),
      };
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] animate-pulse bg-gray-100 rounded" />
    ),
  },
);

export default function BudgetPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['budget-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/budget/summary');
      return res.data;
    },
  });

  const { data: report } = useQuery({
    queryKey: ['budget-report'],
    queryFn: async () => {
      const res = await apiClient.get('/budget/reports');
      return res.data;
    },
  });

  const { data: recentTx } = useQuery({
    queryKey: ['budget-recent-transactions'],
    queryFn: async () => {
      const res = await apiClient.get('/budget/transactions', {
        params: { limit: 10, page: 1 },
      });
      return res.data;
    },
  });

  if (loadingSummary) {
    return (
      <MainLayout>
        <div className="text-center py-12">กำลังโหลด...</div>
      </MainLayout>
    );
  }

  const pieData =
    report?.categoryBreakdown?.map((c: any) => ({
      name: CATEGORY_LABELS[c.category] || c.category,
      value: c.total,
    })) || [];

  const barData = (report?.monthlyBreakdown || []).map((m: any) => ({
    ...m,
    month: formatThaiMonthYear(m.month),
  }));

  const usagePercent =
    summary?.totalAllocated > 0
      ? Math.round((summary.totalUsed / summary.totalAllocated) * 100)
      : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">งบประมาณโครงการ</h1>
            <p className="mt-1 text-sm text-gray-600">
              ติดตามการบริหารการเงินในโครงการ
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/budget/transactions/new"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
            >
              + บันทึกรายจ่าย
            </Link>
            <Link
              href="/budget/reports"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              ดูรายงาน
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">งบจัดสรร</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {(summary?.totalAllocated ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </dd>
                    <dd className="text-xs text-gray-500">บาท</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">ใช้แล้ว (อนุมัติ)</dt>
                    <dd className="text-2xl font-semibold text-green-600">
                      {(summary?.totalUsed ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </dd>
                    <dd className="text-xs text-gray-500">({usagePercent}%)</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">รออนุมัติ</dt>
                    <dd className="text-2xl font-semibold text-yellow-600">
                      {(summary?.totalPending ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </dd>
                    <dd className="text-xs text-gray-500">{summary?.pendingCount ?? 0} รายการ</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm-7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">คงเหลือ</dt>
                    <dd className="text-2xl font-semibold text-indigo-600">
                      {(summary?.totalRemaining ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </dd>
                    <dd className="text-xs text-gray-500">บาท</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">สัดส่วนการใช้งบ</span>
            <span className="text-gray-500">{usagePercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                usagePercent > 90
                  ? 'bg-red-500'
                  : usagePercent > 70
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              สัดส่วนค่าใช้จ่ายตามหมวดหมู่
            </h3>
            {pieData.length > 0 ? (
              <RechartsPieChart data={pieData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                ยังไม่มีข้อมูลค่าใช้จ่าย
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ค่าใช้จ่ายรายเดือน
            </h3>
            {barData.length > 0 ? (
              <RechartsBarChart data={barData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                ยังไม่มีข้อมูลค่าใช้จ่าย
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">รายการจ่ายล่าสุด</h3>
            <Link
              href="/budget/transactions"
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              ดูทั้งหมด &rarr;
            </Link>
          </div>
          <div className="px-6 py-4">
            {recentTx?.data && recentTx.data.length > 0 ? (
              <div className="space-y-3">
                {recentTx.data.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {tx.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatThaiDate(tx.transactionDate)} &bull;{' '}
                        {CATEGORY_LABELS[tx.category] || tx.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {Number(tx.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          tx.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : tx.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {STATUS_LABELS[tx.status] || tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">ยังไม่มีรายการจ่าย</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
