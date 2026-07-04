import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';
import { getAllGuides } from '@/content/guides';
import { PROBLEMS } from '@/lib/problems';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PAGE_TITLE = 'System Design Interview Guides';
const PAGE_DESCRIPTION =
  'Free step-by-step system design interview guides with interactive simulations: URL shortener, WhatsApp, distributed cache, and more. Learn the trade-offs interviewers actually probe, then practice with an AI interviewer.';

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/guides` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/guides`,
    siteName: SITE_NAME,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default function GuidesIndexPage() {
  const guides = getAllGuides();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 md:py-20">
      <header className="mb-14 max-w-3xl">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">
          System Design Interview Guides
        </h1>
        <p className="text-xl leading-relaxed text-muted-foreground">
          Free, in-depth walkthroughs of the classic interview questions — with the interactive
          simulations embedded right in the guide. Don&apos;t just read about distributed systems.
          Break them. Fix them. Optimize them.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => {
          const problem = PROBLEMS.find((p) => p.slug === guide.metadata.problemSlug);
          const widgetCount = guide.sections
            .flatMap((s) => s.blocks)
            .filter((b) => b.type === 'widget').length;
          return (
            <Link
              key={guide.metadata.slug}
              href={`/guides/${guide.metadata.slug}`}
              className="group flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {problem && (
                  <Badge className="border-0 bg-primary/10 text-primary">{problem.difficulty}</Badge>
                )}
                {widgetCount > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    {widgetCount} interactive
                  </Badge>
                )}
              </div>
              <h2 className="mb-2 text-xl font-bold tracking-tight transition-colors group-hover:text-primary">
                {guide.metadata.title}
              </h2>
              <p className="mb-6 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {guide.metadata.description}
              </p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {guide.metadata.readingTime}
                </span>
                <span className="flex items-center gap-1 font-medium text-primary">
                  Read guide
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-16 rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
        <h2 className="mb-2 text-2xl font-bold">New guides every week</h2>
        <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
          We&apos;re publishing a guide for every one of our {PROBLEMS.length}+ practice problems.
          Can&apos;t wait? Every problem is already available to practice step by step with an AI
          interviewer.
        </p>
        <Button asChild size="lg">
          <Link href="/">
            Browse all {PROBLEMS.length}+ problems
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
