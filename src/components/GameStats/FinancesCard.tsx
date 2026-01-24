'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, CheckCircle, XCircle, MinusCircle, ArrowUpCircle, ArrowDownCircle, Sparkles, AlertTriangle } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'purchase' | 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  date: string;
  merchantName?: string;
  category: string;
  judgment: 'good' | 'bad' | 'neutral';
  points: number;
  reason: string;
  aiEnhanced?: boolean;
}

interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface FinancesCardProps {
  level: number;
  currentXP: number;
  onXPChange?: (xp: number) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#22c55e',
  groceries: '#22c55e',
  rent: '#3b82f6',
  utilities: '#64748b',
  entertainment: '#f59e0b',
  subscriptions: '#8b5cf6',
  transportation: '#06b6d4',
  shopping: '#ec4899',
  healthcare: '#ef4444',
  savings: '#10b981',
  income: '#22d3ee',
  investment: '#a855f7',
  dining: '#f97316',
  budgeting: '#14b8a6',
  spending: '#f43f5e',
  other: '#6b7280'
};

const JUDGMENT_COLORS = {
  good: 'text-green-400',
  bad: 'text-red-400',
  neutral: 'text-gray-400'
};

const JUDGMENT_BG = {
  good: 'bg-green-900/30 border-green-700/50',
  bad: 'bg-red-900/30 border-red-700/50',
  neutral: 'bg-gray-800/50 border-gray-700/50'
};

export default function FinancesCard({ level, currentXP, onXPChange }: FinancesCardProps) {
  const xpPercentage = (currentXP / 100) * 100;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'transactions'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<Array<{
    goalId: string;
    category: string;
    threshold: number;
    percentageUsed: number;
    remaining: number;
    message: string;
    exceeded: boolean;
  }>>([]);
  const [summary, setSummary] = useState<{
    totalPoints: number;
    goodCount: number;
    badCount: number;
    neutralCount: number;
    spendingByCategory: Record<string, number>;
    totalSpending: number;
    totalIncome: number;
    essentialSpending: number;
    discretionarySpending: number;
  } | null>(null);

  const fetchAndAnalyzeTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useAI: true })
      });
      
      const data = await response.json();

      if (data.error) {
        throw new Error(data.details || data.error);
      }

      setTransactions(data.summary.transactions);
      setAiEnhanced(data.aiEnhanced || false);
      setInsights(data.summary.insights || []);
      setBudgetAlerts(data.budgetAlerts || []);
      setSummary({
        totalPoints: data.summary.totalPoints,
        goodCount: data.summary.goodCount,
        badCount: data.summary.badCount,
        neutralCount: data.summary.neutralCount,
        spendingByCategory: data.summary.spendingByCategory,
        totalSpending: data.summary.totalSpending,
        totalIncome: data.summary.totalIncome,
        essentialSpending: data.summary.essentialSpending,
        discretionarySpending: data.summary.discretionarySpending
      });

      // Notify parent of XP change
      if (onXPChange && data.summary.totalPoints !== 0) {
        onXPChange(data.summary.totalPoints);
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMsg);
      console.error('Finance card error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndAnalyzeTransactions();
  }, []);

  const getJudgmentIcon = (judgment: 'good' | 'bad' | 'neutral') => {
    switch (judgment) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'bad':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <MinusCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="w-4 h-4 text-green-400" />;
      case 'withdrawal':
      case 'purchase':
        return <ArrowUpCircle className="w-4 h-4 text-red-400" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const categories: SpendingCategory[] = summary 
    ? Object.entries(summary.spendingByCategory)
        .map(([name, amount]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          amount: amount as number,
          percentage: summary.totalSpending > 0 
            ? Math.round(((amount as number) / summary.totalSpending) * 100) 
            : 0,
          color: CATEGORY_COLORS[name] || CATEGORY_COLORS.other
        }))
        .sort((a, b) => b.amount - a.amount)
    : [];

  return (
    <div className="bg-black rounded-2xl p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-white text-xl font-light flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Finances
            {aiEnhanced && (
              <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                AI
              </span>
            )}
          </h3>
          <p className="text-white text-3xl font-bold mt-1">LVL {level}</p>
        </div>
        <button 
          onClick={fetchAndAnalyzeTransactions}
          disabled={loading}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* XP Bar */}
      <div className="w-full mb-4">
        <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
        <p className="text-gray-400 text-xs mt-1">{currentXP}/100 XP</p>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {budgetAlerts.map((alert, index) => (
            <div 
              key={`${alert.goalId}-${alert.threshold}-${index}`}
              className={`p-2 rounded-lg border text-sm ${
                alert.exceeded 
                  ? 'bg-red-900/30 border-red-700/50 text-red-300'
                  : alert.threshold >= 90
                  ? 'bg-orange-900/30 border-orange-700/50 text-orange-300'
                  : 'bg-yellow-900/30 border-yellow-700/50 text-yellow-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Points Summary */}
      {summary && (
        <div className="mb-4 p-3 bg-gray-900 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Net Points</span>
            <span className={`font-bold ${summary.totalPoints >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.totalPoints >= 0 ? '+' : ''}{summary.totalPoints} pts
            </span>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-green-400">{summary.goodCount} good</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-red-400" />
              <span className="text-red-400">{summary.badCount} bad</span>
            </div>
            <div className="flex items-center gap-1">
              <MinusCircle className="w-3 h-3 text-gray-400" />
              <span className="text-gray-400">{summary.neutralCount} neutral</span>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setViewMode('transactions')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
            viewMode === 'transactions' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setViewMode('categories')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
            viewMode === 'categories' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Categories
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            <div className="text-gray-500 text-sm">Analyzing transactions...</div>
          </div>
        )}

        {error && !loading && (
          <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded-lg mb-2">
            {error}
          </div>
        )}

        {!loading && viewMode === 'transactions' && (
          <div className="space-y-2 overflow-y-auto max-h-[280px] pr-1">
            {transactions.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No transactions found.<br/>
                <span className="text-xs">Try seeding data at /api/capital-one/seed</span>
              </div>
            ) : (
              transactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className={`p-3 rounded-lg border ${JUDGMENT_BG[tx.judgment]} transition-all hover:scale-[1.01]`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(tx.type)}
                      <span className="text-white text-sm font-medium truncate max-w-[140px]">
                        {tx.merchantName || tx.description || tx.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-green-400' : 'text-white'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </span>
                      {getJudgmentIcon(tx.judgment)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: `${CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.other}20`,
                          color: CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.other
                        }}
                      >
                        {tx.category}
                      </span>
                      <span className="text-gray-500 text-xs">{formatDate(tx.date)}</span>
                      {tx.aiEnhanced && <Sparkles className="w-3 h-3 text-purple-400" />}
                    </div>
                    <span className={`text-xs font-medium ${JUDGMENT_COLORS[tx.judgment]}`}>
                      {tx.points > 0 ? '+' : ''}{tx.points} pts
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1 italic">{tx.reason}</p>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && viewMode === 'categories' && (
          <div className="space-y-3 overflow-y-auto max-h-[280px]">
            {summary && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-800 rounded-lg p-2">
                  <p className="text-gray-400 text-xs">Total Spent</p>
                  <p className="text-white font-bold">${summary.totalSpending.toFixed(2)}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <p className="text-gray-400 text-xs">Total Income</p>
                  <p className="text-green-400 font-bold">${summary.totalIncome.toFixed(2)}</p>
                </div>
              </div>
            )}
            
            {/* Insights */}
            {insights.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-2 mb-3">
                <p className="text-gray-400 text-xs mb-1">AI Insights</p>
                {insights.slice(0, 2).map((insight, i) => (
                  <p key={i} className="text-sm text-gray-300">{insight}</p>
                ))}
              </div>
            )}

            {categories.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No spending data</div>
            ) : (
              categories.map((category) => (
                <div key={category.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{category.name}</span>
                    <span className="text-gray-400">${category.amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
