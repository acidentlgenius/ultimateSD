'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { getStartHereProblems } from '@/lib/start-here';
import { ProblemWithStatus } from '@/types';
import { captureClientEvent } from '@/lib/analytics-client';

interface StartHereTrackProps {
    problems?: ProblemWithStatus[];
}

export function StartHereTrack({ problems }: StartHereTrackProps) {
    const track = getStartHereProblems();
    const statusBySlug = new Map(
        (problems ?? []).map(p => [p.slug, p.status])
    );

    const firstIncomplete = track.find(p => statusBySlug.get(p.slug) !== 'COMPLETED');

    return (
        <section className="container mx-auto px-4 py-12 max-w-7xl" aria-labelledby="start-here-heading">
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                        <h2 id="start-here-heading" className="text-2xl font-bold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" /> New here? Start with these five
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            A guided ramp from your first URL shortener to a full distributed file store — all free.
                        </p>
                    </div>
                    {firstIncomplete && (
                        <Link
                            href={`/practice/${firstIncomplete.slug}`}
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors shrink-0"
                            data-testid="start-here-cta"
                            onClick={() => captureClientEvent('start here clicked', { slug: firstIncomplete.slug, source: 'track-cta' })}
                        >
                            {statusBySlug.size > 0 && firstIncomplete !== track[0] ? 'Continue the track' : 'Start the track'}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>

                <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {track.map((problem, i) => {
                        const completed = statusBySlug.get(problem.slug) === 'COMPLETED';
                        return (
                            <li key={problem.slug}>
                                <Link
                                    href={`/practice/${problem.slug}`}
                                    onClick={() => captureClientEvent('start here clicked', { slug: problem.slug, source: 'track-item', position: i + 1 })}
                                    className={`
                                        group flex flex-col gap-2 rounded-xl border p-4 h-full transition-all
                                        ${completed
                                            ? 'border-green-500/40 bg-green-500/5'
                                            : 'border-border bg-card hover:border-primary/50 hover:shadow-md'}
                                    `}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`
                                            flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold
                                            ${completed
                                                ? 'bg-green-500 text-white'
                                                : 'bg-primary/10 text-primary'}
                                        `}>
                                            {completed ? <Check className="w-4 h-4" /> : i + 1}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">{problem.difficulty}</Badge>
                                    </div>
                                    <span className="font-semibold leading-snug group-hover:text-primary transition-colors">
                                        {problem.title}
                                    </span>
                                    <span className="text-xs text-muted-foreground line-clamp-2">{problem.context}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}
