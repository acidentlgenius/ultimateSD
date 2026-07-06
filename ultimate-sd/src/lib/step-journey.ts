import { StepData, SystemDesignProblem } from '@/types';
import { DEFAULT_PHASE_STEPS, GENERIC_OOD_PHASE_STEPS } from './steps';
import { PROBLEM_TAG_IDS } from './problem-tags';

/** Architecture / data-flow steps that should show the diagram canvas. */
const DIAGRAM_SUB_STEPS = new Set([
  'architecture',
  'data-flow',
  'data_flow',
  'diagram',
  'hld',
  'high-level',
]);

const HLD_PHASE_KEYS = new Set(['hld', 'architecture']);
const LLD_PHASE_KEYS = new Set(['lld', 'deep_dive', 'deep-dive']);

const HLD_SUB_STEP_ALIASES: Record<string, string> = {
  architecture: 'architecture',
  diagram: 'architecture',
  hld: 'architecture',
  'high-level': 'architecture',
  api: 'api',
  'data-model': 'data-model',
  schema: 'data-model',
  metadata: 'data-model',
};

const LLD_SUB_STEP_ALIASES: Record<string, string> = {
  components: 'components',
  core_components: 'components',
  'data-flow': 'data-flow',
  data_flow: 'data-flow',
};

const REQUIREMENTS_SUB_STEP_ALIASES: Record<string, string> = {
  functional: 'functional',
  core: 'functional',
  features: 'functional',
  problem: 'functional',
  api: 'functional',
  'core features': 'functional',
  'non-functional': 'non-functional',
  scale: 'non-functional',
  capacity: 'non-functional',
  constraints: 'constraints',
};

export function resolvePhaseSteps(
  steps: Record<string, StepData[]> | undefined,
  fallback: Record<string, StepData[]>
): Record<string, StepData[]> {
  return steps ? { ...fallback, ...steps } : fallback;
}

/** Picks the OOD-flavored generic template for oop-design tagged problems, else the default. */
export function getGenericFallbackSteps(problem: SystemDesignProblem): Record<string, StepData[]> {
  const tagIds = PROBLEM_TAG_IDS[problem.slug];
  return tagIds?.includes('oop-design') ? GENERIC_OOD_PHASE_STEPS : DEFAULT_PHASE_STEPS;
}

export function getPhaseKeys(phaseSteps: Record<string, StepData[]>): string[] {
  return Object.keys(phaseSteps);
}

export function resolveEffectivePhase(
  currentPhase: string,
  phaseKeys: string[]
): string {
  if (phaseKeys.length === 0) return currentPhase;
  return phaseKeys.includes(currentPhase) ? currentPhase : phaseKeys[0];
}

export function clampStepIndex(stepIndex: number, stepsInPhase: number): number {
  if (stepsInPhase <= 0) return 0;
  return Math.min(Math.max(0, stepIndex), stepsInPhase - 1);
}

export function buildStepKey(phaseKey: string, stepIndex: number): string {
  return `${phaseKey}-${stepIndex}`;
}

export function isDiagramSubStep(subStep: string): boolean {
  return DIAGRAM_SUB_STEPS.has(subStep.toLowerCase());
}

export function isFirstJourneyStep(
  phaseKey: string,
  stepIndex: number,
  phaseKeys: string[]
): boolean {
  return phaseKeys[0] === phaseKey && stepIndex === 0;
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, '');
}

function phaseLabelLooksLikeHld(phaseLabel: string): boolean {
  const normalized = normalizeToken(phaseLabel);
  return (
    normalized.includes('hld') ||
    normalized.includes('architecture') ||
    normalized.includes('highleveldesign') ||
    normalized === 'systemarchitecture'
  );
}

function phaseLabelLooksLikeLld(phaseLabel: string): boolean {
  const normalized = normalizeToken(phaseLabel);
  return (
    normalized.includes('lld') ||
    normalized.includes('deepdive') ||
    normalized.includes('lowleveldesign')
  );
}

function phaseLabelLooksLikeRequirements(phaseLabel: string): boolean {
  return normalizeToken(phaseLabel).includes('requirement');
}

/** Map runtime phase keys / labels to evaluation guide phase keys. */
export function resolveEvaluationPhaseKey(
  phaseKey: string | undefined,
  phaseLabel: string
): 'requirements' | 'hld' | 'lld' | 'tradeoffs' | 'scalability' | null {
  const key = (phaseKey ?? '').toLowerCase();
  if (key === 'requirements') return 'requirements';
  if (HLD_PHASE_KEYS.has(key)) return 'hld';
  if (LLD_PHASE_KEYS.has(key)) return 'lld';
  if (key === 'tradeoffs' || key === 'trade-offs') return 'tradeoffs';
  if (key === 'scalability') return 'scalability';

  if (phaseLabelLooksLikeRequirements(phaseLabel)) return 'requirements';
  if (phaseLabelLooksLikeHld(phaseLabel)) return 'hld';
  if (phaseLabelLooksLikeLld(phaseLabel)) return 'lld';
  if (normalizeToken(phaseLabel).includes('tradeoff')) return 'tradeoffs';
  if (normalizeToken(phaseLabel).includes('scalability')) return 'scalability';

  return null;
}

/** Map step subStep values to evaluation guide sub-step keys when possible. */
export function resolveEvaluationSubStepKey(
  evaluationPhase: ReturnType<typeof resolveEvaluationPhaseKey>,
  subStep: string
): string {
  const normalized = subStep.toLowerCase();

  if (evaluationPhase === 'hld') {
    return HLD_SUB_STEP_ALIASES[normalized] ?? normalized;
  }
  if (evaluationPhase === 'lld') {
    return LLD_SUB_STEP_ALIASES[normalized] ?? normalized;
  }
  if (evaluationPhase === 'requirements') {
    return REQUIREMENTS_SUB_STEP_ALIASES[normalized] ?? normalized;
  }

  return normalized;
}

export function phaseIncludesDiagram(phaseKey: string): boolean {
  const key = phaseKey.toLowerCase();
  return HLD_PHASE_KEYS.has(key) || LLD_PHASE_KEYS.has(key);
}

export function getDiagramStepKeysForProblem(
  phaseSteps: Record<string, StepData[]>
): string[] {
  const keys: string[] = [];
  for (const [phaseKey, steps] of Object.entries(phaseSteps)) {
    steps.forEach((step, index) => {
      if (isDiagramSubStep(step.subStep)) {
        keys.push(buildStepKey(phaseKey, index));
      }
    });
  }
  return keys;
}
