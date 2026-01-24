'use client';

import { useState } from 'react';
import StatCard from '@/components/GameStats/StatCard';
import FinancesCard from '@/components/GameStats/FinancesCard';
import HealthCard from '@/components/GameStats/HealthCard';
import ChatBox from '@/components/ChatBox';

interface StatChanges {
  finances?: { currentXP?: number; level?: number };
  health?: { 
    currentXP?: number; 
    level?: number; 
    strength?: number; 
    speed?: number; 
    nutrition?: number;
  };
  intelligence?: { currentXP?: number; level?: number };
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    finances: { level: 1, currentXP: 0 },
    health: { 
      level: 1, 
      currentXP: 0, 
      strength: { level: 1, currentXP: 0 },
      speed: { level: 1, currentXP: 0 },
      nutrition: { level: 1, currentXP: 0 }
    },
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
        // Update main health XP
        let healthXP = newStats.health.currentXP + (changes.health.currentXP || 0);
        let healthLevel = newStats.health.level;
        if (healthXP >= 100) {
          healthLevel += 1;
          healthXP -= 100;
        }
        healthXP = Math.min(100, Math.max(0, healthXP));

        // Update strength
        let strengthXP = newStats.health.strength.currentXP + (changes.health.strength || 0);
        let strengthLevel = newStats.health.strength.level;
        if (strengthXP >= 100) {
          strengthLevel += 1;
          strengthXP -= 100;
        }
        strengthXP = Math.min(100, Math.max(0, strengthXP));

        // Update speed
        let speedXP = newStats.health.speed.currentXP + (changes.health.speed || 0);
        let speedLevel = newStats.health.speed.level;
        if (speedXP >= 100) {
          speedLevel += 1;
          speedXP -= 100;
        }
        speedXP = Math.min(100, Math.max(0, speedXP));

        // Update nutrition
        let nutritionXP = newStats.health.nutrition.currentXP + (changes.health.nutrition || 0);
        let nutritionLevel = newStats.health.nutrition.level;
        if (nutritionXP >= 100) {
          nutritionLevel += 1;
          nutritionXP -= 100;
        }
        nutritionXP = Math.min(100, Math.max(0, nutritionXP));

        newStats.health = {
          level: healthLevel,
          currentXP: healthXP,
          strength: { level: strengthLevel, currentXP: strengthXP },
          speed: { level: speedLevel, currentXP: speedXP },
          nutrition: { level: nutritionLevel, currentXP: nutritionXP }
        };
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
