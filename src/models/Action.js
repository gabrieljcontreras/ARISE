// Schema for Reward/Punishment History
import mongoose from 'mongoose';

const ActionSchema = new mongoose.Schema({
  // Reference to the user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Type of action: 'reward' or 'punishment'
  type: {
    type: String,
    enum: ['reward', 'punishment'],
    required: true
  },

  // Main category: 'financial' or 'health'
  category: {
    type: String,
    enum: ['financial', 'health'],
    required: true
  },

  // Subcategory for more specific tracking
  subcategory: {
    type: String,
    enum: [
      // Financial subcategories
      'savings', 'spending', 'investing', 'budgeting', 'debt', 'income',
      // Health subcategories
      'fitness', 'nutrition', 'sleep', 'mental_health', 'hydration', 'medical'
    ],
    required: true
  },

  // Description of the action taken
  description: {
    type: String,
    required: true,
    maxlength: 500
  },

  // Points awarded (positive) or deducted (negative)
  points: {
    type: Number,
    required: true
  },

  // Stats affected by this action
  statsAffected: {
    strength: { type: Number, default: 0 },
    agility: { type: Number, default: 0 },
    intelligence: { type: Number, default: 0 },
    vitality: { type: Number, default: 0 },
    charisma: { type: Number, default: 0 },
    discipline: { type: Number, default: 0 }
  },

  // Source of the action (manual entry, quest completion, daily task, etc.)
  source: {
    type: String,
    enum: ['manual', 'quest', 'daily_task', 'achievement', 'streak', 'penalty', 'system'],
    default: 'manual'
  },

  // Related quest or task ID (if applicable)
  relatedQuestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quest',
    default: null
  },

  // Streak information (for habit tracking)
  streakData: {
    currentStreak: { type: Number, default: 0 },
    streakBonus: { type: Number, default: 0 }
  },

  // Timestamp when the action occurred
  occurredAt: {
    type: Date,
    default: Date.now
  },

  // Whether the action has been reviewed/verified
  verified: {
    type: Boolean,
    default: true
  },

  // Notes or additional context
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for efficient querying
ActionSchema.index({ userId: 1, occurredAt: -1 });
ActionSchema.index({ userId: 1, type: 1, category: 1 });
ActionSchema.index({ userId: 1, source: 1 });

// Virtual for calculating net impact
ActionSchema.virtual('netStatImpact').get(function() {
  const stats = this.statsAffected;
  return stats.strength + stats.agility + stats.intelligence + 
         stats.vitality + stats.charisma + stats.discipline;
});

// Static method to get user's action history with pagination
ActionSchema.statics.getUserHistory = async function(userId, options = {}) {
  const { 
    page = 1, 
    limit = 20, 
    type = null, 
    category = null,
    startDate = null,
    endDate = null 
  } = options;

  const query = { userId };
  
  if (type) query.type = type;
  if (category) query.category = category;
  if (startDate || endDate) {
    query.occurredAt = {};
    if (startDate) query.occurredAt.$gte = new Date(startDate);
    if (endDate) query.occurredAt.$lte = new Date(endDate);
  }

  return this.find(query)
    .sort({ occurredAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
};

// Static method to calculate total points for a user
ActionSchema.statics.calculateTotalPoints = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, totalPoints: { $sum: '$points' } } }
  ]);
  return result[0]?.totalPoints || 0;
};

// Static method to get stats summary
ActionSchema.statics.getStatsSummary = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { 
      $group: { 
        _id: null,
        totalRewards: { 
          $sum: { $cond: [{ $eq: ['$type', 'reward'] }, 1, 0] } 
        },
        totalPunishments: { 
          $sum: { $cond: [{ $eq: ['$type', 'punishment'] }, 1, 0] } 
        },
        netPoints: { $sum: '$points' },
        strength: { $sum: '$statsAffected.strength' },
        agility: { $sum: '$statsAffected.agility' },
        intelligence: { $sum: '$statsAffected.intelligence' },
        vitality: { $sum: '$statsAffected.vitality' },
        charisma: { $sum: '$statsAffected.charisma' },
        discipline: { $sum: '$statsAffected.discipline' }
      } 
    }
  ]);
  return result[0] || {
    totalRewards: 0,
    totalPunishments: 0,
    netPoints: 0,
    strength: 0,
    agility: 0,
    intelligence: 0,
    vitality: 0,
    charisma: 0,
    discipline: 0
  };
};

const Action = mongoose.models.Action || mongoose.model('Action', ActionSchema);

export default Action;
