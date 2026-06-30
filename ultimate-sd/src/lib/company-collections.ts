import { PROBLEMS } from '@/lib/problems';
import type { SystemDesignProblem } from '@/types';

export interface CompanyCollection {
  id: string;
  company: string;
  tagline: string;
  /** Curated slugs ordered by typical interview frequency */
  slugs: readonly string[];
}

/** Editorial “most asked” lists — not scraped; tuned for common FAANG loops. */
export const MOST_ASKED_COLLECTIONS: readonly CompanyCollection[] = [
  {
    id: 'google',
    company: 'Google',
    tagline: 'URL shortener, search, typeahead, IDs',
    slugs: [
      'design-tinyurl',
      'design-google-search',
      'design-typeahead-suggestion',
      'design-unique-id-generator',
      'design-youtube',
      'design-distributed-cache',
    ],
  },
  {
    id: 'meta',
    company: 'Meta',
    tagline: 'Feeds, messaging, social graphs',
    slugs: [
      'design-twitter',
      'design-instagram',
      'design-facebook-news-feed',
      'design-whatsapp',
      'design-notification-system',
    ],
  },
  {
    id: 'amazon',
    company: 'Amazon',
    tagline: 'Scale, caching, commerce flows',
    slugs: [
      'design-tinyurl',
      'design-distributed-cache',
      'design-rate-limiter',
      'design-unique-id-generator',
      'design-recommendation-engine',
      'design-netflix',
    ],
  },
  {
    id: 'netflix',
    company: 'Netflix',
    tagline: 'Streaming, recommendations, CDN',
    slugs: [
      'design-netflix',
      'design-youtube',
      'design-recommendation-engine',
      'design-rate-limiter',
      'design-notification-system',
    ],
  },
  {
    id: 'uber',
    company: 'Uber',
    tagline: 'Marketplace, location, real-time',
    slugs: [
      'design-uber',
      'design-rate-limiter',
      'design-notification-system',
      'design-unique-id-generator',
      'design-distributed-cache',
    ],
  },
] as const;

export function getProblemsForCollection(
  collectionId: string,
  problems: SystemDesignProblem[] = PROBLEMS,
): SystemDesignProblem[] {
  const collection = MOST_ASKED_COLLECTIONS.find((c) => c.id === collectionId);
  if (!collection) return [];

  const bySlug = new Map(problems.map((p) => [p.slug, p]));
  return collection.slugs
    .map((slug) => bySlug.get(slug))
    .filter((p): p is SystemDesignProblem => p !== undefined);
}

export function problemInCollection(slug: string, collectionId: string): boolean {
  const collection = MOST_ASKED_COLLECTIONS.find((c) => c.id === collectionId);
  return collection?.slugs.includes(slug) ?? false;
}
