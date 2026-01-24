'use client';

import { REGIONS, TEACHER_STATUS } from '@teachermon/shared';

interface TeacherFiltersProps {
  filters: any;
  onFilterChange: (key: string, value: any) => void;
}

export function TeacherFilters({ filters, onFilterChange }: TeacherFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
          ค้นหา
        </label>
        <input
          type="text"
          id="search"
          placeholder="ชื่อ, อีเมล, เลขบัตรประชาชน"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
          ภูมิภาค
        </label>
        <select
          id="region"
          value={filters.region}
          onChange={(e) => onFilterChange('region', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">ทั้งหมด</option>
          {Object.entries(REGIONS).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          สถานะ
        </label>
        <select
          id="status"
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">ทั้งหมด</option>
          {Object.entries(TEACHER_STATUS).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end">
        <button
          onClick={() =>
            onFilterChange('search', '') ||
            onFilterChange('region', '') ||
            onFilterChange('status', '')
          }
          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          ล้างตัวกรอง
        </button>
      </div>
    </div>
  );
}
