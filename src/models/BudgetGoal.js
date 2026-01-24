// Schema for Budget Goals and Spending Limits
import mongoose from 'mongoose';

const BudgetGoalSchema = new mongoose.Schema({
  // Reference to the user (optional for now, using default user)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },

  // Type of goal: 'limit' (max spending) or 'reduction' (spend X less)
  goalType: {
    type: String,
    enum: ['limit', 'reduction'],
    required: true
  },

  // Spending category to track
  category: {
    type: String,
    required: true,
    lowercase: true,
    enum: [
      'entertainment', 'food', 'dining', 'groceries', 'shopping', 
      'transportation', 'subscriptions', 'utilities', 'healthcare',
      'clothing', 'travel', 'coffee', 'alcohol', 'gaming', 'other'
    ]
  },

  // Target amount (limit or reduction amount)
  amount: {
    type: Number,
    required: true,
    min: 0
  },

  // Time period
  period: {
    type: String,
    enum: ['day', 'week', 'month'],
    required: true
  },

  // Start and end dates for the goal period
  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  // Current spending tracked for this goal
  currentSpending: {
    type: Number,
    default: 0
  },

  // Previous period spending (for reduction goals)
  previousSpending: {
    type: Number,
    default: 0
  },

  // Alert thresholds (percentage of budget)
  alertThresholds: {
    type: [Number],
    default: [50, 75, 90, 100]
  },

  // Which thresholds have been triggered
  alertsTriggered: {
    type: [Number],
    default: []
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'exceeded', 'cancelled'],
    default: 'active'
  },

  // Original user input for reference
  originalInput: {
    type: String
  },

  // AI-generated motivation message
  motivationMessage: {
    type: String
  },

  // Notes
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index for efficient querying
BudgetGoalSchema.index({ userId: 1, status: 1 });
BudgetGoalSchema.index({ category: 1, status: 1 });
BudgetGoalSchema.index({ endDate: 1 });

// Virtual for percentage used
BudgetGoalSchema.virtual('percentageUsed').get(function() {
  if (this.amount === 0) return 0;
  return Math.round((this.currentSpending / this.amount) * 100);
});

// Virtual for remaining budget
BudgetGoalSchema.virtual('remaining').get(function() {
  return Math.max(0, this.amount - this.currentSpending);
});

// Virtual for days remaining
BudgetGoalSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
});

// Method to check if new alert should be triggered
BudgetGoalSchema.methods.checkAlerts = function() {
  const percentage = this.percentageUsed;
  const newAlerts = [];
  
  for (const threshold of this.alertThresholds) {
    if (percentage >= threshold && !this.alertsTriggered.includes(threshold)) {
      newAlerts.push(threshold);
      this.alertsTriggered.push(threshold);
    }
  }
  
  return newAlerts;
};

// Method to add spending
BudgetGoalSchema.methods.addSpending = async function(amount) {
  this.currentSpending += amount;
  
  // Check for new alerts
  const newAlerts = this.checkAlerts();
  
  // Update status if exceeded
  if (this.currentSpending >= this.amount) {
    this.status = 'exceeded';
  }
  
  await this.save();
  
  return {
    newAlerts,
    currentSpending: this.currentSpending,
    remaining: this.remaining,
    percentageUsed: this.percentageUsed,
    exceeded: this.status === 'exceeded'
  };
};

// Static method to get active goals for user
BudgetGoalSchema.statics.getActiveGoals = async function(userId = null) {
  const query = { status: 'active' };
  if (userId) query.userId = userId;
  
  return this.find(query).sort({ endDate: 1 }).lean();
};

// Static method to get goals for a specific category
BudgetGoalSchema.statics.getGoalsForCategory = async function(category, userId = null) {
  const query = { 
    category: category.toLowerCase(), 
    status: 'active'
  };
  if (userId) query.userId = userId;
  
  return this.find(query).lean();
};

// Static method to check if spending would trigger alerts
BudgetGoalSchema.statics.checkSpendingAgainstGoals = async function(category, amount, userId = null) {
  const goals = await this.getGoalsForCategory(category, userId);
  const alerts = [];
  
  for (const goal of goals) {
    const projectedSpending = goal.currentSpending + amount;
    const projectedPercentage = Math.round((projectedSpending / goal.amount) * 100);
    
    // Check which thresholds would be newly crossed
    for (const threshold of goal.alertThresholds) {
      if (projectedPercentage >= threshold && !goal.alertsTriggered.includes(threshold)) {
        alerts.push({
          goalId: goal._id,
          category: goal.category,
          threshold,
          projectedPercentage,
          remaining: goal.amount - projectedSpending,
          message: threshold >= 100 
            ? `⚠️ This purchase would exceed your ${goal.category} budget!`
            : `⚡ This would put you at ${projectedPercentage}% of your ${goal.category} budget.`
        });
      }
    }
  }
  
  return alerts;
};

// Ensure virtuals are included when converting to JSON
BudgetGoalSchema.set('toJSON', { virtuals: true });
BudgetGoalSchema.set('toObject', { virtuals: true });

const BudgetGoal = mongoose.models.BudgetGoal || mongoose.model('BudgetGoal', BudgetGoalSchema);

export default BudgetGoal;
