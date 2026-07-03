import type { PlanType } from '@/lib/plans';

export type VoiceFundingSource = 'platform' | 'byok';

export interface VoiceFundingInput {
  plan: PlanType;
  aiCredits: number;
  openaiApiKey: string | null;
  preferredProvider: string;
}

export interface VoiceFundingDecision {
  allowed: boolean;
  source?: VoiceFundingSource;
  reason?: string;
}

/**
 * The single voice funding rule (mirrors canUseAI's shape):
 *   - 'ai' plan: platform-funded while credits last, then BYOK OpenAI key.
 *   - 'platform' / 'lifetime': BYOK OpenAI key only.
 *   - 'free': denied — the 'voiceInterview' flag is the entitlement wall; a
 *     flag-granted tester on free can still exercise voice via a BYOK key.
 * Voice requires OpenAI audio models (whisper-1 / tts-1); other BYOK
 * providers have no audio support, so the OpenAI key is always the BYOK key.
 */
export function canUseVoice(input: VoiceFundingInput): VoiceFundingDecision {
  const { plan, aiCredits, openaiApiKey, preferredProvider } = input;

  if (plan === 'ai' && aiCredits > 0) {
    return { allowed: true, source: 'platform' };
  }

  if (openaiApiKey) {
    return { allowed: true, source: 'byok' };
  }

  if (plan === 'ai') {
    return {
      allowed: false,
      reason:
        'You have used all AI credits for this month. Add an OpenAI API key in Settings to keep using voice interviews.',
    };
  }

  if (plan === 'free') {
    return {
      allowed: false,
      reason: 'Voice interviews are not included on the Free plan.',
    };
  }

  if (preferredProvider !== 'openai') {
    return {
      allowed: false,
      reason: `Voice interviews need OpenAI audio models (Whisper + TTS). Your current AI provider (${preferredProvider}) doesn't support audio — add an OpenAI API key in Settings to use voice.`,
    };
  }

  return {
    allowed: false,
    reason: 'Add your OpenAI API key in Settings to use voice interviews.',
  };
}
