'use client';

interface SubStatProps {
  title: string;
  level: number;
  currentXP: number;
}

export default function SubStat({ title, level, currentXP }: SubStatProps) {
  const xpPercentage = (currentXP / 100) * 100;

  return (
    <div className="mb-4 p-3 bg-gray-900/50 rounded-xl">
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-300 text-sm font-medium">{title}</span>
        <span className="text-white text-sm font-bold">LVL {level}</span>
      </div>
      <div className="w-full bg-gray-600 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-300"
          style={{ width: `${xpPercentage}%` }}
        />
      </div>
      <p className="text-gray-500 text-xs mt-1">{currentXP}/100 XP</p>
    </div>
  );
}
