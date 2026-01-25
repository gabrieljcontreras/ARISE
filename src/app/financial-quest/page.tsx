'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useStats } from '@/context/StatsContext';
import { StatBar, InteractiveStat, DetailCard, OverviewStatMini, QuestItem } from '@/components/ui/DashboardComponents';
import ChatBox from '@/components/ChatBox';
import SoundToggle from '@/components/SoundToggle';

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

// Budget Goal interface
interface BudgetGoal {
  id: string;
  category: string;
  amount: number;
  currentSpending: number;
  period: string;
  status: string;
}

export default function FinancialQuestPage() {
  const { 
    stats, 
    totalXP,
    financialQuests, 
    completedQuests,
    financialActivities,
    handleStatChange, 
    handleQuestCreated, 
    toggleQuestCompletion 
  } = useStats();
  
  const [expandedStat, setExpandedStat] = useState<string | null>(null);
  const [capitalOneData, setCapitalOneData] = useState<CapitalOneData | null>(null);
  const [capitalOneLoading, setCapitalOneLoading] = useState(true);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);

  // Fetch Capital One data function
  const fetchCapitalOneData = async () => {
    try {
      setCapitalOneLoading(true);
      const response = await fetch('/api/capital-one-data');
      const data = await response.json();
      if (data.success) {
        setCapitalOneData(data.data);
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
  
  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <div className="bg-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Header */}
      <header className="relative z-10 px-[5%] py-8 flex justify-between items-center">
        <Link 
          href="/"
          className="font-[family-name:var(--font-orbitron)] text-3xl font-black tracking-widest"
          style={{
            background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'glow 3s ease-in-out infinite alternate'
          }}
        >
          ARISE
        </Link>
        <Link 
          href="/choose-quest"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Change Quest
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-[5%] pb-12">
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
                              {activity.type === 'investment' && (activity as { growth?: number }).growth && (activity as { growth: number }).growth > 0 && ` • +${(activity as { growth: number }).growth}% growth`}
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
      </main>
      <SoundToggle />
    </div>
  );
}
