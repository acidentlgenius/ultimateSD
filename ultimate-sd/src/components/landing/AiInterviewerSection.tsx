'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Timer, MessageSquareWarning, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { joinWaitlist } from '@/app/actions/waitlist';

const PILLARS = [
  {
    icon: Timer,
    title: 'Timed Mock Interview',
    description: 'A strict countdown, no hints — then an AI hiring-committee debrief scores every phase.',
  },
  {
    icon: Mic,
    title: 'Voice Interview',
    description: 'Answer out loud. The AI interviewer listens, follows up, and keeps you talking.',
  },
  {
    icon: MessageSquareWarning,
    title: 'Defend your design',
    description: 'Passed a step? An AI skeptic challenges your design with real follow-up questions.',
  },
];

interface AiInterviewerSectionProps {
  interviewModeEnabled?: boolean;
}

export function AiInterviewerSection({ interviewModeEnabled = false }: AiInterviewerSectionProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    try {
      const result = await joinWaitlist(email);
      if (result.success) {
        setStatus('done');
        toast.success("You're on the list!", { description: "We'll email you the moment the AI Interviewer goes live." });
      } else {
        setStatus('idle');
        toast.error(result.error ?? 'Something went wrong.');
      }
    } catch {
      setStatus('idle');
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <section id="ai-interviewer" className="container mx-auto px-4 py-24">
      <div className="text-center mb-14">
        {!interviewModeEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-secondary mb-6 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">Coming soon</span>
          </motion.div>
        )}
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Meet your{' '}
          <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            AI Interviewer
          </span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The pressure of a real system design round — without the real stakes.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-14">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
            <pillar.icon className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">{pillar.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto text-center">
        {interviewModeEnabled ? (
          <Button size="lg" className="h-12 px-8 rounded-full" asChild>
            <Link href="/interview">Start mock interview</Link>
          </Button>
        ) : status === 'done' ? (
          <p className="text-lg font-medium text-primary">You&apos;re on the waitlist 🎉</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-full px-5"
            />
            <Button type="submit" size="lg" disabled={status === 'saving'} className="h-12 px-6 rounded-full shrink-0">
              {status === 'saving' ? 'Joining…' : 'Join waitlist'}
            </Button>
          </form>
        )}
        {!interviewModeEnabled && (
          <p className="text-xs text-muted-foreground mt-3">Be first in line when it launches. No spam.</p>
        )}
      </div>
    </section>
  );
}
