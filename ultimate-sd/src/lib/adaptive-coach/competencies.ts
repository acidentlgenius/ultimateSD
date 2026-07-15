export const COMPETENCY_IDS = [
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
] as const;

export type CompetencyId = (typeof COMPETENCY_IDS)[number];

export function isCompetencyId(id: string): boolean {
  return (COMPETENCY_IDS as readonly string[]).includes(id);
}
