import type { ExcalidrawScene } from '@/types/diagram';
import type { ForgeSessionState, SeniorityLevel } from './types';

const SESSION_KEY_PREFIX = 'forge-session-';
const FORMAT_VERSION = 1;

function storageKey(problemSlug: string): string {
  return `${SESSION_KEY_PREFIX}${problemSlug}`;
}

export function createForgeSessionId(): string {
  return `forge-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadForgeSession(problemSlug: string): ForgeSessionState | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(storageKey(problemSlug));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ForgeSessionState & { formatVersion?: number };
    if (parsed.formatVersion !== FORMAT_VERSION || parsed.problemSlug !== problemSlug) {
      localStorage.removeItem(storageKey(problemSlug));
      return null;
    }
    return normalizeForgeSession(parsed);
  } catch {
    localStorage.removeItem(storageKey(problemSlug));
    return null;
  }
}

export function saveForgeSession(state: ForgeSessionState): void {
  if (typeof window === 'undefined') return;
  const payload = { ...state, formatVersion: FORMAT_VERSION, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(storageKey(state.problemSlug), JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to save forge session:', err);
  }
}

export function clearForgeSession(problemSlug: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(storageKey(problemSlug));
}

export function initForgeSession(
  problemSlug: string,
  seniority: SeniorityLevel = 'intermediate'
): ForgeSessionState {
  return {
    sessionId: createForgeSessionId(),
    problemSlug,
    seniority,
    seniorityCalibrated: false,
    activeStepIndex: 0,
    completedStepIds: [],
    immersionComplete: false,
    scene: null,
    stepScores: {},
    sessionComplete: false,
    updatedAt: new Date().toISOString(),
  };
}

function isExcalidrawScene(value: unknown): value is ExcalidrawScene {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as ExcalidrawScene).type === 'excalidraw' &&
    Array.isArray((value as ExcalidrawScene).elements)
  );
}

/** Prefer local scene; fall back to server practice-session snapshot. */
export function resolveForgeInitialScene(
  session: ForgeSessionState,
  serverSnapshot: unknown
): ExcalidrawScene | null {
  if (session.scene && session.scene.elements.some((el) => !el.isDeleted)) {
    return session.scene;
  }
  if (isExcalidrawScene(serverSnapshot)) {
    return serverSnapshot;
  }
  if (serverSnapshot && typeof serverSnapshot === 'object') {
    const nested = (serverSnapshot as { scene?: unknown }).scene;
    if (isExcalidrawScene(nested)) return nested;
  }
  return null;
}

/** Backfill fields added after older persisted sessions. */
export function normalizeForgeSession(state: ForgeSessionState): ForgeSessionState {
  return {
    ...state,
    seniorityCalibrated: state.seniorityCalibrated ?? false,
    stepScores: state.stepScores ?? {},
    sessionComplete: state.sessionComplete ?? false,
  };
}

export function updateForgeScene(
  state: ForgeSessionState,
  scene: ExcalidrawScene
): ForgeSessionState {
  return { ...state, scene, updatedAt: new Date().toISOString() };
}
