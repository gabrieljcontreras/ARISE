'use client';

import { useState, useEffect } from 'react';
import { Target, AlertTriangle, CheckCircle2, TrendingDown, Trash2, RefreshCw } from 'lucide-react';

interface BudgetGoal {
  _id: string;
  category: string;
  amount: number;
  currentSpending: number;
  period: string;
  goalType: string;
  percentageUsed: number;
  remaining: number;
  daysRemaining: number;
  status: string;
  startDate: string;
  endDate: string;
  alertsTriggered: number[];
  motivationMessage?: string;
}

interface BudgetAlert {
  goalId: string;
  category: string;
  threshold: number;
  percentageUsed: number;
  remaining: number;
  message: string;
  exceeded: boolean;
}

interface BudgetTrackerProps {
  onAlertTriggered?: (alerts: BudgetAlert[]) => void;
  refreshTrigger?: number; // Change this to force refresh
}

export default function BudgetTracker({ onAlertTriggered, refreshTrigger }: BudgetTrackerProps) {
  const [goals, setGoals] = useState<BudgetGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/budget-goals');
      const data = await response.json();
      
      if (data.success) {
        setGoals(data.goals);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch goals');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [refreshTrigger]);

  const handleDelete = async (goalId: string) => {
    try {
      const response = await fetch(`/api/budget-goals?id=${goalId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setGoals(prev => prev.filter(g => g._id !== goalId));
      }
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const getProgressColor = (percentage: number, status: string) => {
    if (status === 'exceeded') return 'bg-red-500';
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadge = (goal: BudgetGoal) => {
    if (goal.status === 'exceeded') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs bg-red-900/50 text-red-300 border border-red-700/50">
          Exceeded
        </span>
      );
    }
    if (goal.percentageUsed >= 90) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs bg-orange-900/50 text-orange-300 border border-orange-700/50 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Critical
        </span>
      );
    }
    if (goal.percentageUsed >= 75) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-900/50 text-yellow-300 border border-yellow-700/50">
          Warning
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs bg-green-900/50 text-green-300 border border-green-700/50 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        On Track
      </span>
    );
  };

  const formatPeriod = (period: string, daysRemaining: number) => {
    if (daysRemaining === 0) return 'Ends today';
    if (daysRemaining === 1) return '1 day left';
    return `${daysRemaining} days left`;
  };

  if (loading) {
    return (
      <div className="bg-black rounded-2xl p-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-xl font-light flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Budget Goals
        </h3>
        <button
          onClick={fetchGoals}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded-lg mb-4">
          {error}
        </div>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No active budget goals</p>
          <p className="text-gray-500 text-sm">
            Try saying: "I want to spend no more than $100 on entertainment this week"
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div
              key={goal._id}
              className={`p-4 rounded-xl border transition-all ${
                goal.status === 'exceeded'
                  ? 'bg-red-900/20 border-red-700/50'
                  : goal.percentageUsed >= 90
                  ? 'bg-orange-900/20 border-orange-700/50'
                  : goal.percentageUsed >= 75
                  ? 'bg-yellow-900/20 border-yellow-700/50'
                  : 'bg-gray-800/50 border-gray-700/50'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium capitalize text-lg">
                      {goal.category}
                    </span>
                    {getStatusBadge(goal)}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {goal.goalType === 'reduction' ? (
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        Reduce by ${goal.amount}/{goal.period}
                      </span>
                    ) : (
                      `Limit: $${goal.amount}/${goal.period}`
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(goal._id)}
                  className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-500 hover:text-red-400 transition-colors"
                  title="Delete goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">
                    ${goal.currentSpending.toFixed(2)} spent
                  </span>
                  <span className={`font-medium ${
                    goal.remaining > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${Math.max(0, goal.remaining).toFixed(2)} left
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(goal.percentageUsed, goal.status)}`}
                    style={{ width: `${Math.min(goal.percentageUsed, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{goal.percentageUsed}% used</span>
                  <span>{formatPeriod(goal.period, goal.daysRemaining)}</span>
                </div>
              </div>

              {/* Alert Thresholds Indicators */}
              <div className="flex gap-1 mb-2">
                {[50, 75, 90, 100].map((threshold) => (
                  <div
                    key={threshold}
                    className={`flex-1 h-1 rounded-full ${
                      goal.alertsTriggered?.includes(threshold)
                        ? threshold === 100
                          ? 'bg-red-500'
                          : threshold === 90
                          ? 'bg-orange-500'
                          : threshold === 75
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                        : 'bg-gray-700'
                    }`}
                    title={`${threshold}% threshold ${goal.alertsTriggered?.includes(threshold) ? 'reached' : 'not reached'}`}
                  />
                ))}
              </div>

              {/* Motivation Message */}
              {goal.motivationMessage && goal.status !== 'exceeded' && (
                <p className="text-gray-400 text-xs italic mt-2">
                  {goal.motivationMessage}
                </p>
              )}

              {/* Exceeded Warning */}
              {goal.status === 'exceeded' && (
                <div className="mt-2 p-2 bg-red-900/30 rounded-lg">
                  <p className="text-red-300 text-sm flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    You've exceeded this budget! Try to avoid more {goal.category} spending.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
