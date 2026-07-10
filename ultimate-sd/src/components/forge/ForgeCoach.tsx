'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, MessageCircle, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { fetchWithRetry, getFetchErrorMessage } from '@/lib/fetchUtils';
import { markdownToHtml } from '@/lib/markdown';
import type { SystemDesignProblem } from '@/types';
import type { ForgeJourneyStep } from '@/lib/forge/types';

type CoachMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ForgeCoachProps = {
  problem: SystemDesignProblem;
  currentStep: ForgeJourneyStep | null;
  getContextText: () => string;
  completedStepIds: string[];
};

export function ForgeCoach({
  problem,
  currentStep,
  getContextText,
  completedStepIds,
}: ForgeCoachProps) {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: CoachMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);
    setExpanded(true);

    try {
      const contextText = getContextText();
      const response = await fetchWithRetry('/api/ai/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem,
          messages: nextMessages,
          currentPhase: currentStep?.phase,
          completedSteps: completedStepIds,
          savedStepData: contextText
            ? [[currentStep?.stepId ?? 'frame', { textInput: contextText }]]
            : [],
        }),
        retries: 2,
        timeout: 20000,
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message ?? 'I could not generate a response.',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: getFetchErrorMessage(err),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'border-t bg-card/95 backdrop-blur-sm transition-all',
        expanded ? 'h-72' : 'h-12'
      )}
      data-testid="forge-coach"
    >
      <div className="flex h-12 items-center justify-between px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span>
            {expanded
              ? 'AI Coach — ask about your canvas work'
              : 'Coach — select anything on the canvas to get feedback'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse coach' : 'Expand coach'}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {expanded && (
        <div className="flex h-[calc(100%-3rem)] flex-col px-4 pb-3">
          <div className="flex-1 space-y-3 overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ask clarifying questions or get hints about your current frame. I won&apos;t give you the full answer.
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm',
                  msg.role === 'user' ? 'ml-8 bg-primary/10' : 'mr-8 bg-muted'
                )}
              >
                {msg.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }} />
                ) : (
                  msg.content
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the coach…"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
