import { describe, expect, it } from 'vitest';
import {
  INITIAL_VOICE_STATE,
  voiceReducer,
  type VoiceMachineState,
} from '@/components/voice/voice-machine';

function at(phase: VoiceMachineState['phase']): VoiceMachineState {
  return { phase, error: null };
}

describe('voiceReducer', () => {
  it('walks the full turn: idle→recording→transcribing→thinking→speaking→idle', () => {
    let state = INITIAL_VOICE_STATE;
    state = voiceReducer(state, { type: 'PRESS' });
    expect(state.phase).toBe('recording');
    state = voiceReducer(state, { type: 'RELEASE' });
    expect(state.phase).toBe('transcribing');
    state = voiceReducer(state, { type: 'TRANSCRIBED' });
    expect(state.phase).toBe('thinking');
    state = voiceReducer(state, { type: 'REPLY_READY' });
    expect(state.phase).toBe('speaking');
    state = voiceReducer(state, { type: 'PLAYBACK_ENDED' });
    expect(state.phase).toBe('idle');
  });

  it('SPEAK from idle plays the interviewer question (opening turn)', () => {
    expect(voiceReducer(at('idle'), { type: 'SPEAK' }).phase).toBe('speaking');
  });

  it('ignores illegal events (no recording while speaking, no release while idle)', () => {
    expect(voiceReducer(at('speaking'), { type: 'PRESS' }).phase).toBe('speaking');
    expect(voiceReducer(at('idle'), { type: 'RELEASE' }).phase).toBe('idle');
    expect(voiceReducer(at('thinking'), { type: 'PRESS' }).phase).toBe('thinking');
  });

  it('FAIL from any phase lands in error with the message', () => {
    for (const phase of ['idle', 'recording', 'transcribing', 'thinking', 'speaking'] as const) {
      const state = voiceReducer(at(phase), { type: 'FAIL', message: 'mic denied' });
      expect(state).toEqual({ phase: 'error', error: 'mic denied' });
    }
  });

  it('RESET recovers from error to idle', () => {
    const errored = voiceReducer(at('recording'), { type: 'FAIL', message: 'x' });
    expect(voiceReducer(errored, { type: 'RESET' })).toEqual(INITIAL_VOICE_STATE);
    expect(voiceReducer(errored, { type: 'PRESS' }).phase).toBe('error');
  });
});
