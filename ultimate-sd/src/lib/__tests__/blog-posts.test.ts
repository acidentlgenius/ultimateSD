import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: { blogPost: {} } }));

import { slugify, estimateReadingTime } from '../blog-posts';

describe('slugify', () => {
  it('lowercases, strips punctuation, and hyphenates', () => {
    expect(slugify('Designing TinyURL: A Deep Dive!')).toBe('designing-tinyurl-a-deep-dive');
  });

  it('collapses repeated whitespace and hyphens', () => {
    expect(slugify('  Load   Balancing -- 101  ')).toBe('load-balancing-101');
  });
});

describe('estimateReadingTime', () => {
  it('returns 1 for empty content', () => {
    expect(estimateReadingTime(null)).toBe(1);
    expect(estimateReadingTime({ type: 'doc', content: [] })).toBe(1);
  });

  it('counts words across nested text nodes and divides by 200wpm', () => {
    const words = Array.from({ length: 400 }, () => 'word').join(' ');
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: words }] },
      ],
    };
    expect(estimateReadingTime(doc)).toBe(2);
  });
});
