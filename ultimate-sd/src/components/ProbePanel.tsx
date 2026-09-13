'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ShieldQuestion, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { canEndProbe } from '@/lib/probe';
import type { ChatMessage, SystemDesignProblem } from '@/types';
import { fetchWithRetry, getUserFacingFetchError } from '@/lib/fetchUtils';

interface ProbePanelProps {
  problem: SystemDesignProblem;
  phase: string;
  stepAnswer: string;
  onClose: () => void;
}

export default function ProbePanel({ problem, phase, stepAnswer, onClose }: ProbePanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [round, setRound] = useState(0); // probe questions asked so far
  const [isFinal, setIsFinal] = useState(false);
  const [answeredFinal, setAnsweredFinal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const fetchProbe = async (nextRound: number, history: ChatMessage[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithRetry('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'probe',
          slug: problem.slug,
          phase,
          stepAnswer,
          probeMessages: history,
          round: nextRound,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? 'Probe unavailable.');
        return;
      }

      setMessages([...history, data.message]);
      setRound(data.round);
      setIsFinal(data.isFinal);
    } catch (e) {
      setError(getUserFacingFetchError(e) || 'Probe unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void fetchProbe(1, []);
     
  }, []);

  const sendReply = () => {
    if (!reply.trim() || loading) return;
    const userMessage: ChatMessage = {
      role: 'user',
      content: reply.trim(),
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    const history = [...messages, userMessage];
    setMessages(history);
    setReply('');
    if (isFinal) {
      setAnsweredFinal(true);
      return;
    }
    void fetchProbe(round + 1, history);
  };

  const probeOver = answeredFinal;

  return (
    <Card className="mt-6 border-2 border-amber-500/30 bg-amber-500/5">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldQuestion className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold text-sm">Defend your design</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Close probe"
            title="Close probe"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg p-3 text-sm ${
                m.role === 'ai'
                  ? 'bg-amber-500/10 border border-amber-500/20'
                  : 'bg-muted/50 border border-border ml-6'
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Challenging your design…
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {probeOver ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Follow-up complete — {round} rounds defended.
            </p>
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Defend your design…"
              className="min-h-[80px] resize-none"
              disabled={loading}
            />
            <div className="flex justify-between">
              {canEndProbe(round) && !isFinal ? (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  End probe
                </Button>
              ) : (
                <span />
              )}
              <Button size="sm" onClick={sendReply} disabled={loading || !reply.trim()}>
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
