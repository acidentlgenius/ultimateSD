'use client';

import { useCallback, useReducer, useRef, useState } from 'react';
import { Mic, Phone, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchWithRetry, getUserFacingFetchError } from '@/lib/fetchUtils';
import { cn } from '@/lib/utils';
import {
  INITIAL_VOICE_STATE,
  voiceReducer,
  type VoiceMachineEvent,
} from './voice-machine';

interface TranscriptEntry {
  role: 'interviewer' | 'candidate';
  text: string;
}

const PHASE_LABELS: Record<string, string> = {
  idle: 'Hold the button and speak',
  recording: 'Listening… release to send',
  transcribing: 'Transcribing…',
  thinking: 'Interviewer is thinking…',
  speaking: 'Interviewer is speaking…',
  error: 'Something went wrong',
};

export default function VoicePanel({
  slug,
  problemTitle,
  practiceSessionId = null,
}: {
  slug: string;
  problemTitle: string;
  practiceSessionId?: string | null;
}) {
  const [state, dispatch] = useReducer(voiceReducer, INITIAL_VOICE_STATE);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const fail = useCallback((message: string) => {
    dispatch({ type: 'FAIL', message });
  }, []);

  /** Fetch TTS audio for `text` and play it; resolves the machine on end/error. */
  const speak = useCallback(
    async (text: string, currentSessionId: string, entryEvent: VoiceMachineEvent) => {
      dispatch(entryEvent);
      const end = () => dispatch({ type: 'PLAYBACK_ENDED' });
      try {
        const res = await fetchWithRetry('/api/voice/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: currentSessionId, text }),
        });
        const data = await res.clone().json().catch(() => ({}));
        if (!res.ok || data.error) {
          // No audio is non-fatal: the transcript is on screen. End the turn.
          end();
          return;
        }
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onended = end;
        audio.onerror = end;
        await audio.play().catch(end);
      } catch {
        end();
      }
    },
    []
  );

  const startSession = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, practiceSessionId }),
      });
      const body = await res.json();
      if (!res.ok || body.error) {
        fail(body.error);
        return;
      }
      setSessionId(body.sessionId);
      setTranscript([{ role: 'interviewer', text: body.question }]);
      await speak(body.question, body.sessionId, { type: 'SPEAK' });
    } catch (e) {
      fail(getUserFacingFetchError(e) || 'Could not start the voice session.');
    }
  }, [slug, practiceSessionId, fail, speak]);

  const handlePress = useCallback(async () => {
    if (!sessionId || state.phase !== 'idle') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audio = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
          const form = new FormData();
          form.append('sessionId', sessionId);
          form.append('audio', audio, 'answer.webm');
          const sttRes = await fetchWithRetry('/api/voice/transcribe', { method: 'POST', body: form });
          const sttBody = await sttRes.json();
          if (!sttRes.ok || sttBody.error) {
            fail(sttBody.error);
            return;
          }
          setTranscript((prev) => [...prev, { role: 'candidate', text: sttBody.transcript }]);
          dispatch({ type: 'TRANSCRIBED' });

          const replyRes = await fetchWithRetry('/api/voice/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, transcript: sttBody.transcript }),
          });
          const replyBody = await replyRes.json();
          if (!replyRes.ok || replyBody.error) {
            fail(replyBody.error);
            return;
          }
          setTranscript((prev) => [...prev, { role: 'interviewer', text: replyBody.text }]);
          await speak(replyBody.text, sessionId, { type: 'REPLY_READY' });
        } catch (e) {
          fail(getUserFacingFetchError(e) || 'Network error during the voice turn.');
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      dispatch({ type: 'PRESS' });
    } catch {
      fail('Microphone access was denied. Allow the mic to use voice mode.');
    }
  }, [sessionId, state.phase, fail, speak]);

  const handleRelease = useCallback(() => {
    if (state.phase !== 'recording') return;
    dispatch({ type: 'RELEASE' });
    recorderRef.current?.stop();
  }, [state.phase]);

  if (!sessionId && state.phase !== 'error') {
    return (
      <div className="mb-6 rounded-xl border-2 border-border/60 bg-card p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" /> Voice Interview
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Talk through {problemTitle} with the AI interviewer. The diagram canvas stays available below.
          </p>
        </div>
        <Button size="sm" data-testid="voice-start" onClick={startSession}>
          Start Voice Interview
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border-2 border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-primary" /> Voice Interview
        </h3>
        <span data-testid="voice-status" className="text-xs text-muted-foreground">
          {PHASE_LABELS[state.phase]}
        </span>
      </div>

      {state.error && (
        <p role="alert" data-testid="voice-error" className="text-sm text-red-500">
          {state.error}{' '}
          <button className="underline" onClick={() => dispatch({ type: 'RESET' })}>
            Try again
          </button>
        </p>
      )}

      <ul data-testid="voice-transcript" className="space-y-2 max-h-64 overflow-y-auto text-sm">
        {transcript.map((entry, index) => (
          <li
            key={index}
            className={cn(
              'rounded-lg px-3 py-2',
              entry.role === 'interviewer' ? 'bg-muted' : 'bg-primary/10 text-right'
            )}
          >
            <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
              {entry.role}
            </span>
            {entry.text}
          </li>
        ))}
      </ul>

      <div className="flex justify-center">
        <button
          type="button"
          data-testid="voice-talk"
          disabled={!sessionId || (state.phase !== 'idle' && state.phase !== 'recording')}
          onPointerDown={handlePress}
          onPointerUp={handleRelease}
          onPointerLeave={handleRelease}
          className={cn(
            'flex items-center gap-2 rounded-full px-6 py-3 font-medium transition-colors select-none touch-none',
            state.phase === 'recording'
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-primary text-primary-foreground disabled:opacity-50'
          )}
        >
          <Mic className="h-4 w-4" />
          {state.phase === 'recording' ? 'Release to send' : 'Hold to talk'}
        </button>
      </div>
    </div>
  );
}
