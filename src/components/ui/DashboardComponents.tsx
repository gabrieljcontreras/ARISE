'use client';

import React from 'react';

// Stat Bar Component
export function StatBar({ 
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
export function InteractiveStat({ 
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
export function DetailCard({ 
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
export function OverviewStatMini({
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
export function QuestItem({
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

// Page Header Component
export function PageHeader({ 
  showBackButton = false, 
  backHref = '/',
  backText = 'Back'
}: { 
  showBackButton?: boolean;
  backHref?: string;
  backText?: string;
}) {
  return (
    <header className="relative z-10 px-[5%] py-8 flex justify-between items-center">
      <a 
        href="/"
        className="font-[family-name:var(--font-orbitron)] text-3xl font-black tracking-widest cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'glow 3s ease-in-out infinite alternate'
        }}
      >
        ARISE
      </a>
      {showBackButton && (
        <a 
          href={backHref}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backText}
        </a>
      )}
    </header>
  );
}

// Background Component
export function AnimatedBackground() {
  return (
    <>
      <div className="bg-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </>
  );
}
