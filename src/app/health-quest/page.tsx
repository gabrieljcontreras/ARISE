'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useStats } from '@/context/StatsContext';
import { StatBar, InteractiveStat, DetailCard, OverviewStatMini, QuestItem } from '@/components/ui/DashboardComponents';
import ChatBox from '@/components/ChatBox';
import SoundToggle from '@/components/SoundToggle';

export default function HealthQuestPage() {
  const { 
    stats, 
    totalXP,
    healthQuests, 
    completedQuests,
    workoutHistory,
    nutritionLog,
    handleStatChange, 
    handleQuestCreated, 
    toggleQuestCompletion 
  } = useStats();
  
  const [expandedStat, setExpandedStat] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <div className="bg-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Header */}
      <header className="relative z-10 px-[5%] py-8 flex justify-between items-center">
        <Link 
          href="/"
          className="font-[family-name:var(--font-orbitron)] text-3xl font-black tracking-widest"
          style={{
            background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'glow 3s ease-in-out infinite alternate'
          }}
        >
          ARISE
        </Link>
        <Link 
          href="/choose-quest"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Change Quest
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-[5%] pb-12">
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
          {/* Main Section: Character Center + Overview Side */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Left Column - Health Overview */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div 
                className="p-6 rounded-3xl border-2 border-[#00ff884d]"
                style={{ 
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <h3 
                  className="font-[family-name:var(--font-orbitron)] text-xl font-bold mb-6 text-center"
                  style={{
                    background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  ❤️ Health Overview
                </h3>
                <div className="space-y-4">
                  <OverviewStatMini 
                    label="Strength" 
                    icon="💪" 
                    level={stats.health.strength.level} 
                    xp={stats.health.strength.currentXP}
                    color="#00ff88"
                    onClick={() => setExpandedStat(expandedStat === 'strength' ? null : 'strength')}
                  />
                  <OverviewStatMini 
                    label="Speed & Cardio" 
                    icon="🏃" 
                    level={stats.health.speed.level} 
                    xp={stats.health.speed.currentXP}
                    color="#00d9ff"
                    onClick={() => setExpandedStat(expandedStat === 'speed' ? null : 'speed')}
                  />
                  <OverviewStatMini 
                    label="Nutrition" 
                    icon="🥗" 
                    level={stats.health.nutrition.level} 
                    xp={stats.health.nutrition.currentXP}
                    color="#f59e0b"
                    onClick={() => setExpandedStat(expandedStat === 'nutrition' ? null : 'nutrition')}
                  />
                  <OverviewStatMini 
                    label="Sleep & Recovery" 
                    icon="😴" 
                    level={stats.health.sleep.level} 
                    xp={stats.health.sleep.currentXP}
                    color="#a855f7"
                    onClick={() => setExpandedStat(expandedStat === 'sleep' ? null : 'sleep')}
                  />
                </div>
                <p className="text-center text-gray-500 text-sm mt-4">Click a stat to see details below</p>
              </div>
            </div>

            {/* Center Column - Character Card */}
            <div className="lg:col-span-1 order-1 lg:order-2">
              <div 
                className="relative p-8 rounded-3xl border-2 border-[#00ff884d]"
                style={{ 
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 0 60px rgba(0, 255, 136, 0.15)',
                  animation: 'cardFloat 4s ease-in-out infinite'
                }}
              >
                {/* Avatar */}
                <div className="relative w-36 h-36 mx-auto mb-4">
                  <div 
                    className="w-full h-full rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)',
                      animation: 'avatarPulse 3s ease-in-out infinite'
                    }}
                  >
                    <div className="w-[90%] h-[90%] rounded-full bg-[#0a0e27] flex items-center justify-center text-6xl">
                      💪
                    </div>
                  </div>
                  {/* Level Badge */}
                  <div 
                    className="absolute -top-1 -right-1 w-14 h-14 rounded-full flex flex-col items-center justify-center border-3 border-[#050814]"
                    style={{
                      background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)',
                      boxShadow: '0 4px 20px rgba(0, 255, 136, 0.4)'
                    }}
                  >
                    <span className="font-[family-name:var(--font-orbitron)] text-[8px] opacity-80">LVL</span>
                    <span className="font-[family-name:var(--font-orbitron)] text-xl font-black">{stats.health.level}</span>
                  </div>
                </div>

                {/* Character Info */}
                <div className="text-center mb-6">
                  <h3 className="font-[family-name:var(--font-orbitron)] text-2xl font-bold text-white">Health Hero</h3>
                  <p className="text-[#00ff88] text-sm">Wellness Champion</p>
                </div>

                {/* Main Stats */}
                <div className="space-y-3 mb-6">
                  <StatBar label="❤️ Health XP" value={stats.health.currentXP} max={100} color="from-[#00ff88] to-[#00d9ff]" />
                  <StatBar label="⭐ Total XP" value={totalXP} max={5000} color="from-[#f59e0b] to-[#ef4444]" showValue />
                </div>

                {/* ChatBox */}
                <ChatBox onStatChange={handleStatChange} questType="health" onQuestCreated={handleQuestCreated} />
              </div>
            </div>

            {/* Right Column - Quick Actions / Tips */}
            <div className="lg:col-span-1 order-3">
              <div 
                className="p-6 rounded-3xl border-2 border-[#00ff884d]"
                style={{ 
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <h3 className="font-[family-name:var(--font-orbitron)] text-lg font-bold mb-4 text-[#00ff88]">📋 Daily Quests</h3>
                <div className="space-y-3">
                  {healthQuests.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">
                      No quests yet! Use the chat to add one.<br />
                      <span className="text-xs text-gray-500">Try: &quot;Add quest to drink 8 glasses of water&quot;</span>
                    </p>
                  ) : (
                    healthQuests.map(quest => (
                      <QuestItem 
                        key={quest.id}
                        text={quest.text} 
                        xp={quest.xp} 
                        completed={completedQuests.has(quest.id)}
                        onClick={() => toggleQuestCompletion(quest.id, quest.xp, quest.category)}
                      />
                    ))
                  )}
                </div>
                <div className="mt-6 p-4 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30">
                  <p className="text-sm text-gray-300">
                    💡 <span className="text-[#00ff88] font-medium">Tip:</span> Add quests via chat: &quot;Add quest to run 5k&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Stats Section (Scrollable) */}
          <div className="space-y-6">
            <h2 
              className="font-[family-name:var(--font-orbitron)] text-3xl font-black text-center"
              style={{
                background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ❤️ Detailed Health Stats
            </h2>
            <p className="text-center text-gray-400 mb-8">Click on any stat to expand and see more details</p>

            <div className="grid lg:grid-cols-2 gap-6 items-start">
              {/* Strength Stat */}
              <InteractiveStat
                id="strength"
                title="Strength"
                icon="💪"
                level={stats.health.strength.level}
                xp={stats.health.strength.currentXP}
                color="#00ff88"
                expanded={expandedStat === 'strength'}
                onClick={() => setExpandedStat(expandedStat === 'strength' ? null : 'strength')}
              >
                <div className="grid grid-cols-2 gap-4">
                  <DetailCard label="Workouts This Month" value={`${stats.health.strength.workouts}`} />
                  <DetailCard label="Max Lift (lbs)" value={`${stats.health.strength.maxLift}`} />
                  <DetailCard label="Streak" value="5 days" />
                  <DetailCard label="Next Goal" value="250 lbs" />
                </div>
              </InteractiveStat>

              {/* Speed/Cardio Stat */}
              <InteractiveStat
                id="speed"
                title="Speed & Cardio"
                icon="🏃"
                level={stats.health.speed.level}
                xp={stats.health.speed.currentXP}
                color="#00d9ff"
                expanded={expandedStat === 'speed'}
                onClick={() => setExpandedStat(expandedStat === 'speed' ? null : 'speed')}
              >
                <div className="grid grid-cols-2 gap-4">
                  <DetailCard label="Runs This Month" value={`${stats.health.speed.runs}`} />
                  <DetailCard label="Best Mile Time" value={stats.health.speed.bestMile} />
                  <DetailCard label="Total Miles" value="32.5" />
                  <DetailCard label="Target Mile" value="7:00" />
                </div>
              </InteractiveStat>

              {/* Nutrition Stat */}
              <InteractiveStat
                id="nutrition"
                title="Nutrition"
                icon="🥗"
                level={stats.health.nutrition.level}
                xp={stats.health.nutrition.currentXP}
                color="#f59e0b"
                expanded={expandedStat === 'nutrition'}
                onClick={() => setExpandedStat(expandedStat === 'nutrition' ? null : 'nutrition')}
              >
                <div className="grid grid-cols-2 gap-4">
                  <DetailCard label="Daily Calories" value={`${stats.health.nutrition.calories}`} />
                  <DetailCard label="Protein (g)" value={`${stats.health.nutrition.protein}`} />
                  <DetailCard label="Water (cups)" value="8" />
                  <DetailCard label="Clean Eating Streak" value="6 days" />
                </div>
              </InteractiveStat>

              {/* Sleep Stat */}
              <InteractiveStat
                id="sleep"
                title="Sleep & Recovery"
                icon="😴"
                level={stats.health.sleep.level}
                xp={stats.health.sleep.currentXP}
                color="#a855f7"
                expanded={expandedStat === 'sleep'}
                onClick={() => setExpandedStat(expandedStat === 'sleep' ? null : 'sleep')}
              >
                <div className="grid grid-cols-2 gap-4">
                  <DetailCard label="Avg Hours" value={`${stats.health.sleep.avgHours}`} />
                  <DetailCard label="Sleep Quality" value={`${stats.health.sleep.quality}%`} />
                  <DetailCard label="Best Night" value="8.5 hrs" />
                  <DetailCard label="Target" value="8 hrs" />
                </div>
              </InteractiveStat>
            </div>

            {/* Recent Activity Section */}
            {(workoutHistory.length > 0 || nutritionLog.length > 0) && (
              <div className="mt-12 space-y-6">
                <h2 
                  className="font-[family-name:var(--font-orbitron)] text-2xl font-bold text-center"
                  style={{
                    background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  📊 Recent Activity
                </h2>
                
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Workout History */}
                  {workoutHistory.length > 0 && (
                    <div 
                      className="p-6 rounded-2xl border border-[#00ff8833]"
                      style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)' }}
                    >
                      <h3 className="font-[family-name:var(--font-orbitron)] text-lg font-bold mb-4 text-[#00ff88]">💪 Workouts</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {workoutHistory.slice(-5).reverse().map((workout, i) => (
                          <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#00ff88]/20 flex items-center justify-center text-lg">
                                {workout.workoutType === 'Strength' ? '💪' : workout.workoutType === 'Cardio' ? '🏃' : '🏋️'}
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">{workout.description || workout.workoutType}</p>
                                <p className="text-gray-500 text-xs">{workout.duration} min • {workout.workoutType}</p>
                              </div>
                            </div>
                            <span className="font-[family-name:var(--font-orbitron)] text-[#00ff88] text-sm">+{workout.xp} XP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Nutrition Log */}
                  {nutritionLog.length > 0 && (
                    <div 
                      className="p-6 rounded-2xl border border-[#f59e0b33]"
                      style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)' }}
                    >
                      <h3 className="font-[family-name:var(--font-orbitron)] text-lg font-bold mb-4 text-[#f59e0b]">🥗 Nutrition Log</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {nutritionLog.slice(-5).reverse().map((meal, i) => (
                          <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center text-lg">
                                🍽️
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">{meal.meal}</p>
                                <p className="text-gray-500 text-xs">{meal.calories} cal • {meal.protein}g protein</p>
                              </div>
                            </div>
                            <span className="font-[family-name:var(--font-orbitron)] text-[#f59e0b] text-sm">+{meal.xp} XP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <SoundToggle />
    </div>
  );
}
