'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
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
  other: '#6b7280'
};

export default function FinancesCard({ level, currentXP, customerId }: FinancesCardProps) {
  const xpPercentage = (currentXP / 100) * 100;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spendingData, setSpendingData] = useState<{
    categories: SpendingCategory[];
    totalSpending: number;
    essentialSpending: number;
    discretionarySpending: number;
  } | null>(null);

  const fetchAndAnalyzeTransactions = async () => {
    if (!customerId) {
      // Use mock data if no customerId
      setSpendingData({
        categories: [
          { name: 'Food', amount: 450, percentage: 30, color: CATEGORY_COLORS.food },
          { name: 'Rent', amount: 800, percentage: 35, color: CATEGORY_COLORS.rent },
          { name: 'Entertainment', amount: 150, percentage: 10, color: CATEGORY_COLORS.entertainment },
          { name: 'Subscriptions', amount: 75, percentage: 5, color: CATEGORY_COLORS.subscriptions },
        ],
        totalSpending: 1500,
        essentialSpending: 1250,
        discretionarySpending: 250
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch transactions from Capital One
      const txResponse = await fetch(`/api/capital-one?customerId=${customerId}`);
      const txData = await txResponse.json();

      if (txData.error) {
        throw new Error(txData.error);
      }

      // Analyze transactions with Gemini
      const analysisResponse = await fetch('/api/analyze-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: txData.transactions })
      });
      const analysisData = await analysisResponse.json();

      if (analysisData.error) {
        throw new Error(analysisData.error);
      }

      // Transform data for display
      const categories: SpendingCategory[] = Object.entries(analysisData.summary.spendingByCategory)
        .map(([name, amount]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          amount: amount as number,
          percentage: Math.round(((amount as number) / analysisData.summary.totalSpending) * 100),
          color: CATEGORY_COLORS[name] || CATEGORY_COLORS.other
        }))
        .sort((a, b) => b.amount - a.amount);

      setSpendingData({
        categories,
        totalSpending: analysisData.summary.totalSpending,
        essentialSpending: analysisData.summary.essentialSpending,
        discretionarySpending: analysisData.summary.discretionarySpending
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndAnalyzeTransactions();
  }, [customerId]);

  return (
    <div className="bg-black rounded-2xl p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-white text-xl font-light flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Finances
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

      {/* Spending Summary */}
      {spendingData && (
        <div className="mb-4 p-3 bg-gray-900 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Total Spending</span>
            <span className="text-white font-bold">${spendingData.totalSpending.toFixed(2)}</span>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-green-400" />
              <span className="text-gray-400">Essential:</span>
              <span className="text-green-400">${spendingData.essentialSpending.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-orange-400" />
              <span className="text-gray-400">Discretionary:</span>
              <span className="text-orange-400">${spendingData.discretionarySpending.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="flex-1 overflow-hidden">
        <h4 className="text-gray-400 text-sm mb-3">Spending by Category</h4>
        
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-gray-500">Analyzing transactions...</div>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && spendingData && (
          <div className="space-y-3 overflow-y-auto max-h-[calc(100%-2rem)]">
            {spendingData.categories.map((category) => (
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
