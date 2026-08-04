import { describe, expect, it } from 'vitest';
import { COMPETENCY_IDS, isCompetencyId } from '@/lib/adaptive-coach/competencies';

describe('competency taxonomy', () => {
  it('seeds twelve system-design competencies', () => {
    expect(COMPETENCY_IDS).toEqual([
      'requirements',
      'capacity',
      'api-design',
      'data-model',
      'caching',
      'consistency',
      'sharding',
      'queues',
      'availability',
      'security',
      'observability',
      'tradeoffs',
    ]);
    expect(isCompetencyId('caching')).toBe(true);
    expect(isCompetencyId('nope')).toBe(false);
  });
});
