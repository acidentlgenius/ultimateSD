'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Input } from './ui/input';
import { HelpCircle, Send } from 'lucide-react';
import { SystemDesignProblem } from '@/types';
import { fetchWithRetry, getFetchErrorMessage } from '@/lib/fetchUtils';
import { markdownToHtml } from '@/lib/markdown';
import { CoachBubble } from '@/components/chat/CoachBubble';

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
  savedStepData?: Map<string, unknown>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpAssistant({
  problem,
  currentPhase,
  completedSteps = [],
  savedStepData,
  open,
  onOpenChange,
}: HelpAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0) {
      const phaseInfo = currentPhase ? ` You're currently working on the ${currentPhase} phase.` : '';
      const progressInfo =
        completedSteps.length > 0
          ? ` You've completed ${completedSteps.length} step${completedSteps.length > 1 ? 's' : ''} so far.`
          : '';

      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hi! I'm here to help you understand "${problem.title}" better.${phaseInfo}${progressInfo} I can clarify requirements, explain key concepts, and guide your thinking — but I won't give you the solution directly. What would you like to know?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [open, problem.title, currentPhase, completedSteps.length, messages.length]);

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

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Help assistant error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: getFetchErrorMessage(error),
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4 text-primary" />
            Hint
          </SheetTitle>
          <SheetDescription className="text-xs">
            Socratic guidance for {problem.title} — not a full solution.
          </SheetDescription>
        </SheetHeader>

        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto bg-muted/10 px-4 py-4"
          aria-live="polite"
        >
          {messages.map((message) => (
            <CoachBubble
              key={message.id}
              role={message.role === 'user' ? 'you' : 'coach'}
              label={message.role === 'user' ? 'You' : 'Hint'}
            >
              <div
                className="[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }}
              />
            </CoachBubble>
          ))}
          {isLoading && (
            <p className="text-xs text-muted-foreground pl-1 animate-pulse">Thinking…</p>
          )}
        </div>

        <div className="flex gap-2 border-t border-border p-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Ask a clarifying question…"
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => void handleSend()}
            disabled={isLoading || !input.trim()}
            aria-label="Send hint question"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
