'use client';

import { useState, useEffect } from 'react';
import { Send, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getSoundSystem } from '@/lib/soundSystem';

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
  dailyQuest?: {
    created: boolean;
    id: string;
    text: string;
    xp: number;
    category: 'financial' | 'health';
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

interface DailyQuest {
  id: string;
  text: string;
  xp: number;
  category: 'financial' | 'health';
}

interface ChatBoxProps {
  onStatChange: (changes: StatChanges) => void;
  questType?: 'financial' | 'health';
  onBudgetGoalCreated?: () => void;
  onQuestCreated?: (quest: DailyQuest) => void;
}

export default function ChatBox({ onStatChange, questType = 'health', onBudgetGoalCreated, onQuestCreated }: ChatBoxProps) {
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

  const isFinancial = questType === 'financial';
  const accentColor = isFinancial ? '#00d9ff' : '#00ff88';
  const placeholderText = isFinancial 
    ? 'Log a financial achievement...' 
    : 'Log a health achievement...';
  const exampleText = isFinancial 
    ? 'e.g., "I saved $100" or "Stayed under budget"' 
    : 'e.g., "I ran 3 miles" or "Did 50 pushups"';

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
        body: JSON.stringify({ task: userMessage, questType }),
      });

      const data = await response.json();
      
      if (data.message) {
        // Check if this was a budget goal response or quest creation
        const isBudgetGoal = data.budgetGoal?.created;
        const isQuestCreated = data.dailyQuest?.created;
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.message,
          type: isBudgetGoal ? 'budget' : isQuestCreated ? 'budget' : 'normal'
        }]);
        
        // If budget goal was created, refresh goals list
        if (isBudgetGoal) {
          fetchBudgetGoals();
          onBudgetGoalCreated?.();
        }
        
        // If quest was created, call the callback
        if (isQuestCreated && data.dailyQuest) {
          onQuestCreated?.(data.dailyQuest);
        }
        
        // Trigger sound effects based on stat changes
        const soundSystem = getSoundSystem();
        if (soundSystem) {
          const xpChange = (data.finances?.currentXP || 0) + (data.health?.currentXP || 0) + (data.intelligence?.currentXP || 0);
          const levelUp = (data.finances?.level) || (data.health?.level) || (data.intelligence?.level);
          
          if (levelUp) {
            soundSystem.playSound('level_up').catch(() => {});
          } else if (xpChange >= 20) {
            soundSystem.playSound('xp_gain').catch(() => {});
            soundSystem.playBeep(523.25, 150, 'success');
          } else if (xpChange > 0) {
            soundSystem.playSound('xp_gain').catch(() => {});
          }
        }
        
        onStatChange(data);
      } else if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t analyze that.' }]);
      }
    } catch {
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
      <h3 className="text-white text-lg font-semibold mb-3 text-center">Log Your Activity</h3>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[60px] max-h-[120px]">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-8">
            Tell me what you did today!<br />
            <span className="text-xs">e.g., "I ran 3 miles" or "I saved $50"</span>
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg text-xs ${
              msg.role === 'user'
                ? 'bg-purple-600 text-white ml-8'
                : 'bg-gray-700 text-gray-200 mr-8'
            }`}
            style={msg.role === 'user' ? { background: `linear-gradient(135deg, ${accentColor}, #00d9ff)` } : {}}
          >
            {msg.type === 'budget' && <Target className="w-4 h-4 inline mr-1" />}
            {msg.type === 'alert' && <AlertTriangle className="w-4 h-4 inline mr-1" />}
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="bg-white/10 text-gray-400 p-2 rounded-lg text-xs mr-4 border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: accentColor }} />
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
          placeholder={placeholderText}
          className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors placeholder:text-gray-500"
          style={{ 
            '--focus-border': accentColor 
          } as React.CSSProperties}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-3 py-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${accentColor} 0%, #00d9ff 100%)`,
          }}
        >
          <Send size={16} className="text-[#050814]" />
        </button>
      </form>
    </div>
  );
}
