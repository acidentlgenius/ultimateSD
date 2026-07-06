import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAllGuides, getGuideBySlug } from '@/content/guides';
import { PROBLEMS } from '@/lib/problems';

// Widget ids available in the client registry. The registry is a client
// component (next/dynamic with JSX), so parse its keys from source instead
// of importing it in a node test.
function registryWidgetIds(): Set<string> {
  const source = readFileSync(
    join(process.cwd(), 'src/components/widgets/registry.tsx'),
    'utf-8'
  );
  return new Set([...source.matchAll(/'([a-z0-9-]+)':\s*dynamic\(/g)].map((m) => m[1]));
}

describe('guide content integrity', () => {
  const guides = getAllGuides();

  it('has at least the three seed guides', () => {
    expect(guides.length).toBeGreaterThanOrEqual(3);
  });

  it('every guide maps to a real problem', () => {
    const problemSlugs = new Set(PROBLEMS.map((p) => p.slug));
    for (const guide of guides) {
      expect(problemSlugs.has(guide.metadata.problemSlug)).toBe(true);
      expect(getGuideBySlug(guide.metadata.slug)).toBe(guide);
    }
  });

  it('every embedded widget id exists in the widget registry', () => {
    const widgetIds = registryWidgetIds();
    expect(widgetIds.size).toBeGreaterThan(40);
    for (const guide of guides) {
      for (const block of guide.sections.flatMap((s) => s.blocks)) {
        if (block.type === 'widget') {
          expect(widgetIds.has(block.widgetId), `${guide.metadata.slug}: ${block.widgetId}`).toBe(true);
        }
      }
    }
  });

  it('section and block ids are unique within each guide', () => {
    for (const guide of guides) {
      const sectionIds = guide.sections.map((s) => s.id);
      expect(new Set(sectionIds).size).toBe(sectionIds.length);
      const blockIds = guide.sections.flatMap((s) => s.blocks.map((b) => b.id));
      expect(new Set(blockIds).size).toBe(blockIds.length);
    }
  });

  it('every guide has SEO metadata and FAQ entries', () => {
    for (const guide of guides) {
      const { seoTitle, description, keywords, publishedAt, updatedAt } = guide.metadata;
      expect(seoTitle.length).toBeGreaterThan(20);
      expect(description.length).toBeGreaterThan(80);
      expect(keywords.length).toBeGreaterThanOrEqual(3);
      expect(Number.isNaN(Date.parse(publishedAt))).toBe(false);
      expect(Number.isNaN(Date.parse(updatedAt))).toBe(false);
      expect(guide.faq.length).toBeGreaterThanOrEqual(3);
      expect(guide.sections.length).toBeGreaterThanOrEqual(5);
    }
  });
});
