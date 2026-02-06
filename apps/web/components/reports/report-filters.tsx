'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ReportFiltersProps {
  filters: any;
  onChange: (filters: any) => void;
}

export function ReportFilters({ filters, onChange }: ReportFiltersProps) {
  // Fetch schools for dropdown
  const { data: schoolsData } = useQuery({
    queryKey: ['schools-list'],
    queryFn: async () => {
      const response = await apiClient.get('/schools', {
        params: { limit: 1000 },
      });
      return response.data;
    },
  });

  const schools = schoolsData?.data || [];

  // Get unique provinces
  const provinces = Array.from(
    new Set<string>(
      schools
        .map((s: any) => s.province as string | undefined)
        .filter(
          (province: string | undefined): province is string =>
            Boolean(province),
        ),
    ),
  ).sort();

  // Cohort options (สมมติรุ่น 1-5)
  const cohorts = [1, 2, 3, 4, 5];

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters };
    
    if (value === '' || value === undefined || value === null) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    onChange(newFilters);
  };

  const clearFilters = () => {
    onChange({});
  };

  const hasFilters = Object.keys(filters).length > 0;

  const regionLabels = {
    NORTH: 'ภาคเหนือ',
    NORTHEAST: 'ภาคตะวันออกเฉียงเหนือ',
    CENTRAL: 'ภาคกลาง',
    SOUTH: 'ภาคใต้',
  } as const;

  const statusLabels = {
    ACTIVE: 'ปฏิบัติงาน',
    TRANSFERRED: 'ย้าย',
    RESIGNED: 'ลาออก',
    ON_LEAVE: 'ลา',
  } as const;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          กรองข้อมูล
        </h3>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-primary-600 hover:text-primary-800"
          >
            ล้างทั้งหมด
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* School Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            โรงเรียน
          </label>
          <select
            value={filters.schoolId || ''}
            onChange={(e) => handleFilterChange('schoolId', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="">ทั้งหมด</option>
            {schools.map((school: any) => (
              <option key={school.id} value={school.id}>
                {school.schoolName}
              </option>
            ))}
          </select>
        </div>

        {/* Province Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            จังหวัด
          </label>
          <select
            value={filters.province || ''}
            onChange={(e) => handleFilterChange('province', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="">ทั้งหมด</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>

        {/* Region Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            ภูมิภาค
          </label>
          <select
            value={filters.region || ''}
            onChange={(e) => handleFilterChange('region', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="">ทั้งหมด</option>
            <option value="NORTH">ภาคเหนือ</option>
            <option value="NORTHEAST">ภาคตะวันออกเฉียงเหนือ</option>
            <option value="CENTRAL">ภาคกลาง</option>
            <option value="SOUTH">ภาคใต้</option>
          </select>
        </div>

        {/* Cohort Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            รุ่น
          </label>
          <select
            value={filters.cohort || ''}
            onChange={(e) =>
              handleFilterChange(
                'cohort',
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="">ทั้งหมด</option>
            {cohorts.map((cohort) => (
              <option key={cohort} value={cohort}>
                รุ่น {cohort}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            สถานะ
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="">ทั้งหมด</option>
            <option value="ACTIVE">ปฏิบัติงาน</option>
            <option value="TRANSFERRED">ย้าย</option>
            <option value="RESIGNED">ลาออก</option>
            <option value="ON_LEAVE">ลา</option>
          </select>
        </div>
      </div>

      {hasFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.schoolId && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-primary-100 text-primary-800">
              โรงเรียน:{' '}
              {schools.find((s: any) => s.id === filters.schoolId)?.schoolName ||
                filters.schoolId}
              <button
                onClick={() => handleFilterChange('schoolId', undefined)}
                className="ml-1 hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.province && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-primary-100 text-primary-800">
              จังหวัด: {filters.province}
              <button
                onClick={() => handleFilterChange('province', undefined)}
                className="ml-1 hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.region && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-primary-100 text-primary-800">
              ภูมิภาค:{' '}
              {
                regionLabels[
                  filters.region as keyof typeof regionLabels
                ]
              }
              <button
                onClick={() => handleFilterChange('region', undefined)}
                className="ml-1 hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.cohort && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-primary-100 text-primary-800">
              รุ่น: {filters.cohort}
              <button
                onClick={() => handleFilterChange('cohort', undefined)}
                className="ml-1 hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-primary-100 text-primary-800">
              สถานะ:{' '}
              {
                statusLabels[
                  filters.status as keyof typeof statusLabels
                ]
              }
              <button
                onClick={() => handleFilterChange('status', undefined)}
                className="ml-1 hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
