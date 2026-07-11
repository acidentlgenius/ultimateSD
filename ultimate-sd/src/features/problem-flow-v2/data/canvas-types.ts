/**
 * V2 Canvas Types
 * Spec: docs/superpowers/specs/2026-07-10-problem-flow-v2-design.md
 *
 * IMPORTANT: Do NOT import anything from V1 (PracticeUI, StepByStepChat, etc.)
 */

// ─── Seniority ───────────────────────────────────────────────────────────────

export type Seniority = 'beginner' | 'mid' | 'senior';

// ─── Camera ──────────────────────────────────────────────────────────────────

/**
 * Camera region definition from the prototype.
 * cx/cy are the center of the region in canvas coordinates.
 * fitW/fitH is the bounding box to fit in the viewport.
 * maxS caps the scale so things don't get too zoomed in.
 */
export interface CameraRegion {
  cx: number;
  cy: number;
  fitW: number;
  fitH: number;
  maxS: number;
}

// ─── Stage ───────────────────────────────────────────────────────────────────

export type StageIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface StageMeta {
  index: StageIndex;
  label: string;
  /** Recommended time budget in minutes */
  budget: number;
  /** Title shown in StepExplainCard */
  explainTitle: string;
  /** Body text shown in StepExplainCard */
  explainBody: string;
}

// ─── AI Feedback ─────────────────────────────────────────────────────────────

export type FeedbackState = 'idle' | 'loading' | 'done';

export interface StageFeedback {
  /** Short label for the feedback category (e.g. "Strong fundamentals") */
  label: string;
  /** Full feedback text shown in guide rail after AI responds */
  body: string;
}

// ─── Per-Problem Canvas Data ──────────────────────────────────────────────────

/**
 * Stage 0: Problem statement region
 */
export interface ProblemStageData {
  /** Problem title shown at top of region */
  title: string;
  /** One-paragraph context / framing */
  context: string;
  /** What is in scope and out of scope for this session */
  scopeNote: string;
}

/**
 * Stage 1: Functional Requirements region
 * frSuggestions vary by seniority — shown in guide rail
 */
export interface FRStageData {
  beginner: string[];
  midLevel: string[];
  senior: string[];
  outOfScope: string[];
}

/**
 * Stage 2: Non-Functional Requirements region
 */
export interface NFRStageData {
  items: string[];
  /** Numbers the candidate should derive/estimate */
  scaleHints: string[];
}

/**
 * Stage 3: Core Entities region
 */
export interface EntitiesStageData {
  entities: EntityDef[];
}

export interface EntityDef {
  name: string;
  fields: FieldDef[];
}

export interface FieldDef {
  name: string;
  type: string;
  note?: string;
}

/**
 * Stage 4: API Design region
 */
export interface APIStageData {
  endpoints: APIEndpoint[];
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  /** Request body / query params */
  params?: string;
  /** Response shape */
  response?: string;
}

/**
 * Stage 5 & 6: HLD + Deep Dives region
 */
export interface HLDStageData {
  /** Service / component boxes on the canvas */
  components: HLDComponent[];
  /** Directed arrows between components */
  arrows: HLDArrow[];
  /** Key deep dive topics for stage 6 */
  deepDives: DeepDiveTopic[];
}

export interface HLDComponent {
  id: string;
  label: string;
  /** Sub-label / type annotation */
  sublabel?: string;
  /** Position within the HLD region (relative coordinates, 0-1 range) */
  rx: number;
  ry: number;
}

export interface HLDArrow {
  from: string;
  to: string;
  label?: string;
}

export interface DeepDiveTopic {
  title: string;
  /** One-line description of what to cover */
  description: string;
  /** Estimated minutes */
  minutes: number;
}

// ─── Guide Rail Tips ─────────────────────────────────────────────────────────

export interface StageGuideContent {
  /** Primary focus tips — shown under "FOCUS ON" */
  tips: string[];
  /** Secondary suggestions — shown under "WORTH CONSIDERING" */
  suggestions: string[];
  /** AI feedback placeholder text while idle */
  feedbackPrompt: string;
}

// ─── Full Per-Problem Definition ─────────────────────────────────────────────

export interface ProblemCanvasData {
  /** Must match the URL slug in /practice/[slug] */
  slug: string;

  problem: ProblemStageData;
  fr: FRStageData;
  nfr: NFRStageData;
  entities: EntitiesStageData;
  api: APIStageData;
  hld: HLDStageData;

  /** Guide rail content per stage */
  guide: [
    StageGuideContent, // stage 0
    StageGuideContent, // stage 1
    StageGuideContent, // stage 2
    StageGuideContent, // stage 3
    StageGuideContent, // stage 4
    StageGuideContent, // stage 5
    StageGuideContent, // stage 6
  ];
}

// ─── Session State ────────────────────────────────────────────────────────────

/**
 * Master session state managed by useCanvasSession
 */
export interface CanvasSessionState {
  /** Current active stage (camera focuses here) */
  stage: StageIndex;
  /** Highest stage ever reached — controls region visibility */
  maxStage: StageIndex;
  /** Whether the step explain card is open */
  explainOpen: boolean;
  /** Selected seniority — affects FR suggestions */
  seniority: Seniority;
  /** Seconds remaining in current stage */
  secondsLeft: number;
  /** Whether the timer is running */
  timerRunning: boolean;
  /** AI feedback state per stage */
  feedback: Record<StageIndex, FeedbackState>;
  /** AI feedback content per stage (populated after 'done') */
  feedbackContent: Partial<Record<StageIndex, StageFeedback>>;
  /** Whether the guide rail is open */
  guideOpen: boolean;
}

// ─── Canvas Content (user-written text) ──────────────────────────────────────

/**
 * All user-written text in the canvas, keyed by field path.
 * Persisted to DB via canvas progress API.
 * Keys are like: "fr.custom", "nfr.custom", "entities.User.extra", etc.
 */
export type CanvasContent = Record<string, string>;

// ─── Canvas Snapshot ─────────────────────────────────────────────────────────

/**
 * Persisted to ProblemProgress.canvasSnapshot (Json field in Prisma)
 */
export interface CanvasSnapshot {
  stage: StageIndex;
  maxStage: StageIndex;
  seniority: Seniority;
  content: CanvasContent;
  savedAt: string; // ISO 8601
}
