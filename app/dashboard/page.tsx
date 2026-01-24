'use client';

import { useState } from 'react';
import StatBox from '@/components/GameStats/StatBox';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    finances: { level: 1, currentXP: 45, maxXP: 100 },
    health: { level: 2, currentXP: 20, maxXP: 100 },
    intelligence: { level: 3, currentXP: 30, maxXP: 100 },
    strength: { level: 1, currentXP: 75, maxXP: 100 },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
      <div className="relative w-full max-w-2xl">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-12 items-center justify-center">
          {/* Top Left - Finances */}
          <div className="col-start-1 row-start-1 justify-self-center">
            <StatBox
              title="Finances"
              level={stats.finances.level}
              currentXP={stats.finances.currentXP}
              maxXP={stats.finances.maxXP}
              color="text-blue-400"
            />
          </div>

          {/* Top Right - Health */}
          <div className="col-start-4 row-start-1 justify-self-center">
            <StatBox
              title="Health"
              level={stats.health.level}
              currentXP={stats.health.currentXP}
              maxXP={stats.health.maxXP}
              color="text-purple-400"
            />
          </div>

          {/* Center - Avatar */}
          <div className="col-start-2 col-span-2 row-start-1 flex justify-center">
            <div className="w-40 h-40 bg-black rounded-full flex items-center justify-center">
              <div className="w-32 h-32 bg-black rounded-full border-4 border-gray-700 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full mb-2" />
                <div className="w-12 h-3 bg-gray-800 rounded-full mb-1" />
                <div className="flex gap-8 mt-4">
                  <div className="w-3 h-20 bg-gray-800 rounded-full" />
                  <div className="w-3 h-20 bg-gray-800 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Left - Intelligence */}
          <div className="col-start-1 row-start-2 justify-self-center mt-12">
            <StatBox
              title="Intelligence"
              level={stats.intelligence.level}
              currentXP={stats.intelligence.currentXP}
              maxXP={stats.intelligence.maxXP}
              color="text-indigo-400"
            />
          </div>

          {/* Bottom Right - Strength */}
          <div className="col-start-4 row-start-2 justify-self-center mt-12">
            <StatBox
              title="Strength"
              level={stats.strength.level}
              currentXP={stats.strength.currentXP}
              maxXP={stats.strength.maxXP}
              color="text-orange-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
