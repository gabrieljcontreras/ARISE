// ARISE Judgement Engine
import dbConnect from './mongodb';
import User from '../models/User';
import Action from '../models/Action';

/**
 * Configuration constants for the game engine
 */
const CONFIG = {
  // Base XP required for level 2, scales from there
  BASE_XP_REQUIREMENT: 100,
  XP_SCALING_FACTOR: 1.5,
  
  // Streak bonuses
  STREAK_BONUS_MULTIPLIER: 0.1, // 10% bonus per streak day
  MAX_STREAK_BONUS: 2.0, // Cap at 200% bonus
  
  // Stat change limits per action
  MAX_STAT_CHANGE: 10,
  MIN_STAT_CHANGE: -10,
  
  // Point values by subcategory
  POINT_VALUES: {
    // Financial subcategories
    savings: { base: 15, reward: 1.2, punishment: 1.0 },
    spending: { base: 10, reward: 1.0, punishment: 1.3 },
    investing: { base: 20, reward: 1.5, punishment: 1.2 },
    budgeting: { base: 12, reward: 1.1, punishment: 1.1 },
    debt: { base: 18, reward: 1.3, punishment: 1.4 },
    income: { base: 25, reward: 1.4, punishment: 0.8 },
    // Health subcategories
    fitness: { base: 15, reward: 1.2, punishment: 1.2 },
    nutrition: { base: 12, reward: 1.1, punishment: 1.3 },
    sleep: { base: 10, reward: 1.0, punishment: 1.4 },
    mental_health: { base: 20, reward: 1.3, punishment: 1.1 },
    hydration: { base: 8, reward: 1.0, punishment: 1.0 },
    medical: { base: 25, reward: 1.2, punishment: 1.5 }
  },
  
  // Stat mappings by category/subcategory
  STAT_MAPPINGS: {
    financial: {
      primary: 'intelligence',
      secondary: 'discipline',
      subcategories: {
        savings: { intelligence: 0.4, discipline: 0.6 },
        spending: { intelligence: 0.3, discipline: 0.7 },
        investing: { intelligence: 0.7, discipline: 0.3 },
        budgeting: { intelligence: 0.5, discipline: 0.5 },
        debt: { intelligence: 0.4, discipline: 0.6 },
        income: { intelligence: 0.6, charisma: 0.4 }
      }
    },
    health: {
      primary: 'vitality',
      secondary: 'discipline',
      subcategories: {
        fitness: { strength: 0.5, vitality: 0.3, agility: 0.2 },
        nutrition: { vitality: 0.7, discipline: 0.3 },
        sleep: { vitality: 0.6, intelligence: 0.2, discipline: 0.2 },
        mental_health: { vitality: 0.3, charisma: 0.3, intelligence: 0.4 },
        hydration: { vitality: 0.8, discipline: 0.2 },
        medical: { vitality: 0.9, discipline: 0.1 }
      }
    }
  }
};

/**
 * Calculate XP required for a given level
 */
export function calculateXPForLevel(level) {
  return Math.floor(CONFIG.BASE_XP_REQUIREMENT * Math.pow(CONFIG.XP_SCALING_FACTOR, level - 1));
}

/**
 * Calculate streak bonus multiplier
 */
export function calculateStreakBonus(streakDays) {
  const bonus = 1 + (streakDays * CONFIG.STREAK_BONUS_MULTIPLIER);
  return Math.min(bonus, CONFIG.MAX_STREAK_BONUS);
}

/**
 * Calculate points for an action based on type, category, and subcategory
 */
export function calculatePoints(type, subcategory, intensity = 1) {
  const config = CONFIG.POINT_VALUES[subcategory];
  if (!config) return 0;
  
  const multiplier = type === 'reward' ? config.reward : config.punishment;
  const basePoints = config.base * multiplier * intensity;
  
  // Punishments return negative points
  return type === 'reward' ? Math.round(basePoints) : -Math.round(basePoints);
}

/**
 * Calculate stat changes for an action
 */
export function calculateStatChanges(type, category, subcategory, intensity = 1) {
  const categoryMapping = CONFIG.STAT_MAPPINGS[category];
  if (!categoryMapping) return {};
  
  const subcategoryMapping = categoryMapping.subcategories[subcategory];
  if (!subcategoryMapping) return {};
  
  const statsAffected = {};
  const baseChange = type === 'reward' ? intensity : -intensity;
  
  for (const [stat, weight] of Object.entries(subcategoryMapping)) {
    const change = Math.round(baseChange * weight * 3); // Scale factor of 3
    statsAffected[stat] = Math.max(CONFIG.MIN_STAT_CHANGE, Math.min(CONFIG.MAX_STAT_CHANGE, change));
  }
  
  return statsAffected;
}

/**
 * Process a new action (reward or punishment)
 * This is the main entry point for recording user actions
 */
export async function processAction(userId, actionData) {
  await dbConnect();
  
  const { type, category, subcategory, description, intensity = 1, source = 'manual', notes = '' } = actionData;
  
  // Get user for streak calculation
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Calculate points with streak bonus for rewards
  let points = calculatePoints(type, subcategory, intensity);
  if (type === 'reward' && user.streaks.currentDaily > 0) {
    const streakBonus = calculateStreakBonus(user.streaks.currentDaily);
    points = Math.round(points * streakBonus);
  }
  
  // Calculate stat changes
  const statsAffected = calculateStatChanges(type, category, subcategory, intensity);
  
  // Create the action record
  const action = new Action({
    userId,
    type,
    category,
    subcategory,
    description,
    points,
    statsAffected,
    source,
    streakData: {
      currentStreak: user.streaks.currentDaily,
      streakBonus: type === 'reward' ? calculateStreakBonus(user.streaks.currentDaily) : 0
    },
    notes
  });
  
  await action.save();
  
  // Apply changes to user
  await user.applyAction(statsAffected, points);
  await user.updateStreak();
  
  return {
    action,
    user: await User.findById(userId), // Return updated user
    pointsAwarded: points,
    statsChanged: statsAffected
  };
}

/**
 * Get user's current status and stats
 */
export async function getUserStatus(userId) {
  await dbConnect();
  
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  const actionSummary = await Action.getStatsSummary(userId);
  const recentActions = await Action.getUserHistory(userId, { limit: 10 });
  
  return {
    user,
    level: user.level,
    experience: user.experience,
    stats: user.stats,
    streaks: user.streaks,
    totalPoints: user.totalPoints,
    actionSummary,
    recentActions,
    xpToNextLevel: calculateXPForLevel(user.level + 1) - user.experience.current
  };
}

/**
 * Get leaderboard data
 */
export async function getLeaderboard(limit = 10, sortBy = 'level') {
  await dbConnect();
  
  const sortOptions = {
    level: { level: -1, 'experience.current': -1 },
    points: { totalPoints: -1 },
    streaks: { 'streaks.longestDaily': -1 }
  };
  
  const users = await User.find({ isActive: true })
    .sort(sortOptions[sortBy] || sortOptions.level)
    .limit(limit)
    .select('name level totalPoints stats streaks')
    .lean();
  
  return users;
}

/**
 * Check and award achievements
 */
export async function checkAchievements(userId) {
  await dbConnect();
  
  const user = await User.findById(userId);
  if (!user) return [];
  
  const newAchievements = [];
  const actionSummary = await Action.getStatsSummary(userId);
  
  // Define achievement conditions
  const achievementChecks = [
    {
      id: 'first_reward',
      name: 'First Steps',
      condition: () => actionSummary.totalRewards >= 1
    },
    {
      id: 'streak_7',
      name: 'Week Warrior',
      condition: () => user.streaks.currentDaily >= 7
    },
    {
      id: 'streak_30',
      name: 'Monthly Master',
      condition: () => user.streaks.currentDaily >= 30
    },
    {
      id: 'level_5',
      name: 'Rising Star',
      condition: () => user.level >= 5
    },
    {
      id: 'level_10',
      name: 'Dedicated',
      condition: () => user.level >= 10
    },
    {
      id: 'balanced',
      name: 'Well Rounded',
      condition: () => {
        const stats = user.stats;
        const min = Math.min(stats.strength, stats.agility, stats.intelligence, stats.vitality, stats.charisma, stats.discipline);
        return min >= 20;
      }
    },
    {
      id: 'points_1000',
      name: 'Point Collector',
      condition: () => user.totalPoints >= 1000
    },
    {
      id: 'financial_master',
      name: 'Financial Guru',
      condition: () => user.stats.intelligence >= 50 && user.stats.discipline >= 40
    },
    {
      id: 'health_master',
      name: 'Health Champion',
      condition: () => user.stats.vitality >= 50 && user.stats.strength >= 30
    }
  ];
  
  // Check each achievement
  for (const achievement of achievementChecks) {
    const alreadyHas = user.achievements.some(a => a.achievementId === achievement.id);
    
    if (!alreadyHas && achievement.condition()) {
      user.achievements.push({
        achievementId: achievement.id,
        name: achievement.name,
        unlockedAt: new Date()
      });
      newAchievements.push(achievement);
    }
  }
  
  if (newAchievements.length > 0) {
    await user.save();
  }
  
  return newAchievements;
}

/**
 * Get analytics for a user over a time period
 */
export async function getUserAnalytics(userId, days = 30) {
  await dbConnect();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const actions = await Action.find({
    userId,
    occurredAt: { $gte: startDate }
  }).sort({ occurredAt: 1 }).lean();
  
  // Group by category
  const byCategory = { financial: [], health: [] };
  const bySubcategory = {};
  const dailyPoints = {};
  
  for (const action of actions) {
    byCategory[action.category].push(action);
    
    if (!bySubcategory[action.subcategory]) {
      bySubcategory[action.subcategory] = [];
    }
    bySubcategory[action.subcategory].push(action);
    
    const dateKey = action.occurredAt.toISOString().split('T')[0];
    if (!dailyPoints[dateKey]) {
      dailyPoints[dateKey] = { rewards: 0, punishments: 0, net: 0 };
    }
    if (action.type === 'reward') {
      dailyPoints[dateKey].rewards += action.points;
    } else {
      dailyPoints[dateKey].punishments += Math.abs(action.points);
    }
    dailyPoints[dateKey].net += action.points;
  }
  
  return {
    totalActions: actions.length,
    byCategory: {
      financial: byCategory.financial.length,
      health: byCategory.health.length
    },
    bySubcategory: Object.fromEntries(
      Object.entries(bySubcategory).map(([key, arr]) => [key, arr.length])
    ),
    dailyPoints,
    rewardVsPunishment: {
      rewards: actions.filter(a => a.type === 'reward').length,
      punishments: actions.filter(a => a.type === 'punishment').length
    }
  };
}

export default {
  processAction,
  getUserStatus,
  getLeaderboard,
  checkAchievements,
  getUserAnalytics,
  calculatePoints,
  calculateStatChanges,
  calculateXPForLevel,
  calculateStreakBonus,
  CONFIG
};
