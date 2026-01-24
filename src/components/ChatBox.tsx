'use client';

import { useState, useEffect } from 'react';
import { Send, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StatChanges {
  finances?: { currentXP?: number; level?: number };
  health?: { currentXP?: number; level?: number; strength?: number; speed?: number; nutrition?: number };
  intelligence?: { currentXP?: number; level?: number };
  message?: string;
  budgetGoal?: {
    created: boolean;
    category?: string;
    amount?: number;
    period?: string;
    goalType?: string;
  };
}

interface BudgetGoal {
  _id: string;
  category: string;
  amount: number;
  currentSpending: number;
  period: string;
  percentageUsed: number;
  remaining: number;
  daysRemaining: number;
  status: string;
}

interface ChatBoxProps {
  onStatChange: (changes: StatChanges) => void;
  onBudgetGoalCreated?: () => void;
}

export default function ChatBox({ onStatChange, onBudgetGoalCreated }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; type?: 'normal' | 'budget' | 'alert' }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeGoals, setActiveGoals] = useState<BudgetGoal[]>([]);
  const [showGoals, setShowGoals] = useState(false);

  // Fetch active budget goals
  const fetchBudgetGoals = async () => {
    try {
      const response = await fetch('/api/budget-goals');
      const data = await response.json();
      if (data.success) {
        setActiveGoals(data.goals);
      }
    } catch (error) {
      console.error('Failed to fetch budget goals:', error);
    }
  };

  useEffect(() => {
    fetchBudgetGoals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: userMessage }),
      });

      const data = await response.json();
      
      if (data.message) {
        // Check if this was a budget goal response
        const isBudgetGoal = data.budgetGoal?.created;
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.message,
          type: isBudgetGoal ? 'budget' : 'normal'
        }]);
        
        // If budget goal was created, refresh goals list
        if (isBudgetGoal) {
          fetchBudgetGoals();
          onBudgetGoalCreated?.();
        }
        
        onStatChange(data);
      } else if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t analyze that task.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to the server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return <AlertTriangle className="w-4 h-4 text-red-400" />;
    if (percentage >= 75) return <AlertTriangle className="w-4 h-4 text-orange-400" />;
    return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  };

  return (
    <div className="bg-black/80 rounded-2xl p-4 h-full flex flex-col w-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white text-lg font-semibold">Log Your Activity</h3>
        {activeGoals.length > 0 && (
          <button
            onClick={() => setShowGoals(!showGoals)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
              showGoals ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Target className="w-3 h-3" />
            {activeGoals.length} Goal{activeGoals.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Budget Goals Panel */}
      {showGoals && activeGoals.length > 0 && (
        <div className="mb-3 p-3 bg-gray-900 rounded-xl space-y-2 max-h-[150px] overflow-y-auto">
          <p className="text-xs text-gray-400 mb-2">Active Budget Goals</p>
          {activeGoals.map((goal) => (
            <div key={goal._id} className="bg-gray-800 rounded-lg p-2">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(goal.percentageUsed)}
                  <span className="text-white text-sm capitalize">{goal.category}</span>
                </div>
                <span className="text-xs text-gray-400">
                  ${goal.currentSpending.toFixed(0)} / ${goal.amount}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getProgressColor(goal.percentageUsed)}`}
                  style={{ width: `${Math.min(goal.percentageUsed, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">{goal.daysRemaining} days left</span>
                <span className={`text-xs ${goal.remaining > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${goal.remaining.toFixed(2)} remaining
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[100px]">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-8">
            Tell me what you did today!<br />
            <span className="text-xs">e.g., "I ran 3 miles" or "I saved $50"</span>
            <br /><br />
            <span className="text-purple-400 text-xs">
              💡 Try: "I want to spend no more than $100 on entertainment this week"
            </span>
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl text-sm ${
              msg.role === 'user'
                ? 'bg-purple-600 text-white ml-8'
                : msg.type === 'budget'
                ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-700/50 text-green-100 mr-8'
                : msg.type === 'alert'
                ? 'bg-gradient-to-r from-orange-900/50 to-red-900/50 border border-orange-700/50 text-orange-100 mr-8'
                : 'bg-gray-700 text-gray-200 mr-8'
            }`}
          >
            {msg.type === 'budget' && <Target className="w-4 h-4 inline mr-1" />}
            {msg.type === 'alert' && <AlertTriangle className="w-4 h-4 inline mr-1" />}
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="bg-gray-700 text-gray-200 p-3 rounded-xl text-sm mr-8">
            Analyzing...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What did you accomplish?"
          className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white p-3 rounded-xl transition-colors"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
