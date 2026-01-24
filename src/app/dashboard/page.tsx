'use client';

import { useState } from 'react';
import { Swords, Heart, ArrowLeft, ChevronRight } from 'lucide-react';
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

type ViewState = 'landing' | 'choose-quest' | 'financial-quest' | 'health-quest';
type ExpandedStat = string | null;

// Define daily quests
interface DailyQuest {
  id: string;
  text: string;
  xp: number;
  category: 'financial' | 'health';
}

const FINANCIAL_QUESTS: DailyQuest[] = [
  { id: 'f1', text: 'Log today\'s expenses', xp: 10, category: 'financial' },
  { id: 'f2', text: 'Review your budget', xp: 15, category: 'financial' },
  { id: 'f3', text: 'Check savings goal', xp: 10, category: 'financial' },
  { id: 'f4', text: 'Research investments', xp: 20, category: 'financial' },
];

const HEALTH_QUESTS: DailyQuest[] = [
  { id: 'h1', text: 'Complete a workout', xp: 20, category: 'health' },
  { id: 'h2', text: 'Log your meals', xp: 15, category: 'health' },
  { id: 'h3', text: 'Drink 8 glasses of water', xp: 10, category: 'health' },
  { id: 'h4', text: 'Get 7+ hours of sleep', xp: 15, category: 'health' },
];

export default function DashboardPage() {
  const [view, setView] = useState<ViewState>('landing');
  const [expandedStat, setExpandedStat] = useState<ExpandedStat>(null);
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    finances: { 
      level: 12, 
      currentXP: 75,
      savings: { level: 8, currentXP: 60, amount: 5420 },
      budget: { level: 10, currentXP: 80, spent: 1250, limit: 2000 },
      investments: { level: 5, currentXP: 35, value: 12500, growth: 8.5 },
      debts: { level: 7, currentXP: 45, remaining: 3200, paid: 6800 }
    },
    health: { 
      level: 8, 
      currentXP: 82, 
      strength: { level: 6, currentXP: 45, workouts: 12, maxLift: 225 },
      speed: { level: 5, currentXP: 60, runs: 8, bestMile: '7:32' },
      nutrition: { level: 7, currentXP: 30, calories: 2100, protein: 140 },
      sleep: { level: 6, currentXP: 55, avgHours: 7.2, quality: 82 }
    },
    intelligence: { level: 10, currentXP: 65 },
  });

  const totalXP = (stats.finances.level * 100 + stats.finances.currentXP) + 
                  (stats.health.level * 100 + stats.health.currentXP) + 
                  (stats.intelligence.level * 100 + stats.intelligence.currentXP);

  const handleStatChange = (changes: StatChanges) => {
    setStats(prev => {
      const newStats = { ...prev };
      
      if (changes.finances) {
        newStats.finances = {
          ...newStats.finances,
          currentXP: Math.min(100, Math.max(0, newStats.finances.currentXP + (changes.finances.currentXP || 0))),
        };
        if (newStats.finances.currentXP >= 100) {
          newStats.finances.level += 1;
          newStats.finances.currentXP -= 100;
        }
      }
      
      if (changes.health) {
        let healthXP = newStats.health.currentXP + (changes.health.currentXP || 0);
        let healthLevel = newStats.health.level;
        if (healthXP >= 100) {
          healthLevel += 1;
          healthXP -= 100;
        }
        healthXP = Math.min(100, Math.max(0, healthXP));

        let strengthXP = newStats.health.strength.currentXP + (changes.health.strength || 0);
        let strengthLevel = newStats.health.strength.level;
        if (strengthXP >= 100) {
          strengthLevel += 1;
          strengthXP -= 100;
        }
        strengthXP = Math.min(100, Math.max(0, strengthXP));

        let speedXP = newStats.health.speed.currentXP + (changes.health.speed || 0);
        let speedLevel = newStats.health.speed.level;
        if (speedXP >= 100) {
          speedLevel += 1;
          speedXP -= 100;
        }
        speedXP = Math.min(100, Math.max(0, speedXP));

        let nutritionXP = newStats.health.nutrition.currentXP + (changes.health.nutrition || 0);
        let nutritionLevel = newStats.health.nutrition.level;
        if (nutritionXP >= 100) {
          nutritionLevel += 1;
          nutritionXP -= 100;
        }
        nutritionXP = Math.min(100, Math.max(0, nutritionXP));

        newStats.health = {
          ...newStats.health,
          level: healthLevel,
          currentXP: healthXP,
          strength: { ...newStats.health.strength, level: strengthLevel, currentXP: strengthXP },
          speed: { ...newStats.health.speed, level: speedLevel, currentXP: speedXP },
          nutrition: { ...newStats.health.nutrition, level: nutritionLevel, currentXP: nutritionXP }
        };
      }
      
      if (changes.intelligence) {
        newStats.intelligence = {
          ...newStats.intelligence,
          currentXP: Math.min(100, Math.max(0, newStats.intelligence.currentXP + (changes.intelligence.currentXP || 0))),
        };
        if (newStats.intelligence.currentXP >= 100) {
          newStats.intelligence.level += 1;
          newStats.intelligence.currentXP -= 100;
        }
      }
      
      return newStats;
    });
  };

  const toggleQuestCompletion = (questId: string, xp: number, category: 'financial' | 'health') => {
    setCompletedQuests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questId)) {
        newSet.delete(questId);
        // Remove XP when uncompleting
        if (category === 'financial') {
          handleStatChange({ finances: { currentXP: -xp } });
        } else {
          handleStatChange({ health: { currentXP: -xp } });
        }
      } else {
        newSet.add(questId);
        // Add XP when completing
        if (category === 'financial') {
          handleStatChange({ finances: { currentXP: xp } });
        } else {
          handleStatChange({ health: { currentXP: xp } });
        }
      }
      return newSet;
    });
  };

  const overallLevel = Math.floor((stats.finances.level + stats.health.level + stats.intelligence.level) / 3);
  const questType = view === 'financial-quest' ? 'financial' : 'health';

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <div className="bg-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Header */}
      <header className="relative z-10 px-[5%] py-8 flex justify-between items-center">
        <button 
          onClick={() => setView('landing')}
          className="font-[family-name:var(--font-orbitron)] text-3xl font-black tracking-widest cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'glow 3s ease-in-out infinite alternate'
          }}
        >
          ARISE
        </button>
        {view !== 'landing' && (
          <button 
            onClick={() => view === 'choose-quest' ? setView('landing') : setView('choose-quest')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            {view === 'choose-quest' ? 'Back to Home' : 'Change Quest'}
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-[5%] pb-12">
        
        {/* ===== LANDING PAGE ===== */}
        {view === 'landing' && (
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
              <button
                onClick={() => setView('choose-quest')}
                className="group relative px-12 py-5 rounded-2xl font-[family-name:var(--font-orbitron)] text-xl font-bold text-[#050814] transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
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
              </button>

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
        )}

        {/* ===== CHOOSE QUEST PAGE ===== */}
        {view === 'choose-quest' && (
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
              <button
                onClick={() => setView('financial-quest')}
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
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-white/5">
                      <span className="text-gray-400">Savings</span>
                      <p className="text-white font-bold">${stats.finances.savings.amount.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <span className="text-gray-400">Budget</span>
                      <p className="text-white font-bold">${stats.finances.budget.limit - stats.finances.budget.spent} left</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <span className="text-gray-400">Investments</span>
                      <p className="text-[#00ff88] font-bold">+{stats.finances.investments.growth}%</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <span className="text-gray-400">Debt Progress</span>
                      <p className="text-white font-bold">{Math.round((stats.finances.debts.paid / (stats.finances.debts.paid + stats.finances.debts.remaining)) * 100)}%</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl border-2 border-[#00d9ff]/30 bg-[#00d9ff]/10 group-hover:bg-[#00d9ff]/20 group-hover:border-[#00d9ff]/50 transition-all">
                  <span className="font-[family-name:var(--font-orbitron)] font-bold text-[#00d9ff]">Begin Quest</span>
                  <ChevronRight className="w-5 h-5 text-[#00d9ff] group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Health Quest Card */}
              <button
                onClick={() => setView('health-quest')}
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
                      <p className="text-white font-bold">{stats.health.nutrition.calories} cal</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <span className="text-gray-400">Sleep Quality</span>
                      <p className="text-[#00ff88] font-bold">{stats.health.sleep.quality}%</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl border-2 border-[#00ff88]/30 bg-[#00ff88]/10 group-hover:bg-[#00ff88]/20 group-hover:border-[#00ff88]/50 transition-all">
                  <span className="font-[family-name:var(--font-orbitron)] font-bold text-[#00ff88]">Begin Quest</span>
                  <ChevronRight className="w-5 h-5 text-[#00ff88] group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </section>
        )}

        {/* ===== FINANCIAL QUEST PAGE ===== */}
        {view === 'financial-quest' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Main Section: Character Center + Overview Side */}
            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              {/* Left Column - Financial Overview */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                <div 
                  className="p-6 rounded-3xl border-2 border-[#00d9ff4d]"
                  style={{ 
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <h3 
                    className="font-[family-name:var(--font-orbitron)] text-xl font-bold mb-6 text-center"
                    style={{
                      background: 'linear-gradient(135deg, #00d9ff 0%, #0099ff 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    💰 Financial Overview
                  </h3>
                  <div className="space-y-4">
                    <OverviewStatMini 
                      label="Savings" 
                      icon="🏦" 
                      level={stats.finances.savings.level} 
                      xp={stats.finances.savings.currentXP}
                      color="#00d9ff"
                      onClick={() => setExpandedStat(expandedStat === 'savings' ? null : 'savings')}
                    />
                    <OverviewStatMini 
                      label="Budget" 
                      icon="📊" 
                      level={stats.finances.budget.level} 
                      xp={stats.finances.budget.currentXP}
                      color="#0099ff"
                      onClick={() => setExpandedStat(expandedStat === 'budget' ? null : 'budget')}
                    />
                    <OverviewStatMini 
                      label="Investments" 
                      icon="📈" 
                      level={stats.finances.investments.level} 
                      xp={stats.finances.investments.currentXP}
                      color="#a855f7"
                      onClick={() => setExpandedStat(expandedStat === 'investments' ? null : 'investments')}
                    />
                    <OverviewStatMini 
                      label="Debt Slayer" 
                      icon="⚔️" 
                      level={stats.finances.debts.level} 
                      xp={stats.finances.debts.currentXP}
                      color="#f59e0b"
                      onClick={() => setExpandedStat(expandedStat === 'debts' ? null : 'debts')}
                    />
                  </div>
                  <p className="text-center text-gray-500 text-sm mt-4">Click a stat to see details below</p>
                </div>
              </div>

              {/* Center Column - Character Card */}
              <div className="lg:col-span-1 order-1 lg:order-2">
                <div 
                  className="relative p-8 rounded-3xl border-2 border-[#00d9ff4d]"
                  style={{ 
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 0 60px rgba(0, 217, 255, 0.15)',
                    animation: 'cardFloat 4s ease-in-out infinite'
                  }}
                >
                  {/* Avatar */}
                  <div className="relative w-36 h-36 mx-auto mb-4">
                    <div 
                      className="w-full h-full rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #00d9ff 0%, #0099ff 100%)',
                        animation: 'avatarPulse 3s ease-in-out infinite'
                      }}
                    >
                      <div className="w-[90%] h-[90%] rounded-full bg-[#0a0e27] flex items-center justify-center text-6xl">
                        💰
                      </div>
                    </div>
                    {/* Level Badge */}
                    <div 
                      className="absolute -top-1 -right-1 w-14 h-14 rounded-full flex flex-col items-center justify-center border-3 border-[#050814]"
                      style={{
                        background: 'linear-gradient(135deg, #00d9ff 0%, #0099ff 100%)',
                        boxShadow: '0 4px 20px rgba(0, 217, 255, 0.4)'
                      }}
                    >
                      <span className="font-[family-name:var(--font-orbitron)] text-[8px] opacity-80">LVL</span>
                      <span className="font-[family-name:var(--font-orbitron)] text-xl font-black">{stats.finances.level}</span>
                    </div>
                  </div>

                  {/* Character Info */}
                  <div className="text-center mb-6">
                    <h3 className="font-[family-name:var(--font-orbitron)] text-2xl font-bold text-white">Wealth Warrior</h3>
                    <p className="text-[#00d9ff] text-sm">Financial Champion</p>
                  </div>

                  {/* Main Stats */}
                  <div className="space-y-3 mb-6">
                    <StatBar label="💰 Financial XP" value={stats.finances.currentXP} max={100} color="from-[#00d9ff] to-[#0099ff]" />
                    <StatBar label="⭐ Total XP" value={totalXP} max={5000} color="from-[#f59e0b] to-[#ef4444]" showValue />
                  </div>

                  {/* ChatBox */}
                  <ChatBox onStatChange={handleStatChange} questType="financial" />
                </div>
              </div>

              {/* Right Column - Quick Actions / Tips */}
              <div className="lg:col-span-1 order-3">
                <div 
                  className="p-6 rounded-3xl border-2 border-[#00d9ff4d]"
                  style={{ 
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <h3 className="font-[family-name:var(--font-orbitron)] text-lg font-bold mb-4 text-[#00d9ff]">📋 Daily Quests</h3>
                  <div className="space-y-3">
                    {FINANCIAL_QUESTS.map(quest => (
                      <QuestItem 
                        key={quest.id}
                        text={quest.text} 
                        xp={quest.xp} 
                        completed={completedQuests.has(quest.id)}
                        onClick={() => toggleQuestCompletion(quest.id, quest.xp, quest.category)}
                      />
                    ))}
                  </div>
                  <div className="mt-6 p-4 rounded-xl bg-[#00d9ff]/10 border border-[#00d9ff]/30">
                    <p className="text-sm text-gray-300">
                      💡 <span className="text-[#00d9ff] font-medium">Tip:</span> Consistent budgeting can boost your Financial Power by 50%!
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
                  background: 'linear-gradient(135deg, #00d9ff 0%, #0099ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                💰 Detailed Financial Stats
              </h2>
              <p className="text-center text-gray-400 mb-8">Click on any stat to expand and see more details</p>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Savings Stat */}
                <InteractiveStat
                  id="savings"
                  title="Savings"
                  icon="🏦"
                  level={stats.finances.savings.level}
                  xp={stats.finances.savings.currentXP}
                  color="#00d9ff"
                  expanded={expandedStat === 'savings'}
                  onClick={() => setExpandedStat(expandedStat === 'savings' ? null : 'savings')}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <DetailCard label="Total Saved" value={`$${stats.finances.savings.amount.toLocaleString()}`} />
                    <DetailCard label="Monthly Goal" value="$500" />
                    <DetailCard label="Streak" value="12 weeks" />
                    <DetailCard label="Next Milestone" value="$6,000" />
                  </div>
                </InteractiveStat>

                {/* Budget Stat */}
                <InteractiveStat
                  id="budget"
                  title="Budget Mastery"
                  icon="📊"
                  level={stats.finances.budget.level}
                  xp={stats.finances.budget.currentXP}
                  color="#0099ff"
                  expanded={expandedStat === 'budget'}
                  onClick={() => setExpandedStat(expandedStat === 'budget' ? null : 'budget')}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <DetailCard label="Spent This Month" value={`$${stats.finances.budget.spent.toLocaleString()}`} />
                    <DetailCard label="Budget Limit" value={`$${stats.finances.budget.limit.toLocaleString()}`} />
                    <DetailCard label="Remaining" value={`$${(stats.finances.budget.limit - stats.finances.budget.spent).toLocaleString()}`} />
                    <DetailCard label="On Track" value="✓ Yes" />
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Budget Usage</span>
                      <span className="text-[#0099ff]">{Math.round((stats.finances.budget.spent / stats.finances.budget.limit) * 100)}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00d9ff] to-[#0099ff] rounded-full"
                        style={{ width: `${(stats.finances.budget.spent / stats.finances.budget.limit) * 100}%` }}
                      />
                    </div>
                  </div>
                </InteractiveStat>

                {/* Investments Stat */}
                <InteractiveStat
                  id="investments"
                  title="Investments"
                  icon="📈"
                  level={stats.finances.investments.level}
                  xp={stats.finances.investments.currentXP}
                  color="#a855f7"
                  expanded={expandedStat === 'investments'}
                  onClick={() => setExpandedStat(expandedStat === 'investments' ? null : 'investments')}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <DetailCard label="Portfolio Value" value={`$${stats.finances.investments.value.toLocaleString()}`} />
                    <DetailCard label="Growth" value={`+${stats.finances.investments.growth}%`} positive />
                    <DetailCard label="Monthly Contribution" value="$200" />
                    <DetailCard label="Next Goal" value="$15,000" />
                  </div>
                </InteractiveStat>

                {/* Debt Reduction Stat */}
                <InteractiveStat
                  id="debts"
                  title="Debt Slayer"
                  icon="⚔️"
                  level={stats.finances.debts.level}
                  xp={stats.finances.debts.currentXP}
                  color="#f59e0b"
                  expanded={expandedStat === 'debts'}
                  onClick={() => setExpandedStat(expandedStat === 'debts' ? null : 'debts')}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <DetailCard label="Remaining Debt" value={`$${stats.finances.debts.remaining.toLocaleString()}`} />
                    <DetailCard label="Paid Off" value={`$${stats.finances.debts.paid.toLocaleString()}`} positive />
                    <DetailCard label="Progress" value={`${Math.round((stats.finances.debts.paid / (stats.finances.debts.paid + stats.finances.debts.remaining)) * 100)}%`} />
                    <DetailCard label="Est. Payoff" value="8 months" />
                  </div>
                </InteractiveStat>
              </div>
            </div>
          </div>
        )}

        {/* ===== HEALTH QUEST PAGE ===== */}
        {view === 'health-quest' && (
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
                  <ChatBox onStatChange={handleStatChange} questType="health" />
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
                    {HEALTH_QUESTS.map(quest => (
                      <QuestItem 
                        key={quest.id}
                        text={quest.text} 
                        xp={quest.xp} 
                        completed={completedQuests.has(quest.id)}
                        onClick={() => toggleQuestCompletion(quest.id, quest.xp, quest.category)}
                      />
                    ))}
                  </div>
                  <div className="mt-6 p-4 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30">
                    <p className="text-sm text-gray-300">
                      💡 <span className="text-[#00ff88] font-medium">Tip:</span> Consistent sleep schedules can boost your Health Vitality by 30%!
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

              <div className="grid lg:grid-cols-2 gap-6">
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
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// Stat Bar Component
function StatBar({ 
  label, 
  value, 
  max, 
  color,
  showValue = false 
}: { 
  label: string; 
  value: number; 
  max: number; 
  color: string;
  showValue?: boolean;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">{showValue ? value.toLocaleString() : `${value}/${max}`}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000`}
          style={{ 
            width: `${percentage}%`,
            boxShadow: '0 0 10px rgba(0, 255, 136, 0.3)'
          }}
        />
      </div>
    </div>
  );
}

// Interactive Stat Component
function InteractiveStat({ 
  id,
  title, 
  icon, 
  level, 
  xp, 
  color,
  expanded,
  onClick,
  children 
}: { 
  id: string;
  title: string; 
  icon: string; 
  level: number; 
  xp: number;
  color: string;
  expanded: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div 
      className={`rounded-2xl border-2 transition-all duration-500 cursor-pointer overflow-hidden ${
        expanded ? 'border-opacity-100' : 'border-opacity-30 hover:border-opacity-60'
      }`}
      style={{ 
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(20px)',
        borderColor: color,
      }}
      onClick={onClick}
    >
      {/* Header - Always visible */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: `${color}20` }}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-orbitron)] text-xl font-bold text-white">{title}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span 
                className="text-sm font-bold px-2 py-0.5 rounded"
                style={{ background: `${color}30`, color: color }}
              >
                LVL {level}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${xp}%`, background: color }}
                  />
                </div>
                <span className="text-xs text-gray-400">{xp}/100 XP</span>
              </div>
            </div>
          </div>
        </div>
        <div 
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ${
            expanded ? 'rotate-180' : ''
          }`}
          style={{ background: `${color}20` }}
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke={color} 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      <div 
        className={`overflow-hidden transition-all duration-500 ${
          expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6 pt-2 border-t border-white/10">
          {children}
        </div>
      </div>
    </div>
  );
}

// Detail Card Component
function DetailCard({ 
  label, 
  value, 
  positive = false 
}: { 
  label: string; 
  value: string; 
  positive?: boolean;
}) {
  return (
    <div 
      className="p-4 rounded-xl"
      style={{ background: 'rgba(255, 255, 255, 0.05)' }}
    >
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`font-[family-name:var(--font-orbitron)] text-xl font-bold ${
        positive ? 'text-[#00ff88]' : 'text-white'
      }`}>
        {value}
      </p>
    </div>
  );
}

// Overview Stat Mini Component (for sidebar)
function OverviewStatMini({
  label,
  icon,
  level,
  xp,
  color,
  onClick
}: {
  label: string;
  icon: string;
  level: number;
  xp: number;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-300 hover:scale-[1.02]"
      style={{ 
        background: `${color}10`,
        border: `1px solid ${color}30`
      }}
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
        style={{ background: `${color}20` }}
      >
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium">{label}</span>
          <span 
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: `${color}30`, color: color }}
          >
            LVL {level}
          </span>
        </div>
        <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${xp}%`, background: color }}
          />
        </div>
      </div>
    </button>
  );
}

// Quest Item Component
function QuestItem({
  text,
  xp,
  completed,
  onClick
}: {
  text: string;
  xp: number;
  completed: boolean;
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-3 rounded-xl flex items-center justify-between transition-all cursor-pointer hover:scale-[1.02] ${
        completed ? 'opacity-70' : ''
      }`}
      style={{ 
        background: completed ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        border: completed ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="flex items-center gap-3">
        <div 
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all ${
            completed ? 'bg-[#00ff88] text-[#050814]' : 'border border-gray-500 hover:border-[#00ff88]'
          }`}
        >
          {completed && '✓'}
        </div>
        <span className={`text-sm text-left ${completed ? 'text-gray-400 line-through' : 'text-white'}`}>
          {text}
        </span>
      </div>
      <span className={`text-xs font-bold ${completed ? 'text-gray-500' : 'text-[#00ff88]'}`}>
        {completed ? '✓' : '+'}{xp} XP
      </span>
    </button>
  );
}
