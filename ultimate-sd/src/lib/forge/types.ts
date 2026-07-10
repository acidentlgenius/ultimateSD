import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { ExcalidrawScene } from '@/types/diagram';
import type { ParsedFeedback } from '@/types';

export type SeniorityLevel = 'beginner' | 'intermediate' | 'advanced' | 'senior' | 'architect';

export type FrameTheme = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'slate';

export const FRAME_THEME_COLORS: Record<FrameTheme, string> = {
  blue: '#3B82F6',
  purple: '#8B5CF6',
  green: '#10B981',
  orange: '#F59E0B',
  red: '#EF4444',
  slate: '#64748B',
};

export type SchematicFrameMetadata = {
  type: 'schematic-frame';
  stepId: string;
  stepIndex: number;
  theme: FrameTheme;
  phaseKey: string;
  subStep: string;
  collapsed: boolean;
  isGhost: boolean;
};

export type ForgeJourneyStep = {
  stepId: string;
  stepIndex: number;
  frameId: string;
  title: string;
  phase: string;
  phaseKey: string;
  subStep: string;
  theme: FrameTheme;
  idealMinutes: [number, number];
  objectives: string[];
  pitfalls: string[];
  prompt: string;
};

export type ForgeSessionState = {
  formatVersion?: number;
  sessionId: string;
  problemSlug: string;
  seniority: SeniorityLevel;
  seniorityCalibrated: boolean;
  activeStepIndex: number;
  completedStepIds: string[];
  immersionComplete: boolean;
  scene: ExcalidrawScene | null;
  stepScores: Record<string, number>;
  sessionComplete: boolean;
  updatedAt: string;
};

export type ForgeCanvasHandle = {
  getScene(): ExcalidrawScene | null;
  focusFrame(frameId: string): void;
  getFrameText(frameId: string): string;
  getSelectionText(): string;
  loadScene(scene: ExcalidrawScene): void;
  activateFrameTransition(completedFrameId: string, nextFrameId: string | null): void;
  applyFeedbackAnnotations(frameId: string, stepId: string, feedback: ParsedFeedback): void;
  exportPng(): Promise<Blob | null>;
};

export function isSchematicFrame(element: ExcalidrawElement): boolean {
  const data = element.customData as SchematicFrameMetadata | undefined;
  return data?.type === 'schematic-frame';
}

export function getFrameMetadata(element: ExcalidrawElement): SchematicFrameMetadata | null {
  const data = element.customData as SchematicFrameMetadata | undefined;
  return data?.type === 'schematic-frame' ? data : null;
}
