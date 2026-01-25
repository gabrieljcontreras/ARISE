'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useStats } from '@/context/StatsContext';

export default function ChooseQuestPage() {
  const { stats } = useStats();
  
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
          href="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-[5%] pb-12">
        <section className="min-h-[80vh] flex flex-col items-center justify-center" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div className="text-center mb-12">
            <h2 
              className="font-[family-name:var(--font-orbitron)] text-4xl lg:text-5xl font-black mb-4"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #00ff88 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CHOOSE YOUR QUEST
            </h2>
            <p className="text-xl text-gray-400">Select your path to greatness</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full">
            {/* Financial Quest Card */}
            <Link
              href="/financial-quest"
              className="group relative p-8 rounded-3xl border-2 border-[#00d9ff4d] text-left transition-all duration-500 hover:border-[#00d9ff] hover:-translate-y-3 hover:scale-[1.02]"
              style={{ 
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div 
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                style={{ background: 'linear-gradient(135deg, #00d9ff 0%, #0099ff 100%)' }}
              />
              <div 
                className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center text-4xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                style={{ 
                  background: 'linear-gradient(135deg, #00d9ff 0%, #0099ff 100%)',
                  boxShadow: '0 0 30px rgba(0, 217, 255, 0.3)'
                }}
              >
                💰
              </div>
              <h3 className="font-[family-name:var(--font-orbitron)] text-2xl font-bold text-center mb-2 text-white">
                Financial Quest
              </h3>
              <p className="text-gray-400 text-center mb-4 text-sm">
                Master your money through smart habits
              </p>

              {/* Financial Data Preview */}
              <div className="relative z-10 p-4 rounded-xl mb-4" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#00d9ff] text-sm font-medium">Level {stats.finances.level} Wealth Warrior</span>
                  <span className="text-xs text-gray-400">{stats.finances.currentXP}/100 XP</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00d9ff] to-[#0099ff] rounded-full"
                    style={{ width: `${stats.finances.currentXP}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-gray-400">Savings</span>
                    <p className="text-white font-bold">${Math.round(stats.finances.savings.amount).toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-gray-400">Budget</span>
                    <p className="text-white font-bold">${Math.round(stats.finances.budget.limit - stats.finances.budget.spent)} left</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-gray-400">Investments</span>
                    <p className="text-[#00ff88] font-bold">+{Math.round(stats.finances.investments.growth)}%</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl border-2 border-[#00d9ff]/30 bg-[#00d9ff]/10 group-hover:bg-[#00d9ff]/20 group-hover:border-[#00d9ff]/50 transition-all">
                <span className="font-[family-name:var(--font-orbitron)] font-bold text-[#00d9ff]">Begin Quest</span>
                <ChevronRight className="w-5 h-5 text-[#00d9ff] group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Health Quest Card */}
            <Link
              href="/health-quest"
              className="group relative p-8 rounded-3xl border-2 border-[#00ff884d] text-left transition-all duration-500 hover:border-[#00ff88] hover:-translate-y-3 hover:scale-[1.02]"
              style={{ 
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div 
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                style={{ background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)' }}
              />
              <div 
                className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center text-4xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                style={{ 
                  background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)',
                  boxShadow: '0 0 30px rgba(0, 255, 136, 0.3)'
                }}
              >
                ❤️
              </div>
              <h3 className="font-[family-name:var(--font-orbitron)] text-2xl font-bold text-center mb-2 text-white">
                Health Quest
              </h3>
              <p className="text-gray-400 text-center mb-4 text-sm">
                Strengthen body and mind daily
              </p>

              {/* Health Data Preview */}
              <div className="relative z-10 p-4 rounded-xl mb-4" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#00ff88] text-sm font-medium">Level {stats.health.level} Health Hero</span>
                  <span className="text-xs text-gray-400">{stats.health.currentXP}/100 XP</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00ff88] to-[#00d9ff] rounded-full"
                    style={{ width: `${stats.health.currentXP}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-gray-400">Strength</span>
                    <p className="text-white font-bold">LVL {stats.health.strength.level}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-gray-400">Cardio</span>
                    <p className="text-white font-bold">LVL {stats.health.speed.level}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-gray-400">Nutrition</span>
                    <p className="text-white font-bold">{Math.round(stats.health.nutrition.calories).toLocaleString()} cal</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-gray-400">Sleep Quality</span>
                    <p className="text-[#00ff88] font-bold">{Math.round(stats.health.sleep.quality)}%</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl border-2 border-[#00ff88]/30 bg-[#00ff88]/10 group-hover:bg-[#00ff88]/20 group-hover:border-[#00ff88]/50 transition-all">
                <span className="font-[family-name:var(--font-orbitron)] font-bold text-[#00ff88]">Begin Quest</span>
                <ChevronRight className="w-5 h-5 text-[#00ff88] group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
