import { getStepsForProblem } from '@/lib/problem-steps';
import { getSolution, type ExpertSolution } from '@/lib/solutions';

const MAX_CHUNKS = 4;

type ScoredChunk = {
  text: string;
  score: number;
};

const PHASE_TAG_PRIORITIES: Record<string, string[]> = {
  requirements: ['requirements', 'capacity'],
  hld: ['api-design', 'data-model', 'availability'],
  lld: ['data-model', 'consistency', 'caching'],
  tradeoffs: ['tradeoffs'],
  scalability: ['sharding', 'caching', 'capacity', 'availability'],
};

function parseStageId(stageId: string): { phaseKey: string; index: number } | null {
  const match = stageId.match(/^(.+)-(\d+)$/);
  if (!match) {
    return null;
  }

  return {
    phaseKey: match[1],
    index: Number(match[2]),
  };
}

function getStagePrompt(problemSlug: string, stageId: string): string | null {
  const parsed = parseStageId(stageId);
  if (!parsed) {
    return null;
  }

  const steps = getStepsForProblem(problemSlug);
  const step = steps?.[parsed.phaseKey]?.[parsed.index];
  return step?.prompt ?? null;
}

function phaseTagScore(tags: string[], phaseKey: string): number {
  const priorities = PHASE_TAG_PRIORITIES[phaseKey] ?? [];
  return priorities.filter((tag) => tags.includes(tag)).length;
}

function buildSolutionChunks(
  solution: ExpertSolution,
  phaseKey: string,
  stageIndex: number | null
): ScoredChunk[] {
  const chunks: ScoredChunk[] = [];
  const isFunctionalReqs = phaseKey === 'requirements' && stageIndex === 0;
  const isNonFunctionalReqs = phaseKey === 'requirements' && stageIndex === 1;

  chunks.push({
    text: `Overview: ${solution.overview}`,
    score: phaseTagScore(['requirements', 'tradeoffs'], phaseKey) + (isFunctionalReqs ? -2 : 0),
  });

  if (solution.requirements) {
    chunks.push({
      text: `Expert functional requirements:\n- ${solution.requirements.functional.join('\n- ')}`,
      score:
        phaseTagScore(['requirements'], phaseKey) +
        2 +
        (isFunctionalReqs ? 4 : 0) +
        (isNonFunctionalReqs ? -4 : 0),
    });
    const nfrChunk: ScoredChunk = {
      text: `Expert non-functional requirements:\n- ${solution.requirements.nonFunctional.join('\n- ')}`,
      score:
        phaseTagScore(['requirements', 'capacity', 'availability'], phaseKey) +
        1 +
        (isNonFunctionalReqs ? 4 : 0) +
        (isFunctionalReqs ? -20 : 0),
    };
    // On Functional Requirements, exclude NFR / redirect-latency gold entirely.
    if (!isFunctionalReqs) {
      chunks.push(nfrChunk);
    }
  }

  chunks.push({
    text: `Components:\n${solution.components.map((component) => `- ${component.name}: ${component.description}`).join('\n')}`,
    score:
      phaseTagScore(['api-design', 'data-model', 'availability'], phaseKey) +
      (isFunctionalReqs ? -3 : 0),
  });

  chunks.push({
    text: `Data flow:\n- ${solution.dataFlow.join('\n- ')}`,
    score:
      phaseTagScore(['data-model', 'queues', 'consistency'], phaseKey) +
      (isFunctionalReqs ? -3 : 0),
  });

  chunks.push({
    text: `Tradeoffs — Pros: ${solution.tradeoffs.pros.join('; ')}. Cons: ${solution.tradeoffs.cons.join('; ')}`,
    score: phaseTagScore(['tradeoffs'], phaseKey) + 2 + (isFunctionalReqs ? -5 : 0),
  });

  return chunks;
}

function boostForSkillFocus(text: string, skillFocus: string[]): number {
  if (skillFocus.length === 0) {
    return 0;
  }

  const normalized = text.toLowerCase();
  return skillFocus.filter((skillId) => {
    const spaced = skillId.replace(/-/g, ' ');
    return normalized.includes(skillId) || normalized.includes(spaced);
  }).length;
}

export function retrieveGold(args: {
  problemSlug: string;
  stageId: string;
  skillFocus: string[];
}): { chunks: string[] } {
  const { problemSlug, stageId, skillFocus } = args;
  const parsed = parseStageId(stageId);
  const phaseKey = parsed?.phaseKey ?? '';
  const stageIndex = parsed?.index ?? null;
  const chunks: string[] = [];

  const stagePrompt = getStagePrompt(problemSlug, stageId);
  if (stagePrompt) {
    chunks.push(`Stage prompt: ${stagePrompt}`);
  }

  const solution = getSolution(problemSlug);
  if (solution) {
    const ranked = buildSolutionChunks(solution, phaseKey, stageIndex)
      .map((chunk) => ({
        ...chunk,
        score: chunk.score + boostForSkillFocus(chunk.text, skillFocus),
      }))
      .filter((chunk) => chunk.score > -10)
      .sort((left, right) => right.score - left.score);

    for (const chunk of ranked) {
      if (chunks.length >= MAX_CHUNKS) {
        break;
      }
      chunks.push(chunk.text);
    }
  }

  return { chunks: chunks.slice(0, MAX_CHUNKS) };
}
