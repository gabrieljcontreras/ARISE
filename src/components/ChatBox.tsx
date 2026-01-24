'use client';

import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface StatChanges {
  finances?: { currentXP?: number; level?: number };
  health?: { currentXP?: number; level?: number; strength?: number; speed?: number; nutrition?: number };
  intelligence?: { currentXP?: number; level?: number };
  message?: string;
}

interface ChatBoxProps {
  onStatChange: (changes: StatChanges) => void;
  questType?: 'financial' | 'health';
}

export default function ChatBox({ onStatChange, questType = 'health' }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
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

  return (
    <div 
      className="rounded-2xl p-5 flex flex-col w-full border"
      style={{ 
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        borderColor: `${accentColor}33`
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5" style={{ color: accentColor }} />
        <h3 className="font-[family-name:var(--font-orbitron)] text-white text-sm">Log Achievement</h3>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[60px] max-h-[120px]">
        {messages.length === 0 && (
          <p className="text-gray-500 text-xs text-center py-2">
            {exampleText}
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg text-xs ${
              msg.role === 'user'
                ? 'text-[#050814] ml-4 font-medium'
                : 'bg-white/10 text-gray-200 mr-4 border border-white/10'
            }`}
            style={msg.role === 'user' ? { background: `linear-gradient(135deg, ${accentColor}, #00d9ff)` } : {}}
          >
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
