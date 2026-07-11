/**
 * useCanvasSession — master state machine for a V2 canvas session
 *
 * Manages: current stage, max stage reached, timer, seniority,
 * explain card visibility, guide rail open state, and AI feedback state.
 *
 * Does NOT manage user-typed text (that's useCanvasContent).
 */

import { useCallback, useEffect, useReducer } from 'react';
import { STAGE_META } from '../data/canvas-data';
import type {
  CanvasSessionState,
  FeedbackState,
  Seniority,
  StageIndex,
} from '../data/canvas-types';

// ─── Action Types ─────────────────────────────────────────────────────────────

type Action =
  | { type: 'GO_TO_STAGE'; stage: StageIndex }
  | { type: 'DISMISS_EXPLAIN' }
  | { type: 'SET_SENIORITY'; seniority: Seniority }
  | { type: 'TICK' }
  | { type: 'TOGGLE_TIMER' }
  | { type: 'TOGGLE_GUIDE' }
  | { type: 'SET_FEEDBACK'; stage: StageIndex; state: FeedbackState; body?: string; label?: string }
  | { type: 'RESTORE'; snapshot: Partial<CanvasSessionState> };

// ─── Initial State ────────────────────────────────────────────────────────────

function makeInitial(initialStage: StageIndex = 0, initialSeniority: Seniority = 'mid'): CanvasSessionState {
  return {
    stage: initialStage,
    maxStage: initialStage,
    explainOpen: initialStage === 0, // auto-open on first stage
    seniority: initialSeniority,
    secondsLeft: STAGE_META[initialStage].budget * 60,
    timerRunning: false,
    feedback: { 0: 'idle', 1: 'idle', 2: 'idle', 3: 'idle', 4: 'idle', 5: 'idle', 6: 'idle' },
    feedbackContent: {},
    guideOpen: true,
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: CanvasSessionState, action: Action): CanvasSessionState {
  switch (action.type) {
    case 'GO_TO_STAGE': {
      const { stage } = action;
      const newMax = Math.max(state.maxStage, stage) as StageIndex;
      return {
        ...state,
        stage,
        maxStage: newMax,
        explainOpen: stage > state.maxStage, // only auto-open on first visit
        secondsLeft: STAGE_META[stage].budget * 60,
        timerRunning: false,
      };
    }
    case 'DISMISS_EXPLAIN':
      return { ...state, explainOpen: false, timerRunning: true };
    case 'SET_SENIORITY':
      return { ...state, seniority: action.seniority };
    case 'TICK':
      if (!state.timerRunning || state.secondsLeft <= 0) return state;
      return { ...state, secondsLeft: Math.max(0, state.secondsLeft - 1) };
    case 'TOGGLE_TIMER':
      return { ...state, timerRunning: !state.timerRunning };
    case 'TOGGLE_GUIDE':
      return { ...state, guideOpen: !state.guideOpen };
    case 'SET_FEEDBACK': {
      const { stage, state: feedbackState, body, label } = action;
      return {
        ...state,
        feedback: { ...state.feedback, [stage]: feedbackState },
        feedbackContent:
          feedbackState === 'done' && body && label
            ? { ...state.feedbackContent, [stage]: { body, label } }
            : state.feedbackContent,
      };
    }
    case 'RESTORE':
      return { ...state, ...action.snapshot };
    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseCanvasSessionReturn {
  state: CanvasSessionState;
  goToStage: (stage: StageIndex) => void;
  nextStage: () => void;
  prevStage: () => void;
  dismissExplain: () => void;
  setSeniority: (s: Seniority) => void;
  toggleTimer: () => void;
  toggleGuide: () => void;
  setFeedback: (stage: StageIndex, feedbackState: FeedbackState, body?: string, label?: string) => void;
  restore: (snapshot: Partial<CanvasSessionState>) => void;
}

export function useCanvasSession(
  initialStage?: StageIndex,
  initialSeniority?: Seniority,
): UseCanvasSessionReturn {
  const [state, dispatch] = useReducer(
    reducer,
    makeInitial(initialStage ?? 0, initialSeniority ?? 'mid'),
  );

  // 1-second timer tick
  useEffect(() => {
    if (!state.timerRunning) return;
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, [state.timerRunning]);

  const goToStage = useCallback((stage: StageIndex) => {
    dispatch({ type: 'GO_TO_STAGE', stage });
  }, []);

  const nextStage = useCallback(() => {
    const next = Math.min(6, state.stage + 1) as StageIndex;
    dispatch({ type: 'GO_TO_STAGE', stage: next });
  }, [state.stage]);

  const prevStage = useCallback(() => {
    const prev = Math.max(0, state.stage - 1) as StageIndex;
    dispatch({ type: 'GO_TO_STAGE', stage: prev });
  }, [state.stage]);

  const dismissExplain = useCallback(() => {
    dispatch({ type: 'DISMISS_EXPLAIN' });
  }, []);

  const setSeniority = useCallback((s: Seniority) => {
    dispatch({ type: 'SET_SENIORITY', seniority: s });
  }, []);

  const toggleTimer = useCallback(() => {
    dispatch({ type: 'TOGGLE_TIMER' });
  }, []);

  const toggleGuide = useCallback(() => {
    dispatch({ type: 'TOGGLE_GUIDE' });
  }, []);

  const setFeedback = useCallback(
    (stage: StageIndex, feedbackState: FeedbackState, body?: string, label?: string) => {
      dispatch({ type: 'SET_FEEDBACK', stage, state: feedbackState, body, label });
    },
    [],
  );

  const restore = useCallback((snapshot: Partial<CanvasSessionState>) => {
    dispatch({ type: 'RESTORE', snapshot });
  }, []);

  return {
    state,
    goToStage,
    nextStage,
    prevStage,
    dismissExplain,
    setSeniority,
    toggleTimer,
    toggleGuide,
    setFeedback,
    restore,
  };
}
