import Link from 'next/link';
import { ArrowRight, Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PLAN_LABELS, type FeatureKey } from '@/lib/plans';
import { FEATURE_UPSELL_COPY, getFeatureHighlightPlan } from '@/lib/feature-upsell';

interface FeatureUpsellProps {
  feature: FeatureKey;
  /** Where "Continue without" goes (e.g. the plain practice page). */
  continueHref: string;
  continueLabel: string;
}

export function FeatureUpsell({ feature, continueHref, continueLabel }: FeatureUpsellProps) {
  const copy = FEATURE_UPSELL_COPY[feature];
  const highlightPlan = getFeatureHighlightPlan(feature);

  return (
    <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
        <Lock className="h-8 w-8 text-primary" />
      </div>
      <div className="flex items-center justify-center gap-2 mb-3">
        <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
        {highlightPlan && <Badge variant="secondary">{PLAN_LABELS[highlightPlan]} plan</Badge>}
      </div>
      <p className="text-lg text-muted-foreground leading-relaxed mb-10">{copy.pitch}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button size="lg" className="h-12 px-8 rounded-full" asChild>
          <Link href={`/pricing?feature=${feature}`}>
            <Sparkles className="mr-2 h-4 w-4" />
            See plans
          </Link>
        </Button>
        <Button size="lg" variant="ghost" className="h-12 px-6 rounded-full text-muted-foreground" asChild>
          <Link href={continueHref}>
            {continueLabel} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
