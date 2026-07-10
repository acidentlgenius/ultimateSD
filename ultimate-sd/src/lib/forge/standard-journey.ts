import type { SystemDesignProblem } from '@/types';
import type { ForgeJourneyStep } from './types';
import { applyForgeProblemOverrides } from './forge-problem-content';

/** Canonical 6-frame interview journey from the DesignForge spec. */
const STANDARD_FRAME_DEFS: Omit<ForgeJourneyStep, 'stepId' | 'stepIndex' | 'frameId'>[] = [
  {
    title: 'Functional Requirements',
    phase: 'Requirements',
    phaseKey: 'requirements',
    subStep: 'functional',
    theme: 'blue',
    idealMinutes: [8, 15],
    prompt: 'What should this system let users do? List prioritized requirements (P0/P1).',
    objectives: ['Identify core user actions', 'Prioritize with P0/P1 labels', 'Stay in scope'],
    pitfalls: ['Jumping to APIs before clarifying scope', 'Listing implementation details'],
  },
  {
    title: 'Non-Functional Requirements',
    phase: 'Requirements',
    phaseKey: 'requirements',
    subStep: 'non-functional',
    theme: 'purple',
    idealMinutes: [10, 15],
    prompt: 'Quantify scale, latency, availability, and consistency with real numbers.',
    objectives: ['Tie NFRs to measurable targets', 'Note CAP trade-offs', 'Cover hot paths'],
    pitfalls: ['Vague targets like "fast" or "scalable"', 'Ignoring read/write ratio'],
  },
  {
    title: 'Data Model',
    phase: 'HLD',
    phaseKey: 'hld',
    subStep: 'data-model',
    theme: 'green',
    idealMinutes: [10, 15],
    prompt: 'Name core entities, fields, and relationships. Consider read/write patterns.',
    objectives: ['Name key entities', 'Show relationships', 'Match access patterns'],
    pitfalls: ['Over-normalizing too early', 'Missing hot-path entities'],
  },
  {
    title: 'API Design',
    phase: 'HLD',
    phaseKey: 'hld',
    subStep: 'api',
    theme: 'orange',
    idealMinutes: [10, 15],
    prompt: 'Define the main endpoints — method, path, request/response, and errors.',
    objectives: ['Keep the surface minimal', 'Specify auth and rate limits', 'Note idempotency'],
    pitfalls: ['Too many endpoints', 'Missing error codes on writes'],
  },
  {
    title: 'High-Level Architecture',
    phase: 'HLD',
    phaseKey: 'hld',
    subStep: 'architecture',
    theme: 'red',
    idealMinutes: [15, 25],
    prompt: 'Draw major components and how data flows between them. This is the hero frame.',
    objectives: ['Show end-to-end request path', 'Identify caches and queues', 'Call out bottlenecks'],
    pitfalls: ['Single point of failure', 'Skipping cache on read-heavy paths'],
  },
  {
    title: 'Trade-offs & Deep Dive',
    phase: 'Trade-offs',
    phaseKey: 'tradeoffs',
    subStep: 'decisions',
    theme: 'slate',
    idealMinutes: [8, 12],
    prompt: 'Pick key decisions — what you chose, alternatives rejected, and why.',
    objectives: ['State alternatives', 'Justify with numbers', 'Acknowledge downsides'],
    pitfalls: ['No alternative mentioned', 'Hand-waving without trade-offs'],
  },
];

/** Build the standard 6-frame forge journey for any problem. */
export function buildStandardForgeJourney(problem: SystemDesignProblem): ForgeJourneyStep[] {
  const steps = STANDARD_FRAME_DEFS.map((def, stepIndex) => {
    const stepId = `${def.phaseKey}-${def.subStep}`;
    return {
      ...def,
      stepId,
      stepIndex,
      frameId: `frame-${stepId}`,
    };
  });
  return applyForgeProblemOverrides(steps, problem.slug);
}

export const STANDARD_FORGE_FRAME_COUNT = STANDARD_FRAME_DEFS.length;
