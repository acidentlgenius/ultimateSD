import type { ArticleBlock } from './blog';

/**
 * Public SEO guide content model. Guides are free, no-login, server-rendered
 * pages at /guides/[slug] — one per system design problem. They reuse the
 * blog's block types and add an interactive widget embed.
 */

export interface WidgetEmbedBlock {
  id: string;
  type: 'widget';
  /** Key into the widget registry (src/components/widgets/registry.tsx). */
  widgetId: string;
  title: string;
  caption?: string;
}

export type GuideBlock = ArticleBlock | WidgetEmbedBlock;

export interface GuideFaqItem {
  question: string;
  /** Plain text — also emitted as FAQPage JSON-LD, so no markdown/HTML. */
  answer: string;
}

export interface GuideMetadata {
  /** Guide slug; matches the problem slug so /guides/x pairs with /practice/x. */
  slug: string;
  problemSlug: string;
  /** On-page H1. */
  title: string;
  /** <title> tag — include the search phrase users type. */
  seoTitle: string;
  description: string;
  publishedAt: string; // ISO date
  updatedAt: string; // ISO date
  readingTime: string;
  keywords: string[];
}

export interface GuideSection {
  id: string;
  title: string;
  blocks: GuideBlock[];
}

export interface Guide {
  metadata: GuideMetadata;
  sections: GuideSection[];
  faq: GuideFaqItem[];
}
