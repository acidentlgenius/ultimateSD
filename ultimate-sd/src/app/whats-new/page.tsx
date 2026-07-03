import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WHATS_NEW_ENTRIES } from '@/lib/whats-new';
import { PLAN_LABELS } from '@/lib/plans';

export const metadata: Metadata = {
  title: "What's New - Ultimate SD",
  description: 'Latest features and improvements on Ultimate SD.',
};

export default function WhatsNewPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          What&apos;s New
        </h1>
        <p className="text-lg text-muted-foreground">
          Every feature and improvement we ship, in one place.
        </p>
      </div>

      <div className="space-y-10">
        {WHATS_NEW_ENTRIES.map((entry) => (
          <article key={entry.id} className="relative pl-6 border-l-2 border-border">
            <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-primary" />
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <time dateTime={entry.date} className="text-sm text-muted-foreground font-medium">
                {entry.date}
              </time>
              {entry.status === 'coming-soon' && (
                <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400">
                  Coming soon
                </Badge>
              )}
              {entry.plans?.map((plan) => (
                <Badge key={plan} variant="secondary">{PLAN_LABELS[plan]} plan</Badge>
              ))}
            </div>
            <h2 className="text-xl font-semibold mb-2">{entry.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{entry.description}</p>
            {entry.href && entry.status === 'live' && (
              <Link href={entry.href} className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-primary hover:underline">
                Try it <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
