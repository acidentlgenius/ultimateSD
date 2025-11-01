'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { SystemDesignProblem, ChatMessage } from '@/types';

interface Props {
  problem: SystemDesignProblem;
}

export default function ChatInterface({ problem }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('init');

  useEffect(() => {
    // Load initial message
    const initMsg: ChatMessage = {
      role: 'ai',
      content: `Welcome! Let's design ${problem.title}. Start by clarifying requirements.`,
      id: 'init',
      timestamp: new Date()
    };
    setMessages([initMsg]);
    setPhase('requirements');
  }, [problem]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      role: 'user',
      content: input,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ input, slug: problem.slug, messages, phase }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setMessages(data.messages);
      setPhase(data.phase);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Sorry, there was an error. Please try again.',
        id: 'error',
        timestamp: new Date()
      }]);
    }
    setLoading(false);
    setInput('');
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-xl font-semibold text-black">{problem.title}</h2>
        <p className="text-sm text-gray-600">{problem.description}</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4 overflow-y-auto">
          {messages.map(msg => (
            <div key={msg.id} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block max-w-xs lg:max-w-md p-3 rounded-lg ${
                msg.role === 'ai'
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {msg.content}
                {msg.feedback && (
                  <div className="mt-2 text-sm border-t pt-2">
                    Score: {msg.feedback.score}/10 | Tips: {msg.feedback.tips.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Explain your design..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}