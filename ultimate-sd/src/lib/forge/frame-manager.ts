import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import { getTextFromElements } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { ExcalidrawImperativeAPI, AppState } from '@excalidraw/excalidraw/types';
import type { SystemDesignProblem } from '@/types';
import type { ForgeJourneyStep, SeniorityLevel, SchematicFrameMetadata } from './types';
import { FRAME_THEME_COLORS, getFrameMetadata, isSchematicFrame } from './types';
import { getFrameHeightForStep, spawnFrameTemplate } from './frame-templates';
import { getForgeProblemContent } from './forge-problem-content';

const FRAME_WIDTH = 920;
const FRAME_GAP = 120;
const CONTENT_LEFT = 24;

function starterCountForSeniority(seniority: SeniorityLevel): number {
  switch (seniority) {
    case 'beginner':
      return 3;
    case 'intermediate':
      return 4;
    case 'advanced':
      return 2;
    case 'senior':
      return 1;
    case 'architect':
      return 0;
    default: {
      const _exhaustive: never = seniority;
      return _exhaustive;
    }
  }
}

function pickStarters(problem: SystemDesignProblem, step: ForgeJourneyStep, seniority: SeniorityLevel): string[] {
  const count = starterCountForSeniority(seniority);
  if (count === 0) return [];

  const content = getForgeProblemContent(problem.slug);
  const subStep = step.subStep.toLowerCase();

  if (subStep.includes('data-model') && content?.entities?.length) {
    return content.entities.slice(0, count);
  }
  if (subStep.includes('api') && content?.apiEndpoints?.length) {
    return content.apiEndpoints.slice(0, count);
  }
  if (subStep.includes('functional') || subStep === 'core' || subStep === 'features') {
    return problem.functionalRequirements.slice(0, count);
  }
  if (subStep.includes('non-functional') || subStep.includes('scale')) {
    return problem.nonFunctionalRequirements.slice(0, count);
  }
  if (subStep.includes('api')) {
    return problem.functionalRequirements.slice(0, Math.min(2, count)).map(
      (fr) => `POST/GET — ${fr.slice(0, 40)}`
    );
  }
  return [];
}

function frameYOffset(journey: ForgeJourneyStep[], stepIndex: number): number {
  let y = 0;
  for (let i = 0; i < stepIndex; i++) {
    y += getFrameHeightForStep(journey[i].subStep) + FRAME_GAP;
  }
  return y;
}

/** Spawn all journey frames on the canvas, with ghost outlines for future steps. */
export function spawnSessionFrames(
  journey: ForgeJourneyStep[],
  problem: SystemDesignProblem,
  seniority: SeniorityLevel,
  activeStepIndex: number
): ExcalidrawElement[] {
  const allElements: ExcalidrawElement[] = [];

  for (const step of journey) {
    const isGhost = step.stepIndex > activeStepIndex;
    const yOffset = frameYOffset(journey, step.stepIndex);
    const frameHeight = getFrameHeightForStep(step.subStep);
    const color = FRAME_THEME_COLORS[step.theme];
    const starters = isGhost ? [] : pickStarters(problem, step, seniority);

    const frameMeta: SchematicFrameMetadata = {
      type: 'schematic-frame',
      stepId: step.stepId,
      stepIndex: step.stepIndex,
      theme: step.theme,
      phaseKey: step.phaseKey,
      subStep: step.subStep,
      collapsed: false,
      isGhost,
    };

    const headerSkeleton = convertToExcalidrawElements(
      [
        {
          type: 'rectangle' as const,
          id: step.frameId,
          x: 0,
          y: yOffset,
          width: FRAME_WIDTH,
          height: frameHeight,
          strokeColor: color,
          backgroundColor: isGhost ? 'transparent' : `${color}14`,
          fillStyle: 'solid' as const,
          strokeWidth: isGhost ? 1 : 3,
          roundness: { type: 3 as const },
          opacity: isGhost ? 25 : 100,
          locked: true,
          customData: frameMeta,
        },
        {
          type: 'text' as const,
          x: CONTENT_LEFT,
          y: yOffset + 16,
          text: `STEP ${step.stepIndex + 1} OF ${journey.length} · ${step.title.toUpperCase()}`,
          fontSize: 18,
          strokeColor: color,
          opacity: isGhost ? 30 : 100,
        },
        {
          type: 'text' as const,
          x: CONTENT_LEFT,
          y: yOffset + 48,
          text: step.prompt,
          fontSize: 14,
          strokeColor: '#64748b',
          opacity: isGhost ? 25 : 90,
        },
      ],
      { regenerateIds: false }
    );

    const templateElements = isGhost
      ? []
      : spawnFrameTemplate({
          problem,
          step,
          seniority,
          yOffset,
          frameHeight,
          color,
          isGhost,
          starters,
        });

    allElements.push(...headerSkeleton, ...templateElements);
  }

  return allElements;
}

export function findFrameElement(
  elements: readonly ExcalidrawElement[],
  frameId: string
): ExcalidrawElement | undefined {
  return elements.find((el) => el.id === frameId && isSchematicFrame(el));
}

export function extractFrameText(
  elements: readonly ExcalidrawElement[],
  frameId: string
): string {
  const frame = findFrameElement(elements, frameId);
  if (!frame) return '';

  const frameTop = frame.y;
  const frameBottom = frame.y + (frame.height ?? 380);
  const frameLeft = frame.x;
  const frameRight = frame.x + (frame.width ?? FRAME_WIDTH);

  const inFrame = elements.filter((el) => {
    if (el.id === frameId || el.isDeleted) return false;
    const meta = el.customData as { type?: string } | undefined;
    if (meta?.type === 'schematic-annotation') return false;
    return (
      el.x >= frameLeft - 4 &&
      el.x <= frameRight + 4 &&
      el.y >= frameTop &&
      el.y <= frameBottom
    );
  });

  return getTextFromElements(inFrame).trim();
}

export function extractSelectionText(
  elements: readonly ExcalidrawElement[],
  selectedElementIds: AppState['selectedElementIds']
): string {
  const ids = Object.keys(selectedElementIds).filter((id) => selectedElementIds[id]);
  if (ids.length === 0) return '';

  const selected = elements.filter((el) => ids.includes(el.id) && !el.isDeleted);
  return getTextFromElements(selected).trim();
}

export function focusFrame(api: ExcalidrawImperativeAPI, frameId: string): void {
  const elements = api.getSceneElements();
  const frame = findFrameElement(elements, frameId);
  if (!frame) return;

  api.scrollToContent([frame], { animate: true, fitToViewport: true });
  api.updateScene({
    appState: {
      selectedElementIds: { [frameId]: true },
    },
  });
}

export function setFrameGhostState(
  elements: readonly ExcalidrawElement[],
  frameId: string,
  isGhost: boolean
): ExcalidrawElement[] {
  return elements.map((el) => {
    const meta = getFrameMetadata(el);
    if (el.id === frameId && meta) {
      const color = FRAME_THEME_COLORS[meta.theme];
      return {
        ...el,
        opacity: isGhost ? 25 : 100,
        strokeWidth: isGhost ? 1 : 3,
        backgroundColor: isGhost ? 'transparent' : `${color}14`,
        customData: { ...meta, isGhost },
      };
    }
    return el;
  });
}

export function activateNextFrame(
  elements: readonly ExcalidrawElement[],
  completedFrameId: string,
  nextFrameId: string | null
): ExcalidrawElement[] {
  let updated = setFrameGhostState(elements, completedFrameId, false);
  if (nextFrameId) {
    updated = setFrameGhostState(updated, nextFrameId, false);
  }
  return updated;
}
