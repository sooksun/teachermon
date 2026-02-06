'use client';

interface ScoreSelectorProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
}

const SCORES = [
  { value: 1, label: '1', description: 'ต้องพัฒนามาก', color: 'bg-red-500' },
  { value: 2, label: '2', description: 'ต้องพัฒนา', color: 'bg-orange-500' },
  { value: 3, label: '3', description: 'พอใช้', color: 'bg-yellow-500' },
  { value: 4, label: '4', description: 'ดี', color: 'bg-blue-500' },
  { value: 5, label: '5', description: 'ดีเยี่ยม', color: 'bg-green-500' },
];

export function ScoreSelector({ label, value, onChange, required = false }: ScoreSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center gap-2">
        {SCORES.map((score) => (
          <button
            key={score.value}
            type="button"
            onClick={() => onChange(score.value)}
            className={`
              flex-1 py-3 px-2 rounded-lg border-2 transition-all
              ${
                value === score.value
                  ? `${score.color} text-white border-transparent shadow-md scale-105`
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow'
              }
            `}
          >
            <div className="text-lg font-bold">{score.label}</div>
            <div className="text-xs mt-1 opacity-90">{score.description}</div>
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-sm text-gray-600 mt-1">
          เลือกแล้ว: <span className="font-semibold">{value}</span> - {SCORES.find(s => s.value === value)?.description}
        </p>
      )}
    </div>
  );
}
