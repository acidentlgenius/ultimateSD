import type { AppState } from '@excalidraw/excalidraw/types';
import type { ExcalidrawScene, PersistedDiagram, StepDiagramData, DiagramSnapshot } from '@/types/diagram';
import { toast } from 'sonner';
import { countActiveElements, diagramDebug } from '@/lib/diagram-debug';
import { safeLocalStorageGet } from './local-storage';

const FORMAT = 'excalidraw' as const;
const FORMAT_VERSION = 1;

const PERSISTED_APP_STATE_KEYS = ['theme', 'viewBackgroundColor', 'gridSize'] as const;

export function pickPersistedAppState(appState: Partial<AppState>): Partial<AppState> {
  const picked: Partial<AppState> = {};
  for (const key of PERSISTED_APP_STATE_KEYS) {
    if (appState[key] !== undefined) picked[key] = appState[key] as never;
  }
  return picked;
}

export function stripFilesForPersistence(scene: ExcalidrawScene): ExcalidrawScene {
  return { ...scene, files: {} };
}

export function trimSceneForDbSnapshot(scene: ExcalidrawScene): ExcalidrawScene {
  return stripFilesForPersistence({
    ...scene,
    appState: pickPersistedAppState(scene.appState),
  });
}

export function getDiagramStorageKey(stepKey: string): string {
  return `diagram-${stepKey}`;
}

export function isPersistedDiagram(value: unknown): value is PersistedDiagram {
  if (!value || typeof value !== 'object') return false;
  const v = value as PersistedDiagram;
  return v.format === FORMAT && v.formatVersion === FORMAT_VERSION && !!v.scene;
}

export function loadDiagram(stepKey: string): PersistedDiagram | null {
  const key = getDiagramStorageKey(stepKey);
  const parsed = safeLocalStorageGet<any>(key, null);

  if (!parsed) {
    diagramDebug('load:miss', { stepKey, storageKey: key });
    return null;
  }

  if (isPersistedDiagram(parsed)) {
    diagramDebug('load:hit', {
      stepKey,
      storageKey: key,
      elementCount: countActiveElements(parsed.scene.elements),
      timestamp: parsed.timestamp,
    });
    return parsed;
  }

  diagramDebug('load:invalid-format-purged', { stepKey, storageKey: key, parsedKeys: Object.keys(parsed as object) });
  localStorage.removeItem(key);
  return null;
}

export function saveDiagram(stepKey: string, scene: ExcalidrawScene): void {
  const payload: PersistedDiagram = {
    format: FORMAT,
    formatVersion: FORMAT_VERSION,
    stepKey,
    scene: stripFilesForPersistence({ ...scene, appState: pickPersistedAppState(scene.appState) }),
    timestamp: new Date().toISOString(),
  };
  try {
    localStorage.setItem(getDiagramStorageKey(stepKey), JSON.stringify(payload));
    diagramDebug('save:ok', {
      stepKey,
      storageKey: getDiagramStorageKey(stepKey),
      elementCount: countActiveElements(payload.scene.elements),
      byteLength: JSON.stringify(payload).length,
      reason: 'persist',
    });
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.code === 22);
    if (isQuota) {
      toast.error('Diagram could not be saved — browser storage is full. Export your work.');
    } else {
      console.warn('diagram save failed', err);
    }
  }
}

export function clearDiagram(stepKey: string): void {
  localStorage.removeItem(getDiagramStorageKey(stepKey));
}

export function purgeLegacyDesignKeys(): void {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith('saved-design')) {
      localStorage.removeItem(k);
    }
  }
}

/** Pick richest diagram across diagram step keys — for session complete / PDF when canvas hidden */
export function resolveBestDiagramSnapshot(
  diagramStepKeys: string[],
  savedStepData: Map<string, { diagramData?: StepDiagramData | null }>
): DiagramSnapshot | null {
  let best: DiagramSnapshot | null = null;
  let bestScore = -1;

  const score = (data: StepDiagramData | PersistedDiagram | null): number => {
    if (!data) return -1;
    const scene = 'scene' in data && data.scene ? data.scene : (data as PersistedDiagram).scene;
    const count = scene?.elements?.filter((el) => !el.isDeleted).length ?? 0;
    const ts = 'timestamp' in data && data.timestamp ? Date.parse(data.timestamp) : 0;
    return count * 1000 + ts;
  };

  for (const key of diagramStepKeys) {
    const fromStep = savedStepData.get(key)?.diagramData;
    if (fromStep?.scene || fromStep?.imageData) {
      const s = score(fromStep);
      if (s > bestScore) {
        bestScore = s;
        best = { scene: fromStep.scene, imageData: fromStep.imageData, description: fromStep.description ?? undefined, timestamp: fromStep.timestamp };
      }
    }
    const fromStorage = loadDiagram(key);
    if (fromStorage) {
      const s = score(fromStorage);
      if (s > bestScore) {
        bestScore = s;
        best = { scene: fromStorage.scene, description: undefined, timestamp: fromStorage.timestamp };
      }
    }
  }
  return best;
}

/** Convert Blob to base64 data URL — for session-complete PNG storage */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Export PNG from a scene without a live canvas ref.
 * Uses static exportToBlob from @excalidraw/excalidraw.
 */
export async function exportSceneToPng(scene: ExcalidrawScene): Promise<Blob | null> {
  const elements = scene.elements.filter((el) => !el.isDeleted);
  if (elements.length === 0) return null;

  const { exportToBlob } = await import('@excalidraw/excalidraw');
  return exportToBlob({
    elements,
    appState: scene.appState,
    files: scene.files,
    mimeType: 'image/png',
  });
}
