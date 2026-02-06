'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { apiClient } from '@/lib/api-client';

interface ConsentCheckboxProps {
  consentType: 'DATA_COLLECTION' | 'DATA_PROCESSING' | 'DATA_SHARING' | 'MARKETING' | 'ANALYTICS';
  label: string;
  description?: string;
  required?: boolean;
  onConsentChange?: (granted: boolean) => void;
}

export function ConsentCheckbox({
  consentType,
  label,
  description,
  required = false,
  onConsentChange,
}: ConsentCheckboxProps) {
  const [checked, setChecked] = useState(false);

  const grantMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/pdpa/consents', {
        consentType,
        privacyPolicyVersion: '1.0',
        termsVersion: '1.0',
      });
      return response.data;
    },
    onSuccess: () => {
      setChecked(true);
      onConsentChange?.(true);
      toast.success('ให้ความยินยอมสำเร็จ', {
        position: 'top-right',
        autoClose: 2000,
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'เกิดข้อผิดพลาด', {
        position: 'top-right',
        autoClose: 3000,
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      grantMutation.mutate();
    }
  };

  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={`consent-${consentType}`}
        checked={checked}
        onChange={handleChange}
        required={required}
        disabled={grantMutation.isPending}
        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
      />
      <div className="flex-1">
        <label
          htmlFor={`consent-${consentType}`}
          className="text-sm font-medium text-gray-900 cursor-pointer"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
        <a
          href="/privacy-policy"
          target="_blank"
          className="text-xs text-primary-600 hover:text-primary-700 mt-1 inline-block"
        >
          อ่านนโยบายความเป็นส่วนตัว →
        </a>
      </div>
    </div>
  );
}
