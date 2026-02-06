'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { MainLayout } from '@/components/layout/main-layout';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { confirmDeleteToast } from '@/lib/utils/toast-helpers';

const CONSENT_TYPES = {
  DATA_COLLECTION: {
    label: 'การเก็บรวบรวมข้อมูล',
    description: 'ยินยอมให้ระบบเก็บรวบรวมข้อมูลส่วนบุคคลเพื่อให้บริการ',
    required: true,
  },
  DATA_PROCESSING: {
    label: 'การประมวลผลข้อมูล',
    description: 'ยินยอมให้ระบบประมวลผลข้อมูลเพื่อวิเคราะห์และประเมินผล',
    required: true,
  },
  DATA_SHARING: {
    label: 'การเปิดเผยข้อมูล',
    description: 'ยินยอมให้เปิดเผยข้อมูลแก่หน่วยงานที่เกี่ยวข้อง (ตามที่ระบุ)',
    required: false,
  },
  MARKETING: {
    label: 'การตลาด',
    description: 'ยินยอมให้ส่งข้อมูลข่าวสารและโปรโมชัน',
    required: false,
  },
  ANALYTICS: {
    label: 'การวิเคราะห์ข้อมูล',
    description: 'ยินยอมให้ใช้ข้อมูลเพื่อการวิเคราะห์และพัฒนาระบบ',
    required: false,
  },
};

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [myData, setMyData] = useState<any>(null);

  const { data: consents, isLoading } = useQuery({
    queryKey: ['pdpa-consents'],
    queryFn: async () => {
      const response = await apiClient.get('/pdpa/consents');
      return response.data;
    },
  });

  const { data: summary } = useQuery({
    queryKey: ['pdpa-consents-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/pdpa/consents/summary');
      return response.data;
    },
  });

  const grantMutation = useMutation({
    mutationFn: async (consentType: string) => {
      const response = await apiClient.post('/pdpa/consents', {
        consentType,
        privacyPolicyVersion: '1.0',
        termsVersion: '1.0',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdpa-consents'] });
      queryClient.invalidateQueries({ queryKey: ['pdpa-consents-summary'] });
      toast.success('ให้ความยินยอมสำเร็จ', {
        position: 'top-right',
        autoClose: 3000,
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'เกิดข้อผิดพลาด', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (consentType: string) => {
      const response = await apiClient.delete(`/pdpa/consents/${consentType}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdpa-consents'] });
      queryClient.invalidateQueries({ queryKey: ['pdpa-consents-summary'] });
      toast.success('ถอนความยินยอมสำเร็จ', {
        position: 'top-right',
        autoClose: 3000,
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'เกิดข้อผิดพลาด', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const getConsentStatus = (consentType: string) => {
    if (!consents) return 'PENDING';
    const consent = consents.find((c: any) => c.consentType === consentType);
    return consent?.status || 'PENDING';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      GRANTED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      REVOKED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
    };
    return badges[status as keyof typeof badges] || badges.PENDING;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      GRANTED: 'ยินยอมแล้ว',
      PENDING: 'รอการยินยอม',
      REVOKED: 'ถอนแล้ว',
      EXPIRED: 'หมดอายุ',
    };
    return labels[status as keyof typeof labels] || 'ไม่ทราบ';
  };

  const fetchMyDataMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.get('/pdpa/my-data');
      return res.data;
    },
    onSuccess: (data) => {
      setMyData(data);
      toast.success('โหลดข้อมูลสำเร็จ', { position: 'top-right', autoClose: 2000 });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'โหลดข้อมูลไม่สำเร็จ', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (format: 'json' | 'csv') => {
      const res = await apiClient.get(`/pdpa/export-my-data?format=${format}`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.format === 'json') {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([data.content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-data-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success('ดาวน์โหลดไฟล์สำเร็จ', { position: 'top-right', autoClose: 2000 });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Export ไม่สำเร็จ', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (body: { deleteAll?: boolean; anonymize?: boolean }) => {
      const res = await apiClient.delete('/pdpa/my-data', { data: body });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'ดำเนินการสำเร็จ', {
        position: 'top-right',
        autoClose: 3000,
      });
      if (data.deletedAt) {
        router.push('/login');
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'ดำเนินการไม่สำเร็จ', {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });

  const handleDeleteAll = () => {
    confirmDeleteToast(
      'คุณต้องการลบข้อมูลและบัญชีทั้งหมดอย่างถาวรหรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้',
      () => deleteMutation.mutate({ deleteAll: true }),
    );
  };

  const handleAnonymize = () => {
    confirmDeleteToast(
      'คุณต้องการทำข้อมูลเป็นนิรนามหรือไม่? บัญชีจะถูกปิดการใช้งาน',
      () => deleteMutation.mutate({ anonymize: true }),
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

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            การตั้งค่าความเป็นส่วนตัว
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            จัดการความยินยอมในการใช้ข้อมูลส่วนบุคคลของคุณ
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-sm text-gray-500">ทั้งหมด</div>
              <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-sm text-gray-500">ยินยอมแล้ว</div>
              <div className="text-2xl font-bold text-green-600">{summary.granted}</div>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-sm text-gray-500">รอการยินยอม</div>
              <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-sm text-gray-500">ถอนแล้ว</div>
              <div className="text-2xl font-bold text-red-600">{summary.revoked}</div>
            </div>
          </div>
        )}

        {/* Consent List */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 space-y-6">
            {Object.entries(CONSENT_TYPES).map(([type, config]) => {
              const status = getConsentStatus(type);
              const isGranted = status === 'GRANTED';

              return (
                <div
                  key={type}
                  className="border-b border-gray-200 pb-6 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {config.label}
                        </h3>
                        {config.required && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                            จำเป็น
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusBadge(status)}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {config.description}
                      </p>
                    </div>
                    <div className="ml-4">
                      {isGranted ? (
                        <button
                          onClick={() => revokeMutation.mutate(type)}
                          disabled={revokeMutation.isPending || config.required}
                          className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {revokeMutation.isPending ? 'กำลังถอน...' : 'ถอนความยินยอม'}
                        </button>
                      ) : (
                        <button
                          onClick={() => grantMutation.mutate(type)}
                          disabled={grantMutation.isPending}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {grantMutation.isPending ? 'กำลังยินยอม...' : 'ให้ความยินยอม'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Rights (PDPA มาตรา 30–35) */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            สิทธิของเจ้าของข้อมูล (User Rights)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล คุณสามารถขอเข้าถึง Export หรือลบข้อมูลส่วนตัวได้
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchMyDataMutation.mutate()}
              disabled={fetchMyDataMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 disabled:opacity-50"
            >
              {fetchMyDataMutation.isPending ? 'กำลังโหลด...' : 'ดูข้อมูลของฉัน'}
            </button>
            <button
              onClick={() => exportMutation.mutate('json')}
              disabled={exportMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Export JSON
            </button>
            <button
              onClick={() => exportMutation.mutate('csv')}
              disabled={exportMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Export CSV
            </button>
            <button
              onClick={handleAnonymize}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 disabled:opacity-50"
            >
              ทำข้อมูลเป็นนิรนาม
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
            >
              ลบบัญชีและข้อมูลทั้งหมด
            </button>
          </div>
          {myData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-auto">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(myData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Privacy Policy Link */}
        <div className="mt-6 text-center">
          <a
            href="/privacy-policy"
            target="_blank"
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            อ่านนโยบายความเป็นส่วนตัวฉบับเต็ม →
          </a>
        </div>
      </div>
    </MainLayout>
  );
}
