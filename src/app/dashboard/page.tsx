'use client';

import { useState } from 'react';
import StatCard from '@/components/GameStats/StatCard';
import FinancesCard from '@/components/GameStats/FinancesCard';
import HealthCard from '@/components/GameStats/HealthCard';
import ChatBox from '@/components/ChatBox';

interface StatChanges {
  finances?: { currentXP?: number; level?: number };
  health?: { currentXP?: number; level?: number; strength?: number; speed?: number; nutrition?: number };
  intelligence?: { currentXP?: number; level?: number };
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    finances: { level: 1, currentXP: 0 },
    health: { level: 1, currentXP: 0, strength: 0, speed: 0, nutrition: 0 },
    intelligence: { level: 1, currentXP: 0 },
  });

  const handleStatChange = (changes: StatChanges) => {
    setStats(prev => {
      const newStats = { ...prev };
      
      if (changes.finances) {
        newStats.finances = {
          ...newStats.finances,
          currentXP: Math.min(100, Math.max(0, newStats.finances.currentXP + (changes.finances.currentXP || 0))),
        };
        // Level up check
        if (newStats.finances.currentXP >= 100) {
          newStats.finances.level += 1;
          newStats.finances.currentXP -= 100;
        }
      }
      
      if (changes.health) {
        newStats.health = {
          ...newStats.health,
          currentXP: Math.min(100, Math.max(0, newStats.health.currentXP + (changes.health.currentXP || 0))),
          strength: Math.min(100, Math.max(0, newStats.health.strength + (changes.health.strength || 0))),
          speed: Math.min(100, Math.max(0, newStats.health.speed + (changes.health.speed || 0))),
          nutrition: Math.min(100, Math.max(0, newStats.health.nutrition + (changes.health.nutrition || 0))),
        };
        // Level up check
        if (newStats.health.currentXP >= 100) {
          newStats.health.level += 1;
          newStats.health.currentXP -= 100;
        }
      }
      
      if (changes.intelligence) {
        newStats.intelligence = {
          ...newStats.intelligence,
          currentXP: Math.min(100, Math.max(0, newStats.intelligence.currentXP + (changes.intelligence.currentXP || 0))),
        };
        // Level up check
        if (newStats.intelligence.currentXP >= 100) {
          newStats.intelligence.level += 1;
          newStats.intelligence.currentXP -= 100;
        }
      }
      
      return newStats;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-6 pt-12 pb-12">
      <div className="max-w-full">
        <div className="grid grid-cols-3 gap-12 items-center pt-8">
          {/* Left Column - Finances (extended) */}
          <div className="flex flex-col">
            <div className="h-[80vh]">
              <FinancesCard
                level={stats.finances.level}
                currentXP={stats.finances.currentXP}
              />
            </div>
          </div>

          {/* Center - ChatBox */}
          <div className="flex flex-col justify-end items-center h-[80vh]">
            <div className="h-[40vh] w-full">
              <ChatBox onStatChange={handleStatChange} />
            </div>
          </div>

          {/* Right Column - Health and Intelligence */}
          <div className="space-y-8 flex flex-col">
            <div className="h-[60vh]">
              <HealthCard
                level={stats.health.level}
                currentXP={stats.health.currentXP}
                strength={stats.health.strength}
                speed={stats.health.speed}
                nutrition={stats.health.nutrition}
              />
            </div>
            <StatCard
              title="Intelligence"
              level={stats.intelligence.level}
              currentXP={stats.intelligence.currentXP}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
