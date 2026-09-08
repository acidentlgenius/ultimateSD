'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DEMO_LEVELS,
  DEMO_PROBLEM_LABEL,
  getDemoScript,
  scriptDurationMs,
  visibleBeats,
  type DemoBeat,
  type DemoLevel,
} from '@/lib/adaptive-coach/demo/landing-demo';
import { CoachBubble } from '@/components/chat/CoachBubble';

function Bubble({ beat }: { beat: DemoBeat }) {
  if (beat.role === 'system') {
    return <CoachBubble role="system">{beat.body}</CoachBubble>;
  }
  return (
    <CoachBubble role={beat.role === 'you' ? 'you' : 'coach'}>{beat.body}</CoachBubble>
  );
}

export function AdaptiveCoachDemo() {
  const [level, setLevel] = useState<DemoLevel>('sde1');
  const [playing, setPlaying] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [preferReducedMotion] = useState(false);

  const script = useMemo(() => getDemoScript(level), [level]);
  const durationMs = useMemo(() => scriptDurationMs(script), [script]);

  useEffect(() => {
    preferReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Restart clock when level or replay changes
  useEffect(() => {
    setElapsedMs(preferReducedMotion ? durationMs : 0);
    setPlaying(!preferReducedMotion);
  }, [level, replayKey, durationMs]);

  useEffect(() => {
    if (!playing) return;

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setElapsedMs((prev) => {
        if (prev >= durationMs) return durationMs;
        return Math.min(prev + dt, durationMs);
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, durationMs, replayKey, level]);

  useEffect(() => {
    if (playing && elapsedMs >= durationMs) {
      setPlaying(false);
    }
  }, [playing, elapsedMs, durationMs]);

  const shown = preferReducedMotion
    ? script
    : visibleBeats(script, elapsedMs);
  const finished = elapsedMs >= durationMs;
  const nextBeat = script.find((b) => b.atMs > elapsedMs);
  const showTyping =
    playing &&
    !finished &&
    nextBeat?.role === 'coach' &&
    nextBeat.atMs - elapsedMs < 900;

  const restart = () => {
    setReplayKey((k) => k + 1);
    setPlaying(true);
  };

  const onLevelChange = (next: DemoLevel) => {
    setLevel(next);
  };

  return (
    <section id="adaptive-coach" className="container mx-auto px-4 py-24">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Same rough answer.{' '}
            <span className="text-muted-foreground">A coach that fits you.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch how Adaptive Coach judges the same Requirements draft for Fresher,
            SDE-1, and Senior — then moves you forward instead of trapping you.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="max-w-xl mx-auto rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-border/60">
          <Badge variant="outline" className="text-xs font-medium">
            {DEMO_PROBLEM_LABEL}
          </Badge>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Experience level">
            {DEMO_LEVELS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={level === item.id}
                onClick={() => onLevelChange(item.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  level === item.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="px-5 py-5 space-y-3 min-h-[22rem] max-h-[28rem] overflow-y-auto bg-muted/10"
          aria-live="polite"
        >
          <AnimatePresence initial={false}>
            {shown.map((beat) => (
              <motion.div
                key={`${level}-${beat.id}`}
                initial={preferReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
              >
                <Bubble beat={beat} />
              </motion.div>
            ))}
          </AnimatePresence>
          {showTyping && (
            <p className="text-xs text-muted-foreground pl-1 animate-pulse">Coach is typing…</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-border/60 bg-muted/15">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (finished) restart();
                else setPlaying((p) => !p);
              }}
              aria-label={playing ? 'Pause demo' : finished ? 'Replay demo' : 'Play demo'}
            >
              {playing ? (
                <>
                  <Pause className="h-3.5 w-3.5 mr-1.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 mr-1.5" /> {finished ? 'Replay' : 'Play'}
                </>
              )}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={restart}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Replay
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Demo · Adaptive Coach</p>
        </div>
      </motion.div>

      <div className="text-center mt-12 space-y-3">
        <Button size="lg" className="h-12 px-8 rounded-full" asChild>
          <Link href="/practice/design-tinyurl">
            Start practicing <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Switch levels above to see how the ending changes.
        </p>
      </div>
    </section>
  );
}
