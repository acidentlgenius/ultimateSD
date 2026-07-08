'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

const TOUR_DONE_KEY = 'sd_practice_tour_done_v1';

interface TourStep {
    target: string;
    title: string;
    body: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        target: 'steps',
        title: 'Your interview journey',
        body: 'Every problem is broken into the same phases as a real interview — requirements, estimation, architecture, deep dives. Work through the steps top to bottom.',
    },
    {
        target: 'chat',
        title: 'Answer each step here',
        body: 'Type your answer to the current step and submit it. The AI interviewer reviews it and gives you specific feedback before you move on.',
    },
    {
        target: 'canvas',
        title: 'Sketch your architecture',
        body: 'When a step calls for a diagram, the canvas appears below. Whatever you draw is saved automatically and attached to your submission.',
    },
    {
        target: 'help',
        title: 'Stuck? Ask for a hint',
        body: 'The assistant knows the problem and your progress. Ask it to clarify a step or nudge you in the right direction — it won\'t spoil the answer.',
    },
];

interface Rect {
    top: number;
    left: number;
    width: number;
    height: number;
}

function getTargetRect(target: string): Rect | null {
    const el = document.querySelector(`[data-tour="${target}"]`);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    // Hidden elements (e.g. the desktop sidebar on mobile) report a zero rect.
    if (rect.width === 0 || rect.height === 0) return null;
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

export function PracticeTour() {
    const [active, setActive] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [rect, setRect] = useState<Rect | null>(null);

    // Auto-start on first visit; replayable via the 'sd-start-tour' event.
    useEffect(() => {
        let seen = true;
        try {
            seen = localStorage.getItem(TOUR_DONE_KEY) === '1';
        } catch { /* private mode etc. — treat as seen */ }
        if (!seen) {
            const t = setTimeout(() => setActive(true), 800);
            return () => clearTimeout(t);
        }
    }, []);

    useEffect(() => {
        const start = () => {
            setStepIndex(0);
            setActive(true);
        };
        window.addEventListener('sd-start-tour', start);
        return () => window.removeEventListener('sd-start-tour', start);
    }, []);

    const measure = useCallback(() => {
        if (!active) return;
        setRect(getTargetRect(TOUR_STEPS[stepIndex].target));
    }, [active, stepIndex]);

    useEffect(() => {
        if (!active) return;
        const el = document.querySelector(`[data-tour="${TOUR_STEPS[stepIndex].target}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Measure after the scroll settles.
        const t = setTimeout(measure, 350);
        window.addEventListener('resize', measure);
        return () => {
            clearTimeout(t);
            window.removeEventListener('resize', measure);
        };
    }, [active, stepIndex, measure]);

    const finish = () => {
        try {
            localStorage.setItem(TOUR_DONE_KEY, '1');
        } catch { /* ignore */ }
        setActive(false);
        setStepIndex(0);
    };

    if (!active) return null;

    const step = TOUR_STEPS[stepIndex];
    const isLast = stepIndex === TOUR_STEPS.length - 1;

    // Position the card under the highlighted element, clamped to the viewport;
    // centered fallback when the target is hidden (e.g. mobile).
    const cardStyle: React.CSSProperties = rect
        ? {
            position: 'fixed',
            top: Math.min(rect.top + rect.height + 12, window.innerHeight - 220),
            left: Math.min(Math.max(rect.left, 16), window.innerWidth - 336),
        }
        : {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
        };

    return (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Practice page tour" data-testid="practice-tour">
            {/* Backdrop — clicking it skips the tour */}
            <div className="absolute inset-0 bg-black/50" onClick={finish} />

            {/* Highlight ring around the current target */}
            {rect && (
                <div
                    className="absolute rounded-xl ring-4 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none transition-all duration-300"
                    style={{
                        top: rect.top - 6,
                        left: rect.left - 6,
                        width: rect.width + 12,
                        height: rect.height + 12,
                    }}
                />
            )}

            <div
                style={cardStyle}
                className="w-80 rounded-xl border border-border bg-card p-5 shadow-2xl space-y-3"
            >
                <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {stepIndex + 1} of {TOUR_STEPS.length}
                    </p>
                    <button
                        onClick={finish}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Skip tour"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <h3 className="font-bold text-lg leading-tight">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                <div className="flex items-center justify-between pt-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStepIndex(i => Math.max(0, i - 1))}
                        disabled={stepIndex === 0}
                        className="gap-1"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => (isLast ? finish() : setStepIndex(i => i + 1))}
                        className="gap-1"
                        data-testid="tour-next"
                    >
                        {isLast ? 'Start practicing' : 'Next'} {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
