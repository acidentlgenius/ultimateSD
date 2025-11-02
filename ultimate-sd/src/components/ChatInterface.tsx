'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { SystemDesignProblem, ChatMessage } from '@/types';
import { tokens } from '@/styles/tokens';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Props {
  problem: SystemDesignProblem;
}

export default function ChatInterface({ problem }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('init');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial message
    const initMsg: ChatMessage = {
      role: 'ai',
      content: `Welcome! Let's design ${problem.title}. Start by clarifying requirements.`,
      id: 'init',
      timestamp: new Date()
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([initMsg]);
    setPhase('requirements');
  }, [problem]);

  // expose messages getter for transcript/export and dispatch phase change events
  useEffect(() => {
    (window as any).sd_getMessages = () => messages;
    return () => { (window as any).sd_getMessages = undefined; };
  }, [messages]);

  useEffect(() => {
    // Dispatch a phase change event so parent UI can update progress
    const evt = new CustomEvent('sd-phase-change', { detail: { phase } });
    window.dispatchEvent(evt);
  }, [phase]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && typeof scrollRef.current.scrollIntoView === 'function') {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      role: 'user',
      content: input,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    // optimistic update
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ input, slug: problem.slug, messages, phase }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data?.messages) {
        setMessages(data.messages);
      }
      if (data?.phase) setPhase(data.phase);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Cmd/Ctrl + Enter to send
    if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey)) && !loading) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getPhaseColor = (currentPhase: string) => {
    return tokens.colors.phase[currentPhase as keyof typeof tokens.colors.phase] || tokens.colors.info;
  };

  return (
    <div className="h-full flex flex-col bg-card/50 backdrop-blur-sm rounded-xl border-2 border-border shadow-lg overflow-hidden">
      {/* Header with glass effect */}
      <div className="glass p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-card-foreground truncate">{problem.title}</h2>
              <p className="text-xs text-muted-foreground truncate">{problem.description}</p>
            </div>
          </div>
          <Badge
            style={{ backgroundColor: getPhaseColor(phase), color: 'white' }}
            className="text-xs font-semibold capitalize shrink-0 ml-2 shadow-sm"
          >
            {phase.replace('-', ' ')}
          </Badge>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden" role="region" aria-label="Conversation">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4" aria-live="polite">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {msg.role === 'ai' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] lg:max-w-[70%] rounded-xl p-4 shadow-md ${
                  msg.role === 'ai'
                    ? 'bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20'
                    : 'bg-gradient-to-br from-muted to-muted/80 border border-border'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.feedback && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-semibold">Score:</div>
                        <Badge variant="secondary" className="text-xs">{msg.feedback.score}/10</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold">Tips:</span> {msg.feedback.tips.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-muted-foreground to-muted flex items-center justify-center shadow-md">
                    <User className="h-5 w-5 text-background" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start animate-fade-in">
                <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 shadow-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input area with enhanced styling */}
      <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="glass p-4 border-t border-border">
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Explain your design"
              placeholder="Explain your design... (Cmd/Ctrl + Enter to send)"
              className="bg-background/50 backdrop-blur-sm border-2 focus:border-primary transition-all"
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 gradient-bg hover:opacity-90 transition-all shadow-md"
          >
            {loading ? (
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-primary-foreground rounded-full animate-pulse" />
                <div className="w-1 h-4 bg-primary-foreground rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-4 bg-primary-foreground rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Cmd/Ctrl + Enter to send quickly
        </p>
      </form>
    </div>
  );
}