// Mongoose Schema for User Stats
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // Authentication fields
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },

  image: {
    type: String,
    default: null
  },

  // Player level and experience
  level: {
    type: Number,
    default: 1,
    min: 1
  },

  experience: {
    current: { type: Number, default: 0 },
    toNextLevel: { type: Number, default: 100 }
  },

  // Core stats (RPG-style)
  stats: {
    strength: { type: Number, default: 10, min: 0 },
    agility: { type: Number, default: 10, min: 0 },
    intelligence: { type: Number, default: 10, min: 0 },
    vitality: { type: Number, default: 10, min: 0 },
    charisma: { type: Number, default: 10, min: 0 },
    discipline: { type: Number, default: 10, min: 0 }
  },

  // Total points from rewards/punishments
  totalPoints: {
    type: Number,
    default: 0
  },

  // Streak tracking
  streaks: {
    currentDaily: { type: Number, default: 0 },
    longestDaily: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null }
  },

  // Achievements unlocked
  achievements: [{
    achievementId: String,
    unlockedAt: { type: Date, default: Date.now },
    name: String
  }],

  // User preferences
  preferences: {
    notifications: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    difficulty: { type: String, enum: ['easy', 'normal', 'hard', 'extreme'], default: 'normal' }
  },

  // Google Fit integration
  googleFit: {
    accessToken: { type: String, default: null },
    refreshToken: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    connectedAt: { type: Date, default: null },
    lastSyncedAt: { type: Date, default: null }
  },

  // Health metrics from Google Fit
  healthMetrics: {
    dailySteps: [{
      date: { type: String },
      steps: { type: Number },
      xpGained: { type: Number, default: 0 }
    }],
    sleepLog: [{
      date: { type: String },
      hours: { type: Number },
      quality: { type: String }, // 'poor', 'fair', 'good', 'excellent'
      xpGained: { type: Number, default: 0 }
    }],
    heartRateLog: [{
      date: { type: String },
      avgBPM: { type: Number },
      minBPM: { type: Number },
      maxBPM: { type: Number }
    }],
    workoutLog: [{
      date: { type: String },
      type: { type: String },
      duration: { type: Number },
      calories: { type: Number },
      xpGained: { type: Number, default: 0 }
    }],
    lastDataSync: { type: Date, default: null }
  },

  // Account status
  isActive: {
    type: Boolean,
    default: true
  },

  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ level: -1 });

// Virtual for total stat points
UserSchema.virtual('totalStatPoints').get(function() {
  const s = this.stats;
  return s.strength + s.agility + s.intelligence + s.vitality + s.charisma + s.discipline;
});

// Method to apply stat changes from an action
UserSchema.methods.applyAction = async function(actionStats, points) {
  // Apply stat changes
  if (actionStats) {
    this.stats.strength += actionStats.strength || 0;
    this.stats.agility += actionStats.agility || 0;
    this.stats.intelligence += actionStats.intelligence || 0;
    this.stats.vitality += actionStats.vitality || 0;
    this.stats.charisma += actionStats.charisma || 0;
    this.stats.discipline += actionStats.discipline || 0;

    // Ensure stats don't go below 0
    Object.keys(this.stats).forEach(stat => {
      if (this.stats[stat] < 0) this.stats[stat] = 0;
    });
  }

  // Apply points
  if (points) {
    this.totalPoints += points;
    this.experience.current += Math.abs(points);
    
    // Check for level up
    while (this.experience.current >= this.experience.toNextLevel) {
      this.experience.current -= this.experience.toNextLevel;
      this.level += 1;
      this.experience.toNextLevel = Math.floor(this.experience.toNextLevel * 1.5);
    }
  }

  return this.save();
};

// Method to update streak
UserSchema.methods.updateStreak = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = this.streaks.lastActivityDate;
  
  if (!lastActivity) {
    this.streaks.currentDaily = 1;
  } else {
    const lastDate = new Date(lastActivity);
    lastDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      this.streaks.currentDaily += 1;
    } else if (diffDays > 1) {
      this.streaks.currentDaily = 1;
    }
  }
  
  if (this.streaks.currentDaily > this.streaks.longestDaily) {
    this.streaks.longestDaily = this.streaks.currentDaily;
  }
  
  this.streaks.lastActivityDate = today;
  return this.save();
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
