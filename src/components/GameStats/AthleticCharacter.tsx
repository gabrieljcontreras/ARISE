// components/AthleticCharacter.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface HealthStats {
  strength: number;
  speed: number;
  nutrition: number;
}

interface CharacterProps {
  stats: HealthStats;
  recentActivity?: 'good' | 'bad' | null;
  healthLevel?: number;
}

const AthleticCharacter: React.FC<CharacterProps> = ({ stats, recentActivity, healthLevel = 1 }) => {
  const [emotion, setEmotion] = useState<'happy' | 'neutral' | 'sad'>('neutral');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(healthLevel);

  const overallHealth = (stats.strength + stats.speed + stats.nutrition) / 3;

  const getPhysique = () => {
    if (overallHealth >= 80) return 'elite';
    if (overallHealth >= 60) return 'fit';
    return 'beginner';
  };

  const physique = getPhysique();

  useEffect(() => {
    if (healthLevel > previousLevel) {
      setIsLevelingUp(true);
      setEmotion('happy');
      
      const timer = setTimeout(() => {
        setIsLevelingUp(false);
        setEmotion('neutral');
        setPreviousLevel(healthLevel);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [healthLevel, previousLevel]);

  useEffect(() => {
    if (recentActivity && !isLevelingUp) {
      setIsAnimating(true);
      setEmotion(recentActivity === 'good' ? 'happy' : 'sad');
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setEmotion('neutral');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [recentActivity, isLevelingUp]);

  const displayStats = isLevelingUp ? {
    strength: 0,
    speed: 0,
    nutrition: 0
  } : stats;

  const shoulderWidth = 80 + (displayStats.strength / 100) * 50;
  const chestWidth = 70 + (displayStats.strength / 100) * 40;
  const waistWidth = 50 + (displayStats.nutrition / 100) * 20;
  const armThickness = 12 + (displayStats.strength / 100) * 12;
  const legThickness = 16 + (displayStats.speed / 100) * 14;
  const muscleDefinition = displayStats.strength > 70;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <svg 
        width="200" 
        height="280" 
        viewBox="0 0 240 340"
        className={`transition-all duration-500 ${isAnimating ? 'scale-110' : 'scale-100'}`}
      >
        <circle cx="120" cy="50" r="32" fill="#FFD4A3" className="transition-all duration-300" />
        <rect x="108" y="75" width="24" height="15" fill="#FFD4A3" rx="4" />
        
        {emotion === 'happy' && (
          <>
            <circle cx="108" cy="45" r="4" fill="#000" />
            <circle cx="132" cy="45" r="4" fill="#000" />
            <path d="M 105 58 Q 120 70 135 58" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 100 38 L 105 42" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <path d="M 140 38 L 135 42" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {emotion === 'neutral' && (
          <>
            <circle cx="108" cy="45" r="4" fill="#000" />
            <circle cx="132" cy="45" r="4" fill="#000" />
            <path d="M 105 62 Q 120 64 135 62" stroke="#000" strokeWidth="2" fill="none" />
          </>
        )}
        {emotion === 'sad' && (
          <>
            <circle cx="108" cy="45" r="4" fill="#000" />
            <circle cx="132" cy="45" r="4" fill="#000" />
            <path d="M 105 68 Q 120 58 135 68" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}
        
        <defs>
          <linearGradient id="torsoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#3730A3" />
          </linearGradient>
          <linearGradient id="armGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD4A3" />
            <stop offset="50%" stopColor="#FFB380" />
            <stop offset="100%" stopColor="#FFD4A3" />
          </linearGradient>
          <linearGradient id="legGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3730A3" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>
        </defs>
        
        <ellipse cx="120" cy="95" rx={shoulderWidth/2} ry="18" fill="url(#torsoGradient)" className="transition-all duration-500" />
        <rect x={120 - chestWidth/2} y="100" width={chestWidth} height="50" rx="15" fill="url(#torsoGradient)" className="transition-all duration-500" />
        
        {muscleDefinition && (
          <>
            <ellipse cx="105" cy="115" rx="15" ry="20" fill="#3730A3" opacity="0.5" />
            <ellipse cx="135" cy="115" rx="15" ry="20" fill="#3730A3" opacity="0.5" />
          </>
        )}
        
        <path d={`M ${120 - chestWidth/2} 150 L ${120 - waistWidth/2} 190 L ${120 + waistWidth/2} 190 L ${120 + chestWidth/2} 150 Z`} fill="url(#torsoGradient)" className="transition-all duration-500" />
        
        {muscleDefinition && (
          <g opacity="0.6">
            <rect x="108" y="155" width="10" height="12" rx="2" fill="#1E1B4B" />
            <rect x="122" y="155" width="10" height="12" rx="2" fill="#1E1B4B" />
            <rect x="108" y="170" width="10" height="12" rx="2" fill="#1E1B4B" />
            <rect x="122" y="170" width="10" height="12" rx="2" fill="#1E1B4B" />
          </g>
        )}
        
        <g className="transition-all duration-500">
          <ellipse cx={120 - shoulderWidth/2 - 8} cy="115" rx={armThickness} ry="35" fill="url(#armGradient)" />
          {muscleDefinition && <ellipse cx={120 - shoulderWidth/2 - 5} cy="120" rx={armThickness - 3} ry="18" fill="#FFB380" opacity="0.6" />}
          <ellipse cx={120 - shoulderWidth/2 - 10} cy="155" rx={armThickness - 3} ry="28" fill="url(#armGradient)" />
        </g>
        
        <g className="transition-all duration-500">
          <ellipse cx={120 + shoulderWidth/2 + 8} cy="115" rx={armThickness} ry="35" fill="url(#armGradient)" />
          {muscleDefinition && <ellipse cx={120 + shoulderWidth/2 + 5} cy="120" rx={armThickness - 3} ry="18" fill="#FFB380" opacity="0.6" />}
          <ellipse cx={120 + shoulderWidth/2 + 10} cy="155" rx={armThickness - 3} ry="28" fill="url(#armGradient)" />
        </g>
        
        <g className="transition-all duration-500">
          <ellipse cx="100" cy="220" rx={legThickness} ry="35" fill="url(#legGradient)" />
          {muscleDefinition && <ellipse cx="100" cy="215" rx={legThickness - 4} ry="20" fill="#1E1B4B" opacity="0.4" />}
          <ellipse cx="98" cy="270" rx={legThickness - 4} ry="30" fill="url(#legGradient)" />
          <ellipse cx="97" cy="305" rx="18" ry="10" fill="#FF3366" />
        </g>
        
        <g className="transition-all duration-500">
          <ellipse cx="140" cy="220" rx={legThickness} ry="35" fill="url(#legGradient)" />
          {muscleDefinition && <ellipse cx="140" cy="215" rx={legThickness - 4} ry="20" fill="#1E1B4B" opacity="0.4" />}
          <ellipse cx="142" cy="270" rx={legThickness - 4} ry="30" fill="url(#legGradient)" />
          <ellipse cx="143" cy="305" rx="18" ry="10" fill="#FF3366" />
        </g>
      </svg>

      <div className="mt-3 text-center">
        <p className="text-white text-lg font-bold">
          {physique === 'elite' && '🏆 Elite Athlete'}
          {physique === 'fit' && '💪 Fit & Strong'}
          {physique === 'beginner' && '🌱 Building Strength'}
        </p>
        <p className="text-gray-400 text-xs mt-1">Health: {overallHealth.toFixed(0)}%</p>
      </div>

      {isAnimating && !isLevelingUp && (
        <div className={`mt-3 px-4 py-2 rounded-xl ${emotion === 'happy' ? 'bg-green-500' : 'bg-red-500'} text-white text-sm font-semibold animate-bounce shadow-lg`}>
          {emotion === 'happy' ? '🎉 Great!' : '😔 Try harder!'}
        </div>
      )}
      
      {isLevelingUp && (
        <div className="mt-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-bold animate-pulse shadow-2xl">
          🎊 LEVEL UP! 🎊
          <div className="text-xs font-normal mt-1">Level {healthLevel}!</div>
        </div>
      )}
    </div>
  );
};

export default AthleticCharacter;