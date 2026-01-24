'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface StatChanges {
  finances?: { currentXP?: number; level?: number };
  health?: { currentXP?: number; level?: number; strength?: number; speed?: number; nutrition?: number };
  intelligence?: { currentXP?: number; level?: number };
  message?: string;
}

interface ChatBoxProps {
  onStatChange: (changes: StatChanges) => void;
}

export default function ChatBox({ onStatChange }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
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

  return (
    <div className="bg-black/80 rounded-2xl p-4 h-full flex flex-col w-full">
      <h3 className="text-white text-lg font-semibold mb-3 text-center">Log Your Activity</h3>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[100px]">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-8">
            Tell me what you did today!<br />
            <span className="text-xs">e.g., "I ran 3 miles" or "I saved $50"</span>
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl text-sm ${
              msg.role === 'user'
                ? 'bg-purple-600 text-white ml-8'
                : 'bg-gray-700 text-gray-200 mr-8'
            }`}
          >
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
