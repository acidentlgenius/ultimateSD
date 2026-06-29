import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEffect, useState } from 'react';
import { render, waitFor } from '@testing-library/react';
import DiagramCanvas from '../DiagramCanvas';
import { DiagramCanvasProvider, useDiagramCanvasRef } from '../diagram/DiagramCanvasContext';

function MockExcalidraw({
  excalidrawAPI,
  onChange,
}: {
  excalidrawAPI?: (api: unknown) => void;
  onChange?: (elements: unknown[], appState: object, files: object) => void;
}) {
  useEffect(() => {
    const api = {
      getSceneElements: () => [{ id: '1', type: 'rectangle', isDeleted: false }],
      getAppState: () => ({ theme: 'light' }),
      getFiles: () => ({}),
      updateScene: vi.fn(),
      resetScene: vi.fn(),
    };
    excalidrawAPI?.(api);
    onChange?.(
      [{ id: '1', type: 'rectangle', isDeleted: false }],
      { theme: 'light' },
      {}
    );
  }, [excalidrawAPI, onChange]);
  return <div data-testid="excalidraw-mock" />;
}

vi.mock('next/dynamic', () => ({
  default: () => MockExcalidraw,
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
});
