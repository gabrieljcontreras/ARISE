'use client';

import Link from 'next/link';
import { Swords } from 'lucide-react';
import { useStats } from '@/context/StatsContext';
import { StatBar } from '@/components/ui/DashboardComponents';

export default function Home() {
  const { stats, overallLevel } = useStats();
  
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
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-[5%] pb-12">
        <section className="flex flex-col items-center justify-center min-h-[80vh] text-center" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div style={{ animation: 'slideInLeft 1s ease-out' }}>
            <h1 
              className="font-[family-name:var(--font-orbitron)] text-5xl lg:text-7xl font-black leading-tight mb-6"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #00ff88 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              LEVEL UP YOUR LIFE
            </h1>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-2xl mx-auto">
              Transform your daily habits into an epic adventure. 
              <span className="text-[#00ff88] font-bold"> ARISE</span> gamifies your financial and health goals, 
              turning progress into power.
            </p>

            {/* Character Card on Landing */}
            <div 
              className="relative p-8 rounded-3xl border-2 border-[#00ff884d] max-w-sm mx-auto mb-10"
              style={{ 
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 60px rgba(0, 255, 136, 0.15)',
                animation: 'cardFloat 4s ease-in-out infinite'
              }}
            >
              {/* Avatar */}
              <div className="relative w-28 h-28 mx-auto mb-4">
                <div 
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)',
                    animation: 'avatarPulse 3s ease-in-out infinite'
                  }}
                >
                  <div className="w-[90%] h-[90%] rounded-full bg-[#0a0e27] flex items-center justify-center text-5xl">
                    ⚔️
                  </div>
                </div>
                {/* Level Badge */}
                <div 
                  className="absolute -top-1 -right-1 w-12 h-12 rounded-full flex flex-col items-center justify-center border-3 border-[#050814]"
                  style={{
                    background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)',
                    boxShadow: '0 4px 20px rgba(0, 255, 136, 0.4)'
                  }}
                >
                  <span className="font-[family-name:var(--font-orbitron)] text-[8px] opacity-80">LVL</span>
                  <span className="font-[family-name:var(--font-orbitron)] text-lg font-black">{overallLevel}</span>
                </div>
              </div>

              {/* Character Info */}
              <div className="text-center mb-4">
                <h3 className="font-[family-name:var(--font-orbitron)] text-2xl font-bold text-white">Adventurer</h3>
                <p className="text-[#00ff88] text-sm">Ready for Quests</p>
              </div>

              {/* Preview Stats */}
              <div className="space-y-3">
                <StatBar label="💰 Financial" value={stats.finances.currentXP} max={100} color="from-[#00d9ff] to-[#0099ff]" />
                <StatBar label="❤️ Health" value={stats.health.currentXP} max={100} color="from-[#00ff88] to-[#00d9ff]" />
                <StatBar label="🧠 Intelligence" value={stats.intelligence.currentXP} max={100} color="from-[#a855f7] to-[#ec4899]" />
              </div>
            </div>
            
            {/* Start Quest Button */}
            <Link
              href="/choose-quest"
              className="group relative inline-flex px-12 py-5 rounded-2xl font-[family-name:var(--font-orbitron)] text-xl font-bold text-[#050814] transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)',
                boxShadow: '0 0 40px rgba(0, 255, 136, 0.4), 0 0 80px rgba(0, 255, 136, 0.2)'
              }}
            >
              <span className="relative z-10 flex items-center gap-3">
                <Swords className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                START QUEST
                <Swords className="w-6 h-6 group-hover:-rotate-12 transition-transform" />
              </span>
            </Link>

            {/* Mission Statement */}
            <div 
              className="relative mt-12 p-8 rounded-2xl border border-[#00ff8833] max-w-2xl mx-auto"
              style={{ 
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00ff88] to-[#00d9ff] rounded-l-2xl" />
              <h3 className="font-[family-name:var(--font-orbitron)] text-[#00ff88] text-xl mb-3">Our Mission</h3>
              <p className="text-gray-300 leading-relaxed">
                We believe personal growth should be engaging, rewarding, and fun. 
                ARISE combines the addictive nature of gaming with real-world habit building, 
                helping you become the hero of your own story.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
