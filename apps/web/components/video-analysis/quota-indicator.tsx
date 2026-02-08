'use client';

interface QuotaIndicatorProps {
  limitBytes: number;
  usageBytes: number;
  remainingBytes: number;
}

export function QuotaIndicator({ limitBytes, usageBytes, remainingBytes }: QuotaIndicatorProps) {
  const usageMB = (usageBytes / 1024 / 1024).toFixed(1);
  const limitMB = (limitBytes / 1024 / 1024).toFixed(0);
  const percent = limitBytes > 0 ? Math.min(100, (usageBytes / limitBytes) * 100) : 0;

  let barColor = 'bg-green-500';
  if (percent > 80) barColor = 'bg-red-500';
  else if (percent > 60) barColor = 'bg-amber-500';

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">พื้นที่ใช้งาน</h3>
        <span className="text-sm text-gray-500">
          {usageMB} / {limitMB} MB
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`${barColor} h-3 rounded-full transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        เหลือ {(remainingBytes / 1024 / 1024).toFixed(1)} MB
      </p>
    </div>
  );
}
