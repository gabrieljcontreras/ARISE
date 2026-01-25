'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Storage keys
const STORAGE_KEYS = {
  STATS: 'arise_stats',
  WORKOUT_HISTORY: 'arise_workout_history',
  NUTRITION_LOG: 'arise_nutrition_log',
  SLEEP_LOG: 'arise_sleep_log',
  FINANCIAL_ACTIVITIES: 'arise_financial_activities',
  FINANCIAL_QUESTS: 'arise_financial_quests',
  HEALTH_QUESTS: 'arise_health_quests',
  COMPLETED_QUESTS: 'arise_completed_quests'
};

// Default stats for initial state
const DEFAULT_STATS: Stats = {
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
};

// Helper to safely parse JSON from localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
  }
  return defaultValue;
}

// Helper to save to localStorage
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

// Activity data types
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

export interface StatChanges {
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
  // Settings updates (budget limit, goals, etc.)
  settingsUpdate?: {
    type: 'budgetLimit' | 'savingsGoal' | 'calorieGoal' | 'proteinGoal' | 'sleepGoal';
    value: number;
  };
}

export interface DailyQuest {
  id: string;
  text: string;
  xp: number;
  category: 'financial' | 'health';
}

interface Stats {
  finances: { 
    level: number;
    currentXP: number;
    savings: { level: number; currentXP: number; amount: number };
    budget: { level: number; currentXP: number; spent: number; limit: number };
    investments: { level: number; currentXP: number; value: number; growth: number };
    debts: { level: number; currentXP: number; remaining: number; paid: number };
  };
  health: { 
    level: number;
    currentXP: number;
    strength: { level: number; currentXP: number; workouts: number; maxLift: number };
    speed: { level: number; currentXP: number; runs: number; bestMile: string };
    nutrition: { level: number; currentXP: number; calories: number; protein: number };
    sleep: { level: number; currentXP: number; avgHours: number; quality: number };
  };
  intelligence: { level: number; currentXP: number };
}

interface StatsContextType {
  stats: Stats;
  workoutHistory: WorkoutActivity[];
  nutritionLog: NutritionActivity[];
  sleepLog: SleepActivity[];
  financialActivities: (SavingsActivity | InvestmentActivity | BudgetActivity | DebtActivity)[];
  financialQuests: DailyQuest[];
  healthQuests: DailyQuest[];
  completedQuests: Set<string>;
  handleStatChange: (changes: StatChanges) => void;
  handleQuestCreated: (quest: DailyQuest) => void;
  toggleQuestCompletion: (questId: string, xp: number, category: 'financial' | 'health') => void;
  totalXP: number;
  overallLevel: number;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: ReactNode }) {
  // Track if we've loaded from storage yet
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Initialize state with defaults, then hydrate from localStorage
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set());
  const [financialQuests, setFinancialQuests] = useState<DailyQuest[]>([]);
  const [healthQuests, setHealthQuests] = useState<DailyQuest[]>([]);
  
  // Activity tracking state
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutActivity[]>([]);
  const [nutritionLog, setNutritionLog] = useState<NutritionActivity[]>([]);
  const [sleepLog, setSleepLog] = useState<SleepActivity[]>([]);
  const [financialActivities, setFinancialActivities] = useState<(SavingsActivity | InvestmentActivity | BudgetActivity | DebtActivity)[]>([]);
  
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    setStats(loadFromStorage(STORAGE_KEYS.STATS, DEFAULT_STATS));
    setWorkoutHistory(loadFromStorage(STORAGE_KEYS.WORKOUT_HISTORY, []));
    setNutritionLog(loadFromStorage(STORAGE_KEYS.NUTRITION_LOG, []));
    setSleepLog(loadFromStorage(STORAGE_KEYS.SLEEP_LOG, []));
    setFinancialActivities(loadFromStorage(STORAGE_KEYS.FINANCIAL_ACTIVITIES, []));
    setFinancialQuests(loadFromStorage(STORAGE_KEYS.FINANCIAL_QUESTS, []));
    setHealthQuests(loadFromStorage(STORAGE_KEYS.HEALTH_QUESTS, []));
    
    // Load completed quests as array, convert to Set
    const savedCompleted = loadFromStorage<string[]>(STORAGE_KEYS.COMPLETED_QUESTS, []);
    setCompletedQuests(new Set(savedCompleted));
    
    setIsHydrated(true);
  }, []);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    if (isHydrated) {
      saveToStorage(STORAGE_KEYS.STATS, stats);
    }
  }, [stats, isHydrated]);

  // Save activity logs to localStorage
  useEffect(() => {
    if (isHydrated) {
      saveToStorage(STORAGE_KEYS.WORKOUT_HISTORY, workoutHistory);
    }
  }, [workoutHistory, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      saveToStorage(STORAGE_KEYS.NUTRITION_LOG, nutritionLog);
    }
  }, [nutritionLog, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      saveToStorage(STORAGE_KEYS.SLEEP_LOG, sleepLog);
    }
  }, [sleepLog, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      saveToStorage(STORAGE_KEYS.FINANCIAL_ACTIVITIES, financialActivities);
    }
  }, [financialActivities, isHydrated]);

  // Save quests to localStorage
  useEffect(() => {
    if (isHydrated) {
      saveToStorage(STORAGE_KEYS.FINANCIAL_QUESTS, financialQuests);
    }
  }, [financialQuests, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      saveToStorage(STORAGE_KEYS.HEALTH_QUESTS, healthQuests);
    }
  }, [healthQuests, isHydrated]);

  // Save completed quests (convert Set to array for JSON serialization)
  useEffect(() => {
    if (isHydrated) {
      saveToStorage(STORAGE_KEYS.COMPLETED_QUESTS, Array.from(completedQuests));
    }
  }, [completedQuests, isHydrated]);

  const totalXP = ((stats.finances.level - 1) * 100 + stats.finances.currentXP) + 
                  ((stats.health.level - 1) * 100 + stats.health.currentXP) + 
                  ((stats.intelligence.level - 1) * 100 + stats.intelligence.currentXP);

  const overallLevel = Math.floor((stats.finances.level + stats.health.level + stats.intelligence.level) / 3);

  const handleStatChange = (changes: StatChanges) => {
    const activity = changes.activityData;
    const timestamp = new Date();
    
    // Add to activity logs first
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
    
    // Update all stats in a single setStats call
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
      
      // Handle settings updates (budget limit, goals, etc.)
      if (changes.settingsUpdate) {
        switch (changes.settingsUpdate.type) {
          case 'budgetLimit':
            newStats.finances = {
              ...newStats.finances,
              budget: {
                ...newStats.finances.budget,
                limit: changes.settingsUpdate.value
              }
            };
            break;
          case 'savingsGoal':
            // Could track savings goal - for now just acknowledge
            break;
          case 'calorieGoal':
            // Could add calorie goal tracking
            break;
          case 'proteinGoal':
            // Could add protein goal tracking
            break;
          case 'sleepGoal':
            // Could add sleep goal tracking
            break;
        }
      }
      
      return newStats;
    });
  };

  const toggleQuestCompletion = (questId: string, xp: number, category: 'financial' | 'health') => {
    if (category === 'financial') {
      handleStatChange({ finances: { currentXP: xp } });
      setFinancialQuests(prev => prev.filter(q => q.id !== questId));
    } else {
      handleStatChange({ health: { currentXP: xp } });
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

  return (
    <StatsContext.Provider value={{
      stats,
      workoutHistory,
      nutritionLog,
      sleepLog,
      financialActivities,
      financialQuests,
      healthQuests,
      completedQuests,
      handleStatChange,
      handleQuestCreated,
      toggleQuestCompletion,
      totalXP,
      overallLevel
    }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}
