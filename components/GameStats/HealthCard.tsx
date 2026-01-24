'use client';

import SubStat from './SubStat';

interface HealthCardProps {
  level: number;
  currentXP: number;
  strength: { level: number; currentXP: number };
  speed: { level: number; currentXP: number };
  nutrition: { level: number; currentXP: number };
}

export default function HealthCard({ level, currentXP, strength, speed, nutrition }: HealthCardProps) {
  const xpPercentage = (currentXP / 100) * 100;

  return (
    <div className="bg-black rounded-2xl p-6 h-full flex flex-col">
      <div>
        <h3 className="text-white text-xl font-light">Health</h3>
        <p className="text-white text-3xl font-bold mt-1">LVL {level}</p>
        <div className="w-full mt-2">
          <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-300"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <p className="text-gray-400 text-xs mt-1">{currentXP}/100 XP</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center mt-4">
        <SubStat title="Strength" level={strength.level} currentXP={strength.currentXP} />
        <SubStat title="Speed" level={speed.level} currentXP={speed.currentXP} />
        <SubStat title="Nutrition" level={nutrition.level} currentXP={nutrition.currentXP} />
      </div>
    </div>
  );
}
