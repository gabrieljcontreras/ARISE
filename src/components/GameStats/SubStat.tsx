'use client';

interface SubStatProps {
  title: string;
  value: number;
}

export default function SubStat({ title, value }: SubStatProps) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-300 text-sm">{title}</span>
        <span className="text-gray-400 text-xs">{value}%</span>
      </div>
      <div className="w-full bg-gray-600 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
