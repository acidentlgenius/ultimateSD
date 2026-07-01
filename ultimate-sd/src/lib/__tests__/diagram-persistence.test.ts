import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDiagramStorageKey,
  loadDiagram,
  saveDiagram,
  pickPersistedAppState,
  resolveBestDiagramSnapshot,
  blobToDataUrl,
} from '../diagram-persistence';

const emptyScene = {
  type: 'excalidraw' as const,
  version: 2,
  elements: [],
  appState: {},
  files: { img1: { mimeType: 'image/png', id: 'img1', dataURL: 'x', created: 1, lastRetrieved: 1 } },
};

describe('diagram-persistence', () => {
  beforeEach(() => localStorage.clear());

  it('uses diagram-{stepKey} storage key', () => {
    expect(getDiagramStorageKey('hld-0')).toBe('diagram-hld-0');
  });

  it('round-trips excalidraw scene without files', () => {
    saveDiagram('hld-0', emptyScene);
    const loaded = loadDiagram('hld-0');
    expect(loaded?.format).toBe('excalidraw');
    expect(loaded?.scene.files).toEqual({});
  });

  it('removes legacy custom-canvas data on load', () => {
    localStorage.setItem(
      'diagram-hld-0',
      JSON.stringify({ elements: [{ type: 'loadbalancer' }], timestamp: 'x' })
    );
    expect(loadDiagram('hld-0')).toBeNull();
    expect(localStorage.getItem('diagram-hld-0')).toBeNull();
  });

  it('pickPersistedAppState strips selection and scroll', () => {
    const picked = pickPersistedAppState({
      theme: 'dark',
      viewBackgroundColor: '#000',
      gridSize: 20,
      selectedElementIds: { a: true },
      scrollX: 100,
    } as any);
    expect(picked.theme).toBe('dark');
    expect(picked).not.toHaveProperty('selectedElementIds');
    expect(picked).not.toHaveProperty('scrollX');
  });

  it('resolveBestDiagramSnapshot prefers savedStepData with scene', () => {
    const saved = new Map([
      ['hld-0', { diagramData: { scene: { ...emptyScene, elements: [{ id: '1', isDeleted: false } as any] } } }],
    ]);
    const result = resolveBestDiagramSnapshot(['hld-0', 'tradeoffs-0'], saved);
    expect(result?.scene?.elements).toHaveLength(1);
  });

  it('blobToDataUrl converts blob to data URL', async () => {
    const blob = new Blob(['x'], { type: 'text/plain' });
    const url = await blobToDataUrl(blob);
    expect(url).toMatch(/^data:/);
  });
});
