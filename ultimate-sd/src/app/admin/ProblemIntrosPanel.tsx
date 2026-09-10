'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';
import {
  deleteProblemIntro,
  generateProblemIntroDraft,
  listProblemIntroStatuses,
  saveProblemIntro,
  type ProblemIntroStatus,
} from '@/app/actions/problem-intros';
import type { GeneratedIntro } from '@/lib/problem-intro-generation';
import { PROBLEM_INTROS } from '@/lib/problem-intros';

const SOURCE_BADGE: Record<ProblemIntroStatus['source'], string> = {
  generated: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  bespoke: 'bg-green-500/10 text-green-600 border-green-500/30',
  derived: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/30',
};

// Small local helper so the delete button says what deletion reverts to.
function PROBLEM_HAS_BESPOKE(slug: string): boolean {
  return Boolean(PROBLEM_INTROS[slug]);
}

export function ProblemIntrosPanel() {
  const [statuses, setStatuses] = useState<ProblemIntroStatus[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<GeneratedIntro | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedSlugRef = useRef(selectedSlug);

  useEffect(() => {
    selectedSlugRef.current = selectedSlug;
  }, [selectedSlug]);

  const refresh = () =>
    startTransition(async () => {
      setStatuses(await listProblemIntroStatuses());
    });

  useEffect(() => {
    refresh();
      }, []);

  const selected = statuses.find((s) => s.slug === selectedSlug) ?? null;

  const handleGenerate = (slug: string) =>
    startTransition(async () => {
      setError(null);
      setDraft(null);
      const result = await generateProblemIntroDraft(slug);
      if (selectedSlugRef.current !== slug) return;
      if (result.ok) {
        setDraft(result.draft);
      } else {
        setError(`${result.error}: ${result.message}`);
      }
    });

  const handleSave = (slug: string) =>
    startTransition(async () => {
      if (!draft) return;
      setError(null);
      try {
        await saveProblemIntro(slug, draft);
        setStatuses(await listProblemIntroStatuses());
        if (selectedSlugRef.current !== slug) return;
        setDraft(null);
      } catch (e) {
        if (selectedSlugRef.current !== slug) return;
        setError(e instanceof Error ? e.message : 'Save failed');
      }
    });

  const handleDelete = (slug: string) =>
    startTransition(async () => {
      setError(null);
      try {
        await deleteProblemIntro(slug);
        setStatuses(await listProblemIntroStatuses());
      } catch (e) {
        if (selectedSlugRef.current !== slug) return;
        setError(e instanceof Error ? e.message : 'Delete failed');
      }
    });

  const updateConcept = (index: number, field: 'term' | 'blurb', value: string) => {
    if (!draft) return;
    const concepts = draft.concepts.map((c, i) => (i === index ? { ...c, [field]: value } : c));
    setDraft({ ...draft, concepts });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Problem Intros</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[600px] space-y-1 overflow-y-auto">
          {statuses.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {isPending ? 'Loading…' : 'No problems found.'}
            </p>
          )}
          {statuses.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => {
                setSelectedSlug(s.slug);
                setDraft(null);
                setError(null);
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                selectedSlug === s.slug ? 'bg-muted' : 'hover:bg-muted/50'
              }`}
            >
              <span className="truncate">{s.title}</span>
              <Badge variant="outline" className={SOURCE_BADGE[s.source]}>
                {s.source}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {selected ? selected.title : 'Select a problem'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selected && (
            <>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleGenerate(selected.slug)}
                  disabled={isPending}
                  className="gap-2"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Generate with AI
                </Button>
                {selected.source === 'generated' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(selected.slug)}
                    disabled={isPending}
                    className="gap-2 text-red-600 border-red-500/30 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete (revert to {PROBLEM_HAS_BESPOKE(selected.slug) ? 'bespoke' : 'derived'})
                  </Button>
                )}
              </div>

              {error && (
                <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              {draft && (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="intro-hook"
                      className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
                    >
                      Hook
                    </label>
                    <textarea
                      id="intro-hook"
                      value={draft.hook}
                      onChange={(e) => setDraft({ ...draft, hook: e.target.value })}
                      rows={4}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    />
                  </div>
                  {draft.concepts.map((concept, i) => (
                    <div key={i} className="space-y-1 rounded-md border border-border/60 p-3">
                      <input
                        value={concept.term}
                        onChange={(e) => updateConcept(i, 'term', e.target.value)}
                        className="w-full rounded-md border border-border bg-background p-2 text-sm font-semibold"
                        aria-label={`Concept ${i + 1} term`}
                      />
                      <textarea
                        value={concept.blurb}
                        onChange={(e) => updateConcept(i, 'blurb', e.target.value)}
                        rows={2}
                        className="w-full rounded-md border border-border bg-background p-2 text-sm"
                        aria-label={`Concept ${i + 1} blurb`}
                      />
                    </div>
                  ))}
                  <Button onClick={() => handleSave(selected.slug)} disabled={isPending}>
                    Save intro
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
