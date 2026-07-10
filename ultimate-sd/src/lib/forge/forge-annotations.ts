import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { ParsedFeedback } from '@/types';
import { findFrameElement } from './frame-manager';

export type SchematicAnnotationMetadata = {
  type: 'schematic-annotation';
  stepId: string;
  kind: 'strength' | 'weakness' | 'missed';
};

export function isSchematicAnnotation(element: ExcalidrawElement): boolean {
  return (element.customData as SchematicAnnotationMetadata | undefined)?.type === 'schematic-annotation';
}

export function stripAnnotationsForStep(
  elements: readonly ExcalidrawElement[],
  stepId: string
): ExcalidrawElement[] {
  return elements.filter((el) => {
    const meta = el.customData as SchematicAnnotationMetadata | undefined;
    return meta?.type !== 'schematic-annotation' || meta.stepId !== stepId;
  });
}

/** Build Figma-style comment pins for feedback inside a frame. */
export function buildFeedbackAnnotations(
  elements: readonly ExcalidrawElement[],
  frameId: string,
  stepId: string,
  feedback: ParsedFeedback
): ExcalidrawElement[] {
  const frame = findFrameElement(elements, frameId);
  if (!frame) return [];

  const pins: { text: string; kind: SchematicAnnotationMetadata['kind']; color: string }[] = [];
  for (const s of feedback.strengths ?? []) {
    pins.push({ text: `✓ ${s}`, kind: 'strength', color: '#16a34a' });
  }
  for (const w of feedback.weaknesses ?? []) {
    pins.push({ text: `△ ${w}`, kind: 'weakness', color: '#d97706' });
  }
  for (const m of feedback.missed ?? []) {
    pins.push({ text: `• ${m}`, kind: 'missed', color: '#64748b' });
  }

  const frameRight = frame.x + (frame.width ?? 920);
  const pinWidth = 280;
  const x = Math.max(frame.x + 16, frameRight - pinWidth - 16);
  let y = frame.y + 72;

  const skeleton = pins.flatMap((pin) => {
    const row = {
      type: 'rectangle' as const,
      x,
      y,
      width: pinWidth,
      height: 28,
      strokeColor: pin.color,
      backgroundColor: `${pin.color}18`,
      fillStyle: 'solid' as const,
      roundness: { type: 3 as const },
      opacity: 95,
      locked: true,
      customData: { type: 'schematic-annotation', stepId, kind: pin.kind } satisfies SchematicAnnotationMetadata,
    };
    const label = {
      type: 'text' as const,
      x: x + 8,
      y: y + 6,
      text: pin.text.length > 48 ? `${pin.text.slice(0, 45)}…` : pin.text,
      fontSize: 11,
      strokeColor: pin.color,
      opacity: 100,
      locked: true,
      customData: { type: 'schematic-annotation', stepId, kind: pin.kind } satisfies SchematicAnnotationMetadata,
    };
    y += 34;
    return [row, label];
  });

  return convertToExcalidrawElements(skeleton, { regenerateIds: true });
}

export function mergeFeedbackAnnotations(
  elements: readonly ExcalidrawElement[],
  frameId: string,
  stepId: string,
  feedback: ParsedFeedback
): ExcalidrawElement[] {
  const stripped = stripAnnotationsForStep(elements, stepId);
  const annotations = buildFeedbackAnnotations(stripped, frameId, stepId, feedback);
  return [...stripped, ...annotations];
}
