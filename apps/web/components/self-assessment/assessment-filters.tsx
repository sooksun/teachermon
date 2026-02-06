'use client';

import { PERIOD_MAP } from '@/lib/self-assessment-constants';

interface AssessmentFiltersProps {
  filters: {
    period: string;
    status: string;
  };
  onFilterChange: (filters: { period: string; status: string }) => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'DRAFT', label: 'ร่าง' },
  { value: 'SUBMITTED', label: 'ส่งแล้ว' },
  { value: 'REVIEWED', label: 'ตรวจแล้ว' },
];

export function AssessmentFilters({ filters, onFilterChange }: AssessmentFiltersProps) {
  const periodOptions = [
    { value: '', label: 'ทุกช่วงเวลา' },
    ...Object.entries(PERIOD_MAP).map(([key, value]) => ({
      value: key,
      label: String(value),
    })),
  ];

  const handlePeriodChange = (period: string) => {
    onFilterChange({ ...filters, period });
  };

  const handleStatusChange = (status: string) => {
    onFilterChange({ ...filters, status });
  };

  const hasActiveFilters = filters.period || filters.status;

  const clearFilters = () => {
    onFilterChange({ period: '', status: '' });
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Period Filter */}
          <div className="w-full sm:w-48">
            <label
              htmlFor="period"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ช่วงเวลา
            </label>
            <select
              id="period"
              value={filters.period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              สถานะ
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              ล้างตัวกรอง
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.period && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {
                periodOptions.find((opt) => opt.value === filters.period)
                  ?.label
              }
              <button
                onClick={() => handlePeriodChange('')}
                className="hover:text-primary-900"
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
          {filters.status && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {STATUS_OPTIONS.find((opt) => opt.value === filters.status)?.label}
              <button
                onClick={() => handleStatusChange('')}
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
        </div>
      )}
    </div>
  );
}
