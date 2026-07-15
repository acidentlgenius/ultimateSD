'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  DEMO_FAUX_ANSWER,
  DEMO_LEVELS,
  DEMO_PROBLEM_LABEL,
  createInitialDemoState,
  getDemoStatus,
  resetDemoState,
  submitDemoAttempt,
  type DemoLevel,
  type LandingDemoState,
} from '@/lib/adaptive-coach/demo/landing-demo';

function actionLabel(action: LandingDemoState['lastAction']): string | null {
  if (!action) return null;
  if (action === 'teach_forward') return 'Coached advance';
  if (action === 'pass') return 'Pass';
  if (action === 'retry') return 'Retry';
  return action;
}

function actionBadgeVariant(
  action: NonNullable<LandingDemoState['lastAction']>
): 'default' | 'secondary' | 'outline' {
  if (action === 'pass') return 'default';
  if (action === 'teach_forward') return 'secondary';
  return 'outline';
}

export function AdaptiveCoachDemo() {
  const [state, setState] = useState(() => createInitialDemoState('sde1'));
  const status = getDemoStatus(state.level, state.attempts, state.lastAction);
  const lastActionLabel = actionLabel(state.lastAction);

  const handleLevelChange = (level: DemoLevel) => {
    setState(resetDemoState(level));
  };

  return (
    <section id="adaptive-coach" className="container mx-auto px-4 py-24">
      <div className="text-center mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Same answer. Different coach.
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Practice is judged for your level — and never traps you forever.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="max-w-2xl mx-auto rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border/50">
          <Badge variant="outline" className="text-xs font-medium">
            {DEMO_PROBLEM_LABEL}
          </Badge>
          <div className="flex flex-wrap gap-2">
            {DEMO_LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => handleLevelChange(level.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  state.level === level.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 border-b border-border/50">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
            Your answer
          </label>
          <Textarea
            value={DEMO_FAUX_ANSWER}
            disabled
            readOnly
            rows={3}
            className="resize-none bg-muted/30 text-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-border/50 bg-muted/20 text-sm">
          <span className="text-muted-foreground">
            Mode: <span className="text-foreground font-medium">{status.mode}</span>
          </span>
          <span className="text-muted-foreground">
            Pass bar: <span className="text-foreground font-medium">{status.threshold}</span>
          </span>
          <span className="text-muted-foreground">
            Tries:{' '}
            <span className="text-foreground font-medium">
              {status.attempts}/{status.maxAttempts}
            </span>
          </span>
          {lastActionLabel && state.lastAction && (
            <Badge
              variant={actionBadgeVariant(state.lastAction)}
              data-action={state.lastAction}
            >
              {lastActionLabel}
            </Badge>
          )}
        </div>

        <div className="px-6 py-5 space-y-3 min-h-[12rem] max-h-72 overflow-y-auto">
          {state.messages.map((message) =>
            message.role === 'system' ? (
              <p key={message.id} className="text-sm text-muted-foreground text-center">
                {message.body}
              </p>
            ) : (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-start"
              >
                <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-border bg-background px-4 py-3 text-sm leading-relaxed">
                  {message.body}
                </div>
              </motion.div>
            )
          )}
        </div>

        <div className="flex flex-wrap gap-3 px-6 py-5 border-t border-border/50">
          <Button
            onClick={() => setState((current) => submitDemoAttempt(current))}
            disabled={state.done}
          >
            Submit answer
          </Button>
          <Button
            variant="outline"
            onClick={() => setState(resetDemoState(state.level))}
          >
            Reset demo
          </Button>
        </div>
      </motion.div>

      <div className="text-center mt-14">
        <Button size="lg" className="h-12 px-8 rounded-full" asChild>
          <Link href="/practice/design-tinyurl">
            Start practicing <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
