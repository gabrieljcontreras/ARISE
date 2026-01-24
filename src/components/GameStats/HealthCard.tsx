'use client';

import SubStat from './SubStat';

interface HealthCardProps {
  level: number;
  currentXP: number;
  strength: number;
  speed: number;
  nutrition: number;
}

export default function HealthCard({ level, currentXP, strength, speed, nutrition }: HealthCardProps) {
  const xpPercentage = (currentXP / 100) * 100;

  return (
    <div className="bg-black rounded-2xl p-6 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-white text-xl font-light">Health</h3>
        <p className="text-white text-3xl font-bold mt-1">LVL {level}</p>
      </div>

      <div className="space-y-4 flex-1 flex flex-col justify-center">
        <SubStat title="Strength" value={strength} />
        <SubStat title="Speed" value={speed} />
        <SubStat title="Nutrition" value={nutrition} />
      </div>

      <div className="w-full">
        <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-300"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
        <p className="text-gray-400 text-xs mt-1">{currentXP}/100</p>
      </div>
    </div>
  );
}
