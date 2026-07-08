"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { HelpCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { SystemDesignProblem } from '@/types';
import { cn } from '@/lib/utils';
import { fetchWithRetry, getFetchErrorMessage } from '@/lib/fetchUtils';
import { markdownToHtml } from '@/lib/markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface HelpAssistantProps {
  problem: SystemDesignProblem;
  currentPhase?: string;
  completedSteps?: string[];
  savedStepData?: Map<string, any>;
}

export function HelpAssistant({ problem, currentPhase, completedSteps = [], savedStepData }: HelpAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const phaseInfo = currentPhase ? ` You're currently working on the ${currentPhase} phase.` : '';
      const progressInfo = completedSteps.length > 0 
        ? ` You've completed ${completedSteps.length} step${completedSteps.length > 1 ? 's' : ''} so far.` 
        : '';
      
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hi! I'm here to help you understand "${problem.title}" better.${phaseInfo}${progressInfo} I can clarify requirements, explain key concepts, and guide your thinking process - but I won't give you the solution directly. What would you like to know?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, problem.title, currentPhase, completedSteps.length, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetchWithRetry('/api/ai/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem,
          messages: [...messages, userMessage],
          currentPhase,
          completedSteps,
          savedStepData: savedStepData ? Array.from(savedStepData.entries()) : [],
        }),
        retries: 2,
        timeout: 15000,
      });

      if (!response.ok) throw new Error('Failed to get help');

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Help assistant error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getFetchErrorMessage(error),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        data-tour="help"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-110"
        aria-label="Open Help Assistant"
        title="Open Help Assistant"
      >
        <HelpCircle className="h-6 w-6 text-white" />
      </Button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="h-14 px-6 rounded-full shadow-2xl bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2"
        >
          <HelpCircle className="h-5 w-5 text-white" />
          <span className="text-white font-medium">Help Assistant</span>
          {messages.length > 1 && (
            <span className="bg-black dark:bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full font-semibold">
              {messages.length - 1}
            </span>
          )}
        </Button>
      </div>
    );
  }

  // Full dialog
  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] z-50 flex flex-col bg-background rounded-2xl shadow-2xl border-2 border-border overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold text-sm">Help Assistant</h3>
            <p className="text-xs opacity-90">Ask me anything about the problem</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="h-8 w-8 p-0 hover:bg-black dark:hover:bg-white/20 text-white"
            aria-label="Minimize Help Assistant"
            title="Minimize Help Assistant"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 hover:bg-black dark:hover:bg-white/20 text-white"
            aria-label="Close Help Assistant"
            title="Close Help Assistant"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2 shadow-sm',
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                  : 'bg-background border border-border'
              )}
            >
              <div
                className="text-sm [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1 [&_li]:my-0.5 [&_h3]:font-semibold [&_h3]:mt-2 [&_h4]:font-semibold [&_h4]:mt-2 [&_code]:bg-black/10 [&_code]:dark:bg-white/10 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }}
              />
              <p
                className={cn(
                  'text-xs mt-1',
                  message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                )}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-background border border-border rounded-2xl px-4 py-2 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1 rounded-full"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="rounded-full h-10 w-10 p-0 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            aria-label="Send message"
            title="Send message"
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          I'll guide your thinking without revealing solutions
        </p>
      </div>
    </div>
  );
}
