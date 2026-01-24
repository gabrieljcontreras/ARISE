'use client';

import { useState } from 'react';
import { Heart, Dumbbell, Zap, Apple, Moon, Activity } from 'lucide-react';

interface SubStatData {
  level: number;
  currentXP: number;
}

interface HealthCardProps {
  level: number;
  currentXP: number;
  strength: SubStatData;
  speed: SubStatData;
  nutrition: SubStatData;
}

type SubTab = 'overview' | 'workouts' | 'nutrition' | 'sleep';

export default function HealthCard({ level, currentXP, strength, speed, nutrition }: HealthCardProps) {
  const xpPercentage = (currentXP / 100) * 100;
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');

  const workoutHistory = [
    { day: 'Mon', type: '💪 Strength', duration: 45, xp: 35 },
    { day: 'Tue', type: '🏃 Cardio', duration: 30, xp: 25 },
    { day: 'Wed', type: '🧘 Yoga', duration: 60, xp: 20 },
    { day: 'Thu', type: '💪 Strength', duration: 50, xp: 40 },
    { day: 'Fri', type: '🏃 HIIT', duration: 25, xp: 45 },
  ];

  const nutritionLog = [
    { meal: 'Breakfast', calories: 450, protein: 25, status: 'good' },
    { meal: 'Lunch', calories: 680, protein: 40, status: 'good' },
    { meal: 'Dinner', calories: 720, protein: 35, status: 'warning' },
    { meal: 'Snacks', calories: 200, protein: 8, status: 'good' },
  ];

  return (
    <div 
      className="rounded-3xl p-8 border-2 border-[#00ff884d] min-h-[70vh]"
      style={{ 
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 0 60px rgba(0, 255, 136, 0.1)'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="font-[family-name:var(--font-orbitron)] text-3xl font-bold text-white flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)' }}
            >
              <Heart className="w-6 h-6 text-white" />
            </div>
            Health Vitality
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="font-[family-name:var(--font-orbitron)] text-[#00ff88] text-xl">LVL {level}</span>
            <div className="flex-1 max-w-xs">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00ff88] to-[#00d9ff] rounded-full transition-all duration-500"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">{currentXP}/100 XP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-xl">
        {[
          { id: 'overview' as SubTab, label: 'Overview', icon: Activity },
          { id: 'workouts' as SubTab, label: 'Workouts', icon: Dumbbell },
          { id: 'nutrition' as SubTab, label: 'Nutrition', icon: Apple },
          { id: 'sleep' as SubTab, label: 'Sleep', icon: Moon },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
              activeSubTab === tab.id 
                ? 'bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-white' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          {/* Sub-stats */}
          <div className="grid grid-cols-3 gap-4">
            <SubStatCard 
              icon={<Dumbbell className="w-5 h-5" />}
              label="Strength"
              level={strength.level}
              xp={strength.currentXP}
              color="#ef4444"
            />
            <SubStatCard 
              icon={<Zap className="w-5 h-5" />}
              label="Speed"
              level={speed.level}
              xp={speed.currentXP}
              color="#f59e0b"
            />
            <SubStatCard 
              icon={<Apple className="w-5 h-5" />}
              label="Nutrition"
              level={nutrition.level}
              xp={nutrition.currentXP}
              color="#22c55e"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl border border-[#00ff8833] bg-[#00ff8808]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#00ff88]/20 flex items-center justify-center text-xl">🔥</div>
                <div>
                  <p className="text-gray-400 text-sm">Workout Streak</p>
                  <p className="font-[family-name:var(--font-orbitron)] text-xl text-[#00ff88]">7 days</p>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-[#00d9ff33] bg-[#00d9ff08]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#00d9ff]/20 flex items-center justify-center text-xl">⚡</div>
                <div>
                  <p className="text-gray-400 text-sm">Weekly XP</p>
                  <p className="font-[family-name:var(--font-orbitron)] text-xl text-[#00d9ff]">+165 XP</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Progress */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="font-[family-name:var(--font-orbitron)] text-lg text-white mb-4">Today&apos;s Progress</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full border-4 border-[#00ff88] flex items-center justify-center mb-2">
                  <span className="font-[family-name:var(--font-orbitron)] text-lg text-[#00ff88]">8.2k</span>
                </div>
                <p className="text-gray-400 text-sm">Steps</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full border-4 border-[#00d9ff] flex items-center justify-center mb-2">
                  <span className="font-[family-name:var(--font-orbitron)] text-lg text-[#00d9ff]">1,850</span>
                </div>
                <p className="text-gray-400 text-sm">Calories</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full border-4 border-[#a855f7] flex items-center justify-center mb-2">
                  <span className="font-[family-name:var(--font-orbitron)] text-lg text-[#a855f7]">7.5h</span>
                </div>
                <p className="text-gray-400 text-sm">Sleep</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'workouts' && (
        <div className="space-y-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <h3 className="font-[family-name:var(--font-orbitron)] text-lg text-gray-300 mb-4">This Week&apos;s Workouts</h3>
          {workoutHistory.map((workout, i) => (
            <div 
              key={i}
              className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-[family-name:var(--font-orbitron)] text-sm text-gray-400">
                  {workout.day}
                </div>
                <div>
                  <p className="text-white font-medium">{workout.type}</p>
                  <p className="text-gray-500 text-sm">{workout.duration} minutes</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-[family-name:var(--font-orbitron)] text-[#00ff88]">+{workout.xp} XP</span>
              </div>
            </div>
          ))}
          
          <button className="w-full py-4 rounded-xl border-2 border-dashed border-white/20 text-gray-400 hover:border-[#00ff88] hover:text-[#00ff88] transition-all">
            + Log Workout
          </button>
        </div>
      )}

      {activeSubTab === 'nutrition' && (
        <div className="space-y-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-gray-400 text-sm">Calories</p>
              <p className="font-[family-name:var(--font-orbitron)] text-xl text-white">2,050</p>
              <p className="text-gray-500 text-xs">/ 2,200 goal</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-gray-400 text-sm">Protein</p>
              <p className="font-[family-name:var(--font-orbitron)] text-xl text-[#00ff88]">108g</p>
              <p className="text-gray-500 text-xs">/ 120g goal</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-gray-400 text-sm">Water</p>
              <p className="font-[family-name:var(--font-orbitron)] text-xl text-[#00d9ff]">6 cups</p>
              <p className="text-gray-500 text-xs">/ 8 cups goal</p>
            </div>
          </div>

          <h3 className="font-[family-name:var(--font-orbitron)] text-lg text-gray-300 mb-4">Today&apos;s Meals</h3>
          {nutritionLog.map((meal, i) => (
            <div 
              key={i}
              className={`p-4 rounded-xl bg-white/5 border ${meal.status === 'warning' ? 'border-orange-500/30' : 'border-white/10'}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">{meal.meal}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">{meal.calories} cal</span>
                  <span className="text-[#00ff88]">{meal.protein}g protein</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'sleep' && (
        <div className="space-y-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="text-center p-8 rounded-2xl border border-[#a855f733] bg-[#a855f708]">
            <div className="text-5xl mb-4">😴</div>
            <p className="text-gray-400 mb-2">Last Night</p>
            <p className="font-[family-name:var(--font-orbitron)] text-4xl text-[#a855f7]">7h 32m</p>
            <p className="text-gray-500 text-sm mt-2">Quality: Good</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-gray-400 text-sm">Weekly Average</p>
              <p className="font-[family-name:var(--font-orbitron)] text-xl text-white">7.2 hrs</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-gray-400 text-sm">Sleep Score</p>
              <p className="font-[family-name:var(--font-orbitron)] text-xl text-[#00ff88]">85/100</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="font-[family-name:var(--font-orbitron)] text-lg text-white mb-4">This Week</h3>
            <div className="flex justify-between items-end h-32">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const heights = [75, 80, 65, 85, 70, 90, 78];
                return (
                  <div key={day} className="flex flex-col items-center gap-2">
                    <div 
                      className="w-8 rounded-t-lg bg-gradient-to-t from-[#a855f7] to-[#6366f1]"
                      style={{ height: `${heights[i]}%` }}
                    />
                    <span className="text-gray-500 text-xs">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubStatCard({ 
  icon, 
  label, 
  level, 
  xp, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  level: number; 
  xp: number; 
  color: string;
}) {
  return (
    <div 
      className="p-4 rounded-xl border"
      style={{ 
        borderColor: `${color}33`,
        background: `${color}08`
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
        <span className="text-gray-300 font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-[family-name:var(--font-orbitron)] text-2xl text-white">LVL {level}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${xp}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-gray-500 text-xs mt-1">{xp}/100 XP</p>
    </div>
  );
}
