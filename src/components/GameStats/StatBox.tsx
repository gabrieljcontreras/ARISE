'use client';

interface StatBoxProps {
  title: string;
  level: number;
  currentXP: number;
  maxXP: number;
  color: string;
}

export default function StatBox({ title, level, currentXP, maxXP, color }: StatBoxProps) {
  const xpPercentage = (currentXP / maxXP) * 100;

  return (
    <div className="bg-gray-900 rounded-lg p-6 w-48 border border-gray-800">
      <h3 className="text-gray-300 text-sm font-light mb-4">{title}</h3>
      
      <div className="mb-3">
        <span className={`text-3xl font-bold ${color}`}>
          {level}
        </span>
      </div>

      <div className="text-xs text-gray-400 mb-2">
        {currentXP}/{maxXP}
      </div>

      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color.replace('text-', 'bg-')}`}
          style={{ width: `${xpPercentage}%` }}
        />
      </div>
    </div>
  );
}
