import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEffect, useState } from 'react';
import { render, waitFor, act } from '@testing-library/react';
import DiagramCanvas from '../DiagramCanvas';
import { DiagramCanvasProvider, useDiagramCanvasRef } from '../diagram/DiagramCanvasContext';

const RESTORE_GUARD_MS = 300;
const SAVE_DEBOUNCE_MS = 1000;
let mockEmitEmptyOnChange = false;
/** When true, the mock shows content first, then simulates the user deleting everything. */
let mockDeleteAllAfterFirstChange = false;
let mockUpdateScene = vi.fn();

function MockExcalidraw({
  excalidrawAPI,
  onChange,
}: {
  excalidrawAPI?: (api: unknown) => void;
  onChange?: (elements: unknown[], appState: object, files: object) => void;
}) {
  useEffect(() => {
    const element = { id: '1', type: 'rectangle', isDeleted: false };
    let deleted = false;
    mockUpdateScene = vi.fn();
    const currentElements = () => (mockEmitEmptyOnChange || deleted ? [] : [element]);
    const api = {
      getSceneElements: currentElements,
      getAppState: () => ({ theme: 'light' }),
      getFiles: () => ({}),
      updateScene: mockUpdateScene,
      resetScene: vi.fn(),
      addFiles: vi.fn(),
    };
    excalidrawAPI?.(api);

    const afterGuard = window.setTimeout(() => {
      onChange?.(currentElements(), { theme: 'light' }, {});
    }, RESTORE_GUARD_MS + 50);

    let deleteTimer: number | undefined;
    if (mockDeleteAllAfterFirstChange) {
      deleteTimer = window.setTimeout(() => {
        deleted = true;
        onChange?.([], { theme: 'light' }, {});
      }, RESTORE_GUARD_MS + 50 + SAVE_DEBOUNCE_MS + 100);
    }

    return () => {
      window.clearTimeout(afterGuard);
      if (deleteTimer) window.clearTimeout(deleteTimer);
    };
  }, [excalidrawAPI, onChange]);
  return <div data-testid="excalidraw-mock" />;
}

vi.mock('next/dynamic', () => ({
  default: (_loader: unknown, opts?: { ssr?: boolean }) => {
    void opts;
    return MockExcalidraw;
  },
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

function RefProbe() {
  const ref = useDiagramCanvasRef();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setInterval(() => {
      if (ref.current?.getScene()) {
        setReady(true);
        window.clearInterval(id);
      }
    }, 25);
    return () => window.clearInterval(id);
  }, [ref]);
  return <div data-testid="scene-ready">{ready ? 'ready' : 'pending'}</div>;
}

describe('DiagramCanvas', () => {
  beforeEach(() => {
    mockEmitEmptyOnChange = false;
    mockDeleteAllAfterFirstChange = false;
    mockUpdateScene = vi.fn();
    localStorage.clear();
    localStorage.setItem('saved-design-old', JSON.stringify({ name: 'legacy' }));
  });

  it('registers context ref after mount and purges legacy design keys', async () => {
    render(
      <DiagramCanvasProvider>
        <DiagramCanvas stepKey="hld-0" isVisible />
        <RefProbe />
      </DiagramCanvasProvider>
    );

    await waitFor(() => {
      expect(localStorage.getItem('saved-design-old')).toBeNull();
    });

    await waitFor(() => {
      expect(document.querySelector('[data-testid="scene-ready"]')?.textContent).toBe('ready');
    });
  });

  it('removes legacy diagram format on load', async () => {
    localStorage.setItem(
      'diagram-hld-0',
      JSON.stringify({ elements: [{ type: 'loadbalancer' }] })
    );

    render(
      <DiagramCanvasProvider>
        <DiagramCanvas stepKey="hld-0" />
      </DiagramCanvasProvider>
    );

    await waitFor(() => {
      expect(localStorage.getItem('diagram-hld-0')).toBeNull();
    });
  });

  it('persists scene to localStorage on change and flushes on unmount', async () => {
    vi.useFakeTimers();

    const { unmount } = render(
      <DiagramCanvasProvider>
        <DiagramCanvas stepKey="hld-0" isVisible />
      </DiagramCanvasProvider>
    );

    await act(async () => { await vi.advanceTimersByTimeAsync(RESTORE_GUARD_MS + 50 + SAVE_DEBOUNCE_MS); });

    const raw = localStorage.getItem('diagram-hld-0');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).format).toBe('excalidraw');

    act(() => { unmount(); });

    expect(localStorage.getItem('diagram-hld-0')).toBeTruthy();

    vi.useRealTimers();
  });

  it('does not overwrite restored diagram when Excalidraw emits an empty scene', async () => {
    vi.useFakeTimers();

    const savedScene = {
      format: 'excalidraw' as const,
      formatVersion: 1,
      stepKey: 'hld-0',
      scene: {
        type: 'excalidraw' as const,
        version: 2,
        elements: [{ id: 'saved-1', type: 'rectangle', isDeleted: false }],
        appState: { theme: 'light' },
        files: {},
      },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('diagram-hld-0', JSON.stringify(savedScene));
    mockEmitEmptyOnChange = true;

    render(
      <DiagramCanvasProvider>
        <DiagramCanvas stepKey="hld-0" isVisible />
      </DiagramCanvasProvider>
    );

    await act(async () => { await vi.advanceTimersByTimeAsync(RESTORE_GUARD_MS + 50 + SAVE_DEBOUNCE_MS + 500); });

    const raw = localStorage.getItem('diagram-hld-0');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.format).toBe('excalidraw');
    expect(parsed.scene.elements).toHaveLength(1);
    expect(parsed.scene.elements[0].id).toBe('saved-1');

    vi.useRealTimers();
  });

  it('persists a deliberate delete-all so the cleared canvas stays cleared (regression)', async () => {
    vi.useFakeTimers();
    mockDeleteAllAfterFirstChange = true;

    render(
      <DiagramCanvasProvider>
        <DiagramCanvas stepKey="hld-0" isVisible />
      </DiagramCanvasProvider>
    );

    // First onChange (content) + debounce → saved
    await act(async () => { await vi.advanceTimersByTimeAsync(RESTORE_GUARD_MS + 50 + SAVE_DEBOUNCE_MS); });
    expect(localStorage.getItem('diagram-hld-0')).toBeTruthy();

    // Delete-all onChange + debounce → storage cleared, old scene must not resurrect
    await act(async () => { await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS + 200 + SAVE_DEBOUNCE_MS); });
    expect(localStorage.getItem('diagram-hld-0')).toBeNull();

    vi.useRealTimers();
  });

  it('restores pending scene via updateScene when api binds empty', async () => {
    const savedScene = {
      format: 'excalidraw' as const,
      formatVersion: 1,
      stepKey: 'hld-0',
      scene: {
        type: 'excalidraw' as const,
        version: 2,
        elements: [{ id: 'saved-1', type: 'rectangle', isDeleted: false }],
        appState: { theme: 'light' },
        files: {},
      },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('diagram-hld-0', JSON.stringify(savedScene));
    mockEmitEmptyOnChange = true;

    render(
      <DiagramCanvasProvider>
        <DiagramCanvas stepKey="hld-0" isVisible />
      </DiagramCanvasProvider>
    );

    await waitFor(() => {
      expect(mockUpdateScene).toHaveBeenCalled();
    });
  });
});
