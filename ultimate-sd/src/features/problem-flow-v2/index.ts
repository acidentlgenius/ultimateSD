/**
 * V2 Problem Flow — barrel export
 *
 * IMPORTANT: Only CanvasSessionUI should be imported by the practice page.
 * All other exports are for internal V2 use or tests.
 */

export { default as CanvasSessionUI } from './CanvasSessionUI';
export { getCanvasData, CANVAS_DATA, STAGE_META, CAMERA_REGIONS } from './data/canvas-data';
export type {
  ProblemCanvasData,
  CanvasSessionState,
  CanvasSnapshot,
  CanvasContent,
  StageIndex,
  Seniority,
  CameraRegion,
  StageMeta,
} from './data/canvas-types';
