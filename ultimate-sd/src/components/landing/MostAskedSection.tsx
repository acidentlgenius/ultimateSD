'use client';

import { MOST_ASKED_COLLECTIONS } from '@/lib/company-collections';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';

interface MostAskedSectionProps {
  selectedCollectionId: string | null;
  onSelectCollection: (collectionId: string | null) => void;
}

export function MostAskedSection({
  selectedCollectionId,
  onSelectCollection,
}: MostAskedSectionProps) {
  return (
    <section className="container mx-auto px-4 py-12 relative z-10 max-w-7xl">
      <div className="mb-8 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
          <Building2 className="h-3.5 w-3.5" />
          Most asked interviews
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Popular at top companies
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Curated problem sets frequently asked in system design loops. Select a company to filter the library below.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {MOST_ASKED_COLLECTIONS.map((collection) => {
          const isSelected = selectedCollectionId === collection.id;
          return (
            <button
              key={collection.id}
              type="button"
              onClick={() =>
                onSelectCollection(isSelected ? null : collection.id)
              }
              className={cn(
                'text-left rounded-2xl border px-4 py-3 transition-all min-w-[140px] flex-1 sm:flex-none sm:max-w-[200px]',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                  : 'border-border/60 bg-card/50 hover:border-primary/30 hover:bg-card/80',
              )}
            >
              <div className="font-semibold text-sm">{collection.company}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {collection.tagline}
              </div>
              <div className="text-[10px] text-muted-foreground/80 mt-2">
                {collection.slugs.length} problems
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
