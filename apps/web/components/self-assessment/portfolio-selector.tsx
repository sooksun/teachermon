'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface PortfolioSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  teacherId: string;
}

export function PortfolioSelector({ selectedIds, onChange, teacherId }: PortfolioSelectorProps) {
  const [showSelector, setShowSelector] = useState(false);

  const { data: portfolioItems, isLoading } = useQuery({
    queryKey: ['portfolio-items', teacherId],
    queryFn: async () => {
      const response = await apiClient.get(`/evidence/teacher/${teacherId}`);
      return response.data;
    },
    enabled: showSelector,
  });

  const handleToggle = (itemId: string) => {
    if (selectedIds.includes(itemId)) {
      onChange(selectedIds.filter((id) => id !== itemId));
    } else {
      onChange([...selectedIds, itemId]);
    }
  };

  const handleSelectAll = () => {
    if (portfolioItems) {
      onChange(portfolioItems.map((item: any) => item.id));
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          เชื่อมโยงหลักฐาน e-Portfolio
        </label>
        <button
          type="button"
          onClick={() => setShowSelector(!showSelector)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {showSelector ? 'ซ่อน' : 'เลือกหลักฐาน'}
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="p-3 bg-primary-50 rounded-lg">
          <p className="text-sm text-primary-700">
            เลือกแล้ว <span className="font-semibold">{selectedIds.length}</span> รายการ
          </p>
        </div>
      )}

      {showSelector && (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-600">กำลังโหลดหลักฐาน...</p>
            </div>
          ) : portfolioItems && portfolioItems.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-700">
                  หลักฐานทั้งหมด ({portfolioItems.length} รายการ)
                </h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    เลือกทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {portfolioItems.map((item: any) => (
                  <label
                    key={item.id}
                    className={`
                      flex items-start p-3 rounded-lg cursor-pointer transition-colors
                      ${
                        selectedIds.includes(item.id)
                          ? 'bg-primary-100 border-2 border-primary-500'
                          : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleToggle(item.id)}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {item.itemType === 'VIDEO_LINK'
                              ? item.videoTitle
                              : item.originalFilename || item.standardFilename}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.evidenceType}
                            {item.itemType === 'VIDEO_LINK' && (
                              <span className="ml-2 text-blue-600">
                                📹 วิดีโอ
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {item.aiSummary && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {item.aiSummary}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">
                ยังไม่มีหลักฐานใน e-Portfolio
              </p>
              <p className="text-xs text-gray-400 mt-1">
                อัพโหลดหลักฐานก่อนเพื่อเชื่อมโยงกับการประเมิน
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
