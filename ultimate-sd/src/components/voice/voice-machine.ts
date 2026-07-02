export type VoicePhase =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'error';

export interface VoiceMachineState {
  phase: VoicePhase;
  error: string | null;
}

export type VoiceMachineEvent =
  | { type: 'PRESS' } // hold-to-talk pressed
  | { type: 'RELEASE' } // hold-to-talk released
  | { type: 'TRANSCRIBED' } // STT finished
  | { type: 'REPLY_READY' } // interviewer text ready
  | { type: 'SPEAK' } // play interviewer audio directly (opening question)
  | { type: 'PLAYBACK_ENDED' } // TTS playback done
  | { type: 'FAIL'; message: string }
  | { type: 'RESET' };

export const INITIAL_VOICE_STATE: VoiceMachineState = { phase: 'idle', error: null };

/** Pure turn-based push-to-talk state machine. Illegal events are no-ops. */
export function voiceReducer(
  state: VoiceMachineState,
  event: VoiceMachineEvent
): VoiceMachineState {
  if (event.type === 'FAIL') {
    return { phase: 'error', error: event.message };
  }

  switch (state.phase) {
    case 'idle':
      if (event.type === 'PRESS') return { phase: 'recording', error: null };
      if (event.type === 'SPEAK') return { phase: 'speaking', error: null };
      return state;
    case 'recording':
      if (event.type === 'RELEASE') return { phase: 'transcribing', error: null };
      return state;
    case 'transcribing':
      if (event.type === 'TRANSCRIBED') return { phase: 'thinking', error: null };
      return state;
    case 'thinking':
      if (event.type === 'REPLY_READY') return { phase: 'speaking', error: null };
      return state;
    case 'speaking':
      if (event.type === 'PLAYBACK_ENDED') return { phase: 'idle', error: null };
      return state;
    case 'error':
      if (event.type === 'RESET') return INITIAL_VOICE_STATE;
      return state;
  }
}
