// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { retrieveGold } from '@/lib/adaptive-coach/rag/retrieve-gold';

describe('retrieveGold', () => {
  it('returns stage prompt and expert chunks for design-parking-lot requirements stage', () => {
    const { chunks } = retrieveGold({
      problemSlug: 'design-parking-lot',
      stageId: 'requirements-0',
      skillFocus: ['requirements'],
    });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.length).toBeLessThanOrEqual(4);
    expect(chunks[0]).toContain('Follow one car');
    expect(chunks.some((chunk) => chunk.includes('Admit a vehicle'))).toBe(true);
  });

  it('caps output at four chunks even with rich expert solutions', () => {
    const { chunks } = retrieveGold({
      problemSlug: 'design-parking-lot',
      stageId: 'hld-0',
      skillFocus: ['api-design', 'data-model'],
    });

    expect(chunks.length).toBeLessThanOrEqual(4);
    expect(chunks[0]).toContain('Stage prompt:');
  });

  it('returns only the stage prompt when no expert solution exists', () => {
    const { chunks } = retrieveGold({
      problemSlug: 'design-nonexistent-slug',
      stageId: 'requirements-0',
      skillFocus: [],
    });

    expect(chunks.length).toBeLessThanOrEqual(1);
  });

  it('keeps TinyURL FR gold on functional needs, not redirect-latency NFR', () => {
    const { chunks } = retrieveGold({
      problemSlug: 'design-tinyurl',
      stageId: 'requirements-0',
      skillFocus: [],
    });

    const joined = chunks.join('\n');
    expect(joined).toMatch(/functional requirements/i);
    expect(joined).not.toMatch(/non-functional requirements/i);
    expect(joined).not.toMatch(/Redirect < 10ms|redirect latency/i);
  });
});
