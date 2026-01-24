/**
 * Budget Goals API - Local Storage Version
 * POST /api/budget-goals - Create a new budget goal
 * GET /api/budget-goals - Get all active budget goals
 * PUT /api/budget-goals - Update spending on a goal
 * DELETE /api/budget-goals - Delete/cancel a goal
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  getGoalsByCategory,
} from '@/lib/localBudgetStore';

// POST - Create a new budget goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      goalType = 'limit',
      category, 
      amount, 
      period = 'week',
    } = body;

    if (!category || !amount) {
      return NextResponse.json(
        { error: 'Category and amount are required' },
        { status: 400 }
      );
    }

    // Check for existing active goal in same category
    const existingGoals = getGoalsByCategory(category.toLowerCase());
    
    if (existingGoals.length > 0) {
      // Update existing goal instead of creating new
      const existingGoal = existingGoals[0];
      const updated = updateGoal(existingGoal.id, {
        amount,
        goalType,
        alertsTriggered: [], // Reset alerts for new amount
        status: 'active'
      });

      return NextResponse.json({
        success: true,
        message: 'Updated existing budget goal',
        goal: updated
      });
    }

    // Create new goal
    const goal = createGoal({
      goalType: goalType as 'limit' | 'reduction',
      category: category.toLowerCase(),
      amount,
      period: period as 'day' | 'week' | 'month'
    });

    return NextResponse.json({
      success: true,
      message: 'Budget goal created!',
      goal
    });

  } catch (error) {
    console.error('Create budget goal error:', error);
    return NextResponse.json(
      { error: 'Failed to create budget goal', details: String(error) },
      { status: 500 }
    );
  }
}

// GET - Get all active budget goals
export async function GET() {
  try {
    const goals = getActiveGoals();

    // Add computed fields
    const goalsWithVirtuals = goals.map(goal => {
      const percentageUsed = Math.round((goal.currentSpending / goal.amount) * 100);
      const remaining = Math.max(0, goal.amount - goal.currentSpending);
      const daysRemaining = Math.ceil(
        (new Date(goal.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...goal,
        percentageUsed,
        remaining,
        daysRemaining
      };
    });

    return NextResponse.json({
      success: true,
      goals: goalsWithVirtuals
    });

  } catch (error) {
    console.error('Get budget goals error:', error);
    return NextResponse.json(
      { error: 'Failed to get budget goals', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT - Update spending on goals (called when transactions are made)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, amount } = body;

    if (!category || amount === undefined) {
      return NextResponse.json(
        { error: 'Category and amount are required' },
        { status: 400 }
      );
    }

    // Find active goals for this category
    const goals = getGoalsByCategory(category.toLowerCase());

    const alerts: Array<{
      goalId: string;
      category: string;
      threshold: number;
      percentageUsed: number;
      remaining: number;
      message: string;
      exceeded: boolean;
    }> = [];

    for (const goal of goals) {
      const oldSpending = goal.currentSpending;
      const newSpending = oldSpending + amount;
      const oldPercentage = Math.round((oldSpending / goal.amount) * 100);
      const newPercentage = Math.round((newSpending / goal.amount) * 100);
      
      const newAlerts: number[] = [];
      
      // Check which thresholds we crossed
      for (const threshold of goal.alertThresholds) {
        if (newPercentage >= threshold && oldPercentage < threshold && !goal.alertsTriggered.includes(threshold)) {
          newAlerts.push(threshold);
        }
      }

      // Update the goal
      updateGoal(goal.id, {
        currentSpending: newSpending,
        alertsTriggered: [...goal.alertsTriggered, ...newAlerts],
        status: newPercentage >= 100 ? 'exceeded' : 'active'
      });

      // Generate alerts
      for (const threshold of newAlerts) {
        const remaining = Math.max(0, goal.amount - newSpending);
        let message = '';
        
        if (threshold >= 100) {
          message = `🚨 You've exceeded your ${goal.category} budget of $${goal.amount}!`;
        } else if (threshold >= 90) {
          message = `⚠️ Warning! You've used ${newPercentage}% of your ${goal.category} budget. Only $${remaining.toFixed(2)} left!`;
        } else if (threshold >= 75) {
          message = `⚡ Heads up! You've used ${newPercentage}% of your ${goal.category} budget.`;
        } else {
          message = `📊 You've reached ${threshold}% of your ${goal.category} budget.`;
        }

        alerts.push({
          goalId: goal.id,
          category: goal.category,
          threshold,
          percentageUsed: newPercentage,
          remaining,
          message,
          exceeded: newPercentage >= 100
        });
      }
    }

    return NextResponse.json({
      success: true,
      alerts,
      goalsUpdated: goals.length
    });

  } catch (error) {
    console.error('Update budget spending error:', error);
    return NextResponse.json(
      { error: 'Failed to update budget spending', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/delete a budget goal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('id');

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    const goal = getGoalById(goalId);
    
    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    deleteGoal(goalId);

    return NextResponse.json({
      success: true,
      message: 'Budget goal deleted'
    });

  } catch (error) {
    console.error('Delete budget goal error:', error);
    return NextResponse.json(
      { error: 'Failed to delete budget goal', details: String(error) },
      { status: 500 }
    );
  }
}
