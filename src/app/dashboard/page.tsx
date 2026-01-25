'use client';

import { useState, useEffect } from 'react';
import { Swords, Heart, ArrowLeft, ChevronRight } from 'lucide-react';
import ChatBox from '@/components/ChatBox';
import SoundToggle from '@/components/SoundToggle';
import { getSoundSystem } from '@/lib/soundSystem';

// Activity data types from Gemini API
interface WorkoutActivity {
  type: 'workout';
  workoutType: string;
  duration: number;
  description: string;
  xp: number;
  timestamp: Date;
}

interface NutritionActivity {
  type: 'nutrition';
  meal: string;
  calories: number;
  protein: number;
  xp: number;
  timestamp: Date;
}

interface SleepActivity {
  type: 'sleep';
  hours: number;
  quality: string;
  xp: number;
  timestamp: Date;
}

interface SavingsActivity {
  type: 'savings';
  amount: number;
  xp: number;
  timestamp: Date;
}

interface InvestmentActivity {
  type: 'investment';
  amount: number;
  growth: number;
  xp: number;
  timestamp: Date;
}

interface BudgetActivity {
  type: 'budget';
  category: string;
  amount: number;
  xp: number;
  timestamp: Date;
}

interface DebtActivity {
  type: 'debt';
  amount: number;
  xp: number;
  timestamp: Date;
}

type ActivityData = WorkoutActivity | NutritionActivity | SleepActivity | SavingsActivity | InvestmentActivity | BudgetActivity | DebtActivity;

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
  activityData?: {
    type: string;
    workoutType?: string;
    duration?: number;
    description?: string;
    meal?: string;
    calories?: number;
    protein?: number;
    hours?: number;
    quality?: string;
    amount?: number;
    growth?: number;
    category?: string;
  };
}

type ViewState = 'landing' | 'choose-quest' | 'financial-quest' | 'health-quest';
type ExpandedStat = string | null;

// Define daily quests interface
interface DailyQuest {
  id: string;
  text: string;
  xp: number;
  category: 'financial' | 'health';
}

// Budget Goal interface
interface BudgetGoal {
  id: string;
  category: string;
  amount: number;
  currentSpending: number;
  period: string;
  status: string;
}

// Capital One data interface
interface CapitalOneData {
  currentBalance: number;
  savings: {
    totalSavedThisMonth: number;
    totalDeposits: number;
  };
  budget: {
    totalSpentThisMonth: number;
    totalSpentThisWeek: number;
    spendingByCategory: Record<string, number>;
    weeklySpending: Record<string, number>;
    transactionCount: number;
  };
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
    merchantName: string;
  }>;
}

export default function DashboardPage() {
  const [view, setView] = useState<ViewState>('landing');
  const [expandedStat, setExpandedStat] = useState<ExpandedStat>(null);
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set());
  const [financialQuests, setFinancialQuests] = useState<DailyQuest[]>([]);
  const [healthQuests, setHealthQuests] = useState<DailyQuest[]>([]);
  
  // Activity tracking state
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutActivity[]>([]);
  const [nutritionLog, setNutritionLog] = useState<NutritionActivity[]>([]);
  const [sleepLog, setSleepLog] = useState<SleepActivity[]>([]);
  const [financialActivities, setFinancialActivities] = useState<(SavingsActivity | InvestmentActivity | BudgetActivity | DebtActivity)[]>([]);
  
  // Capital One data state
  const [capitalOneData, setCapitalOneData] = useState<CapitalOneData | null>(null);
  const [capitalOneLoading, setCapitalOneLoading] = useState(true);
  
  // Budget goals state
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  
  const [stats, setStats] = useState({
    finances: { 
      level: 1, 
      currentXP: 0,
      savings: { level: 1, currentXP: 0, amount: 0 },
      budget: { level: 1, currentXP: 0, spent: 0, limit: 2000 },
      investments: { level: 1, currentXP: 0, value: 0, growth: 0 },
      debts: { level: 1, currentXP: 0, remaining: 0, paid: 0 }
    },
    health: { 
      level: 1, 
      currentXP: 0, 
      strength: { level: 1, currentXP: 0, workouts: 0, maxLift: 0 },
      speed: { level: 1, currentXP: 0, runs: 0, bestMile: '--:--' },
      nutrition: { level: 1, currentXP: 0, calories: 0, protein: 0 },
      sleep: { level: 1, currentXP: 0, avgHours: 0, quality: 0 }
    },
    intelligence: { level: 1, currentXP: 0 },
  });

  // Fetch Capital One data function (can be called manually)
  const fetchCapitalOneData = async () => {
    try {
      setCapitalOneLoading(true);
      const response = await fetch('/api/capital-one-data');
      const data = await response.json();
      if (data.success) {
        setCapitalOneData(data.data);
        // Update stats with Capital One data
        setStats(prev => ({
          ...prev,
          finances: {
            ...prev.finances,
            savings: {
              ...prev.finances.savings,
              amount: data.data.currentBalance
            },
            budget: {
              ...prev.finances.budget,
              spent: data.data.budget.totalSpentThisMonth
            }
          }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch Capital One data:', error);
    } finally {
      setCapitalOneLoading(false);
    }
  };

  // Fetch budget goals
  const fetchBudgetGoals = async () => {
    try {
      const response = await fetch('/api/budget-goals');
      const data = await response.json();
      if (data.success) {
        setBudgetGoals(data.goals);
      }
    } catch (error) {
      console.error('Failed to fetch budget goals:', error);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchCapitalOneData();
    fetchBudgetGoals();
  }, []);

  const totalXP = ((stats.finances.level - 1) * 100 + stats.finances.currentXP) + 
                  ((stats.health.level - 1) * 100 + stats.health.currentXP) + 
                  ((stats.intelligence.level - 1) * 100 + stats.intelligence.currentXP);

  const handleStatChange = (changes: StatChanges) => {
    // Handle activity data tracking AND XP updates in a single setStats call
    const activity = changes.activityData;
    const timestamp = new Date();
    
    // Add to activity logs first (these don't affect stats object)
    if (activity) {
      const xp = changes.health?.currentXP || changes.finances?.currentXP || 0;
      
      switch (activity.type) {
        case 'workout':
          setWorkoutHistory(prev => [...prev, {
            type: 'workout',
            workoutType: activity.workoutType || 'General',
            duration: activity.duration || 0,
            description: activity.description || '',
            xp,
            timestamp
          }]);
          break;
        case 'nutrition':
          setNutritionLog(prev => [...prev, {
            type: 'nutrition',
            meal: activity.meal || 'Meal',
            calories: activity.calories || 0,
            protein: activity.protein || 0,
            xp,
            timestamp
          }]);
          break;
        case 'sleep':
          setSleepLog(prev => [...prev, {
            type: 'sleep',
            hours: activity.hours || 0,
            quality: activity.quality || 'good',
            xp,
            timestamp
          }]);
          break;
        case 'savings':
        case 'investment':
        case 'budget':
        case 'debt':
          setFinancialActivities(prev => [...prev, {
            type: activity.type as 'savings' | 'investment' | 'budget' | 'debt',
            amount: activity.amount || 0,
            growth: activity.growth,
            category: activity.category,
            xp,
            timestamp
          } as typeof prev[number]]);
          break;
      }
    }
    
    // Now update all stats in a single setStats call
    setStats(prev => {
      const newStats = { ...prev };
      
      // Handle activity-specific detailed data updates
      if (activity) {
        switch (activity.type) {
          case 'workout':
            newStats.health = {
              ...newStats.health,
              strength: {
                ...newStats.health.strength,
                workouts: newStats.health.strength.workouts + 1
              }
            };
            break;
          case 'nutrition':
            newStats.health = {
              ...newStats.health,
              nutrition: {
                ...newStats.health.nutrition,
                calories: newStats.health.nutrition.calories + (activity.calories || 0),
                protein: newStats.health.nutrition.protein + (activity.protein || 0)
              }
            };
            break;
          case 'sleep':
            const avgHours = sleepLog.length > 0 
              ? (sleepLog.reduce((sum, s) => sum + s.hours, 0) + (activity.hours || 0)) / (sleepLog.length + 1)
              : activity.hours || 0;
            newStats.health = {
              ...newStats.health,
              sleep: {
                ...newStats.health.sleep,
                avgHours: Math.round(avgHours * 10) / 10
              }
            };
            break;
          case 'savings':
            newStats.finances = {
              ...newStats.finances,
              savings: {
                ...newStats.finances.savings,
                amount: newStats.finances.savings.amount + (activity.amount || 0)
              }
            };
            break;
          case 'investment':
            newStats.finances = {
              ...newStats.finances,
              investments: {
                ...newStats.finances.investments,
                value: newStats.finances.investments.value + (activity.amount || 0),
                growth: activity.growth || newStats.finances.investments.growth
              }
            };
            break;
          case 'budget':
            newStats.finances = {
              ...newStats.finances,
              budget: {
                ...newStats.finances.budget,
                spent: newStats.finances.budget.spent + (activity.amount || 0)
              }
            };
            break;
          case 'debt':
            newStats.finances = {
              ...newStats.finances,
              debts: {
                ...newStats.finances.debts,
                paid: newStats.finances.debts.paid + (activity.amount || 0)
              }
            };
            break;
        }
      }
      
      // Handle XP updates for finances
      if (changes.finances) {
        let financeXP = newStats.finances.currentXP + (changes.finances.currentXP || 0);
        let financeLevel = newStats.finances.level;
        if (financeXP >= 100) {
          financeLevel += 1;
          financeXP -= 100;
        }
        financeXP = Math.min(100, Math.max(0, financeXP));
        
        // Also update sub-stat XP for finances based on activity type
        let savingsXP = newStats.finances.savings.currentXP;
        let savingsLevel = newStats.finances.savings.level;
        let budgetXP = newStats.finances.budget.currentXP;
        let budgetLevel = newStats.finances.budget.level;
        let investmentsXP = newStats.finances.investments.currentXP;
        let investmentsLevel = newStats.finances.investments.level;
        let debtsXP = newStats.finances.debts.currentXP;
        let debtsLevel = newStats.finances.debts.level;
        
        if (activity?.type === 'savings') {
          savingsXP += (changes.finances.currentXP || 0);
          if (savingsXP >= 100) { savingsLevel += 1; savingsXP -= 100; }
        } else if (activity?.type === 'budget') {
          budgetXP += (changes.finances.currentXP || 0);
          if (budgetXP >= 100) { budgetLevel += 1; budgetXP -= 100; }
        } else if (activity?.type === 'investment') {
          investmentsXP += (changes.finances.currentXP || 0);
          if (investmentsXP >= 100) { investmentsLevel += 1; investmentsXP -= 100; }
        } else if (activity?.type === 'debt') {
          debtsXP += (changes.finances.currentXP || 0);
          if (debtsXP >= 100) { debtsLevel += 1; debtsXP -= 100; }
        }
        
        newStats.finances = {
          ...newStats.finances,
          level: financeLevel,
          currentXP: financeXP,
          savings: { ...newStats.finances.savings, level: savingsLevel, currentXP: Math.min(100, Math.max(0, savingsXP)) },
          budget: { ...newStats.finances.budget, level: budgetLevel, currentXP: Math.min(100, Math.max(0, budgetXP)) },
          investments: { ...newStats.finances.investments, level: investmentsLevel, currentXP: Math.min(100, Math.max(0, investmentsXP)) },
          debts: { ...newStats.finances.debts, level: debtsLevel, currentXP: Math.min(100, Math.max(0, debtsXP)) }
        };
      }
      
      // Handle XP updates for health
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
        
        // Handle sleep XP if it's a sleep activity
        let sleepXP = newStats.health.sleep.currentXP;
        let sleepLevel = newStats.health.sleep.level;
        if (activity?.type === 'sleep') {
          sleepXP += (changes.health.currentXP || 0);
          if (sleepXP >= 100) {
            sleepLevel += 1;
            sleepXP -= 100;
          }
          sleepXP = Math.min(100, Math.max(0, sleepXP));
        }

        newStats.health = {
          ...newStats.health,
          level: healthLevel,
          currentXP: healthXP,
          strength: { ...newStats.health.strength, level: strengthLevel, currentXP: strengthXP },
          speed: { ...newStats.health.speed, level: speedLevel, currentXP: speedXP },
          nutrition: { ...newStats.health.nutrition, level: nutritionLevel, currentXP: nutritionXP },
          sleep: { ...newStats.health.sleep, level: sleepLevel, currentXP: sleepXP }
        };
      }
      
      // Handle XP updates for intelligence
      if (changes.intelligence) {
        let intXP = newStats.intelligence.currentXP + (changes.intelligence.currentXP || 0);
        let intLevel = newStats.intelligence.level;
        if (intXP >= 100) {
          intLevel += 1;
          intXP -= 100;
        }
        newStats.intelligence = {
          ...newStats.intelligence,
          level: intLevel,
          currentXP: Math.min(100, Math.max(0, intXP)),
        };
      }
      
      return newStats;
    });
    
    // Trigger sound effects based on stat changes
    const soundSystem = getSoundSystem();
    if (soundSystem) {
      const xpChange = (changes.finances?.currentXP || 0) + (changes.health?.currentXP || 0) + (changes.intelligence?.currentXP || 0);
      const levelUp = (changes.finances?.level) || (changes.health?.level) || (changes.intelligence?.level);
      
      if (levelUp) {
        const statName = changes.finances?.level ? 'Finances' : changes.health?.level ? 'Health' : 'Intelligence';
        soundSystem.announceStatChange(statName, xpChange, levelUp, 0).catch(() => {});
      } else if (xpChange >= 20) {
        soundSystem.playSound('xp_gain').catch(() => {});
        soundSystem.playBeep(523.25, 150, 'success');
      } else if (xpChange > 0) {
        soundSystem.playSound('xp_gain').catch(() => {});
      }
    }
  };

  const toggleQuestCompletion = (questId: string, xp: number, category: 'financial' | 'health') => {
    // Play achievement sound
    const soundSystem = getSoundSystem();
    if (soundSystem) {
      soundSystem.playAchievement('Quest Completed').catch(() => {});
    }
    
    // Add XP when completing
    if (category === 'financial') {
      handleStatChange({ finances: { currentXP: xp } });
      // Remove the quest from the list
      setFinancialQuests(prev => prev.filter(q => q.id !== questId));
    } else {
      handleStatChange({ health: { currentXP: xp } });
      // Remove the quest from the list
      setHealthQuests(prev => prev.filter(q => q.id !== questId));
    }
  };

  const handleQuestCreated = (quest: DailyQuest) => {
    if (quest.category === 'financial') {
      setFinancialQuests(prev => [...prev, quest]);
    } else {
      setHealthQuests(prev => [...prev, quest]);
    }
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
                  <ChatBox onStatChange={handleStatChange} questType="financial" onQuestCreated={handleQuestCreated} />
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
                    {financialQuests.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">
                        No quests yet! Use the chat to add one.<br />
                        <span className="text-xs text-gray-500">Try: &quot;Add quest to review my budget&quot;</span>
                      </p>
                    ) : (
                      financialQuests.map(quest => (
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
                  <div className="mt-6 p-4 rounded-xl bg-[#00d9ff]/10 border border-[#00d9ff]/30">
                    <p className="text-sm text-gray-300">
                      💡 <span className="text-[#00d9ff] font-medium">Tip:</span> Add quests via chat: &quot;Add quest to track expenses&quot;
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

              <div className="grid lg:grid-cols-2 gap-6 items-start">
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
                  {capitalOneLoading ? (
                    <div className="text-center py-4 text-gray-400">Loading account data...</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <DetailCard label="Account Balance" value={`$${stats.finances.savings.amount.toLocaleString()}`} />
                        <DetailCard label="Saved This Month" value={`$${capitalOneData?.savings.totalSavedThisMonth.toLocaleString() || 0}`} positive />
                      </div>
                      {capitalOneData && capitalOneData.savings.totalDeposits > 0 && (
                        <div className="p-3 rounded-xl bg-[#00d9ff]/10 border border-[#00d9ff]/30">
                          <p className="text-sm text-gray-300">
                            💰 <span className="text-[#00d9ff] font-medium">{capitalOneData.savings.totalDeposits} deposits</span> this month
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
                  {capitalOneLoading ? (
                    <div className="text-center py-4 text-gray-400">Loading spending data...</div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {/* Refresh Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchCapitalOneData();
                          fetchBudgetGoals();
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-[#0099ff]/20 border border-[#0099ff]/30 text-[#0099ff] text-sm font-medium hover:bg-[#0099ff]/30 transition-colors flex items-center justify-center gap-2"
                      >
                        🔄 Refresh Transactions
                      </button>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <DetailCard label="Spent This Month" value={`$${stats.finances.budget.spent.toLocaleString()}`} />
                        <DetailCard label="Spent This Week" value={`$${capitalOneData?.budget.totalSpentThisWeek.toLocaleString() || 0}`} />
                        <DetailCard label="Transactions" value={`${capitalOneData?.budget.transactionCount || 0}`} />
                        <DetailCard label="Budget Limit" value={`$${stats.finances.budget.limit.toLocaleString()}`} />
                      </div>
                      
                      {/* Spending by Category */}
                      {capitalOneData && Object.keys(capitalOneData.budget.spendingByCategory).length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-3">Spending by Category</h4>
                          <div className="space-y-2">
                            {Object.entries(capitalOneData.budget.spendingByCategory)
                              .sort(([,a], [,b]) => b - a)
                              .slice(0, 5)
                              .map(([category, amount]) => (
                                <div key={category} className="flex justify-between items-center">
                                  <span className="text-gray-400 capitalize text-sm">{category}</span>
                                  <span className="text-white font-medium">${amount.toLocaleString()}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Transactions */}
                      {capitalOneData && capitalOneData.recentTransactions.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Transactions</h4>
                          <div className="space-y-2">
                            {capitalOneData.recentTransactions.map((tx) => (
                              <div key={tx.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                                <div>
                                  <span className="text-white text-sm">{tx.merchantName}</span>
                                  <span className="text-gray-500 text-xs block capitalize">{tx.category}</span>
                                </div>
                                <span className="text-red-400 font-medium">-${tx.amount.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Budget Usage</span>
                          <span className="text-[#0099ff]">{stats.finances.budget.limit > 0 ? Math.round((stats.finances.budget.spent / stats.finances.budget.limit) * 100) : 0}%</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#00d9ff] to-[#0099ff] rounded-full"
                            style={{ width: `${Math.min((stats.finances.budget.spent / stats.finances.budget.limit) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                    </div>
                  )}
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

                {/* Limit Master Stat */}
                <InteractiveStat
                  id="debts"
                  title="Limit Master"
                  icon="🎯"
                  level={stats.finances.debts.level}
                  xp={stats.finances.debts.currentXP}
                  color="#f59e0b"
                  expanded={expandedStat === 'debts'}
                  onClick={() => setExpandedStat(expandedStat === 'debts' ? null : 'debts')}
                >
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {/* Refresh Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchBudgetGoals();
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-[#f59e0b]/20 border border-[#f59e0b]/30 text-[#f59e0b] text-sm font-medium hover:bg-[#f59e0b]/30 transition-colors flex items-center justify-center gap-2"
                    >
                      🔄 Refresh Limits
                    </button>

                    {/* Budget Goals */}
                    {budgetGoals.length > 0 ? (
                      <div className="space-y-3">
                        {budgetGoals.map((goal) => {
                          const percentUsed = Math.round((goal.currentSpending / goal.amount) * 100);
                          const isOver = percentUsed > 100;
                          const isWarning = percentUsed >= 75 && percentUsed < 90;
                          const isDanger = percentUsed >= 90;
                          
                          return (
                            <div key={goal.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-white text-sm capitalize font-medium">{goal.category}</span>
                                <span className={`text-sm font-medium ${
                                  isOver ? 'text-red-400' : isDanger ? 'text-orange-400' : isWarning ? 'text-yellow-400' : 'text-[#f59e0b]'
                                }`}>
                                  ${goal.currentSpending.toFixed(2)} / ${goal.amount.toFixed(2)}
                                </span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    isOver ? 'bg-red-500' : isDanger ? 'bg-orange-500' : isWarning ? 'bg-yellow-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'
                                  }`}
                                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                />
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-xs text-gray-500 capitalize">{goal.period}</span>
                                <span className={`text-xs ${
                                  isOver ? 'text-red-400' : isDanger ? 'text-orange-400' : isWarning ? 'text-yellow-400' : 'text-gray-500'
                                }`}>
                                  {isOver ? `Over by $${(goal.currentSpending - goal.amount).toFixed(2)}` : `${percentUsed}% used`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400">
                        <p className="text-2xl mb-2">🎯</p>
                        <p className="text-sm">No spending limits set</p>
                        <p className="text-xs mt-1">Use the chat to set limits like &quot;limit dining to $100 this week&quot;</p>
                      </div>
                    )}
                  </div>
                </InteractiveStat>
              </div>

              {/* Recent Financial Activity Section */}
              {financialActivities.length > 0 && (
                <div className="mt-12 space-y-6">
                  <h2 
                    className="font-[family-name:var(--font-orbitron)] text-2xl font-bold text-center"
                    style={{
                      background: 'linear-gradient(135deg, #00d9ff 0%, #0099ff 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    📊 Recent Financial Activity
                  </h2>
                  
                  <div 
                    className="p-6 rounded-2xl border border-[#00d9ff33] max-w-2xl mx-auto"
                    style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)' }}
                  >
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {financialActivities.slice(-8).reverse().map((activity, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#00d9ff]/20 flex items-center justify-center text-lg">
                              {activity.type === 'savings' ? '🏦' : 
                               activity.type === 'investment' ? '📈' : 
                               activity.type === 'budget' ? '📊' : '⚔️'}
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm capitalize">{activity.type}</p>
                              <p className="text-gray-500 text-xs">
                                ${activity.amount.toLocaleString()}
                                {activity.type === 'investment' && (activity as { growth: number }).growth > 0 && ` • +${(activity as { growth: number }).growth}% growth`}
                              </p>
                            </div>
                          </div>
                          <span className="font-[family-name:var(--font-orbitron)] text-[#00d9ff] text-sm">+{activity.xp} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
        )}

      </main>
      <SoundToggle />
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
