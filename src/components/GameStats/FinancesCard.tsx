'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, PiggyBank, CreditCard, Target, Wallet } from 'lucide-react';

interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

interface FinancesCardProps {
  level: number;
  currentXP: number;
  customerId?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#22c55e',
  rent: '#3b82f6',
  entertainment: '#f59e0b',
  subscriptions: '#8b5cf6',
  transportation: '#06b6d4',
  utilities: '#64748b',
  shopping: '#ec4899',
  healthcare: '#ef4444',
  savings: '#00ff88',
  other: '#6b7280'
};

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍔',
  rent: '🏠',
  entertainment: '🎮',
  subscriptions: '📱',
  transportation: '🚗',
  utilities: '💡',
  shopping: '🛍️',
  healthcare: '💊',
  savings: '💰',
  other: '📦'
};

type SubTab = 'overview' | 'spending' | 'savings' | 'goals';

export default function FinancesCard({ level, currentXP, customerId }: FinancesCardProps) {
  const xpPercentage = (currentXP / 100) * 100;
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [loading, setLoading] = useState(false);
  const [spendingData, setSpendingData] = useState<{
    categories: SpendingCategory[];
    totalSpending: number;
    essentialSpending: number;
    discretionarySpending: number;
  } | null>(null);

  const fetchAndAnalyzeTransactions = async () => {
    // Use mock data
    setSpendingData({
      categories: [
        { name: 'Food', amount: 450, percentage: 30, color: CATEGORY_COLORS.food, icon: CATEGORY_ICONS.food },
        { name: 'Rent', amount: 800, percentage: 35, color: CATEGORY_COLORS.rent, icon: CATEGORY_ICONS.rent },
        { name: 'Entertainment', amount: 150, percentage: 10, color: CATEGORY_COLORS.entertainment, icon: CATEGORY_ICONS.entertainment },
        { name: 'Subscriptions', amount: 75, percentage: 5, color: CATEGORY_COLORS.subscriptions, icon: CATEGORY_ICONS.subscriptions },
        { name: 'Transportation', amount: 200, percentage: 12, color: CATEGORY_COLORS.transportation, icon: CATEGORY_ICONS.transportation },
        { name: 'Savings', amount: 300, percentage: 8, color: CATEGORY_COLORS.savings, icon: CATEGORY_ICONS.savings },
      ],
      totalSpending: 1975,
      essentialSpending: 1450,
      discretionarySpending: 525
    });
  };

  useEffect(() => {
    fetchAndAnalyzeTransactions();
  }, [customerId]);

  const savingsGoals = [
    { name: 'Emergency Fund', current: 2500, target: 5000, color: '#00ff88' },
    { name: 'Vacation', current: 800, target: 2000, color: '#00d9ff' },
    { name: 'New Car', current: 3200, target: 15000, color: '#f59e0b' },
  ];

  return (
    <div 
      className="rounded-3xl p-8 border-2 border-[#00d9ff4d] min-h-[70vh]"
      style={{ 
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 0 60px rgba(0, 217, 255, 0.1)'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="font-[family-name:var(--font-orbitron)] text-3xl font-bold text-white flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00d9ff 0%, #0099ff 100%)' }}
            >
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            Financial Power
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="font-[family-name:var(--font-orbitron)] text-[#00d9ff] text-xl">LVL {level}</span>
            <div className="flex-1 max-w-xs">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00d9ff] to-[#0099ff] rounded-full transition-all duration-500"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">{currentXP}/100 XP</p>
            </div>
          </div>
        </div>
        <button 
          onClick={fetchAndAnalyzeTransactions}
          disabled={loading}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-xl">
        {[
          { id: 'overview' as SubTab, label: 'Overview', icon: Wallet },
          { id: 'spending' as SubTab, label: 'Spending', icon: CreditCard },
          { id: 'savings' as SubTab, label: 'Savings', icon: PiggyBank },
          { id: 'goals' as SubTab, label: 'Goals', icon: Target },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
              activeSubTab === tab.id 
                ? 'bg-gradient-to-r from-[#00d9ff] to-[#0099ff] text-white' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeSubTab === 'overview' && spendingData && (
        <div className="space-y-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-gray-400 text-sm mb-1">Total Spending</p>
              <p className="font-[family-name:var(--font-orbitron)] text-2xl text-white">${spendingData.totalSpending}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-gray-400 text-sm mb-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-green-400" /> Essential
              </p>
              <p className="font-[family-name:var(--font-orbitron)] text-2xl text-green-400">${spendingData.essentialSpending}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-gray-400 text-sm mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-orange-400" /> Discretionary
              </p>
              <p className="font-[family-name:var(--font-orbitron)] text-2xl text-orange-400">${spendingData.discretionarySpending}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl border border-[#00ff8833] bg-[#00ff8808]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#00ff88]/20 flex items-center justify-center text-xl">💰</div>
                <div>
                  <p className="text-gray-400 text-sm">Savings Rate</p>
                  <p className="font-[family-name:var(--font-orbitron)] text-xl text-[#00ff88]">15.2%</p>
                </div>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#00ff88] rounded-full" style={{ width: '15.2%' }} />
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-[#00d9ff33] bg-[#00d9ff08]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#00d9ff]/20 flex items-center justify-center text-xl">📈</div>
                <div>
                  <p className="text-gray-400 text-sm">Budget Used</p>
                  <p className="font-[family-name:var(--font-orbitron)] text-xl text-[#00d9ff]">68%</p>
                </div>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#00d9ff] rounded-full" style={{ width: '68%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'spending' && spendingData && (
        <div className="space-y-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <h3 className="font-[family-name:var(--font-orbitron)] text-lg text-gray-300 mb-4">Spending by Category</h3>
          {spendingData.categories.map((category) => (
            <div 
              key={category.name} 
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-white font-medium">{category.name}</span>
                </div>
                <span className="font-[family-name:var(--font-orbitron)] text-white">${category.amount}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${category.percentage}%`,
                    backgroundColor: category.color,
                    boxShadow: `0 0 10px ${category.color}40`
                  }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">{category.percentage}% of total</p>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'savings' && (
        <div className="space-y-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="text-center p-8 rounded-2xl border border-[#00ff8833] bg-[#00ff8808]">
            <div className="text-5xl mb-4">🏦</div>
            <p className="text-gray-400 mb-2">Total Savings</p>
            <p className="font-[family-name:var(--font-orbitron)] text-4xl text-[#00ff88]">$6,500</p>
            <p className="text-gray-500 text-sm mt-2">+$300 this month</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-gray-400 text-sm">Monthly Target</p>
              <p className="font-[family-name:var(--font-orbitron)] text-xl text-white">$500</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-gray-400 text-sm">Streak</p>
              <p className="font-[family-name:var(--font-orbitron)] text-xl text-[#f59e0b]">🔥 12 months</p>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'goals' && (
        <div className="space-y-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <h3 className="font-[family-name:var(--font-orbitron)] text-lg text-gray-300 mb-4">Financial Goals</h3>
          {savingsGoals.map((goal) => {
            const progress = (goal.current / goal.target) * 100;
            return (
              <div 
                key={goal.name}
                className="p-5 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-medium">{goal.name}</h4>
                    <p className="text-gray-500 text-sm">${goal.current.toLocaleString()} of ${goal.target.toLocaleString()}</p>
                  </div>
                  <span 
                    className="font-[family-name:var(--font-orbitron)] text-lg"
                    style={{ color: goal.color }}
                  >
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: goal.color,
                      boxShadow: `0 0 15px ${goal.color}40`
                    }}
                  />
                </div>
              </div>
            );
          })}

          <button className="w-full py-4 rounded-xl border-2 border-dashed border-white/20 text-gray-400 hover:border-[#00d9ff] hover:text-[#00d9ff] transition-all">
            + Add New Goal
          </button>
        </div>
      )}
    </div>
  );
}
