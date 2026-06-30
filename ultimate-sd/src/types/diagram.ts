import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type {
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
} from '@excalidraw/excalidraw/types';

export type ExcalidrawScene = {
  type: 'excalidraw';
  version: number;
  source?: string;
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
};

export type PersistedDiagram = {
  format: 'excalidraw';
  formatVersion: 1;
  stepKey: string;
  scene: ExcalidrawScene;
  timestamp: string;
};

/** Per-step diagram state in practice session */
export type StepDiagramData = {
  scene?: ExcalidrawScene;
  description?: string | null;
  imageData?: string;
  timestamp?: string;
};

export type DiagramSnapshot = {
  scene?: ExcalidrawScene;
  imageData?: string;
  description?: string;
  timestamp?: string;
};

export type DiagramCanvasHandle = {
  getApi(): ExcalidrawImperativeAPI | null;
  getScene(): ExcalidrawScene | null;
  getDescription(): string | null;
  getPng(): Promise<Blob | null>;
  loadScene(scene: ExcalidrawScene): void;
  clear(clearStorage?: boolean): void;
  exportExcalidrawFile(): void;
  importExcalidrawFile(file: File): Promise<void>;
};

/** Props for the Excalidraw wrapper component */
export type DiagramCanvasProps = {
  stepKey: string;
  /** When false, live getPng() returns null — callers must use exportSceneToPng(scene) */
  isVisible?: boolean;
};
