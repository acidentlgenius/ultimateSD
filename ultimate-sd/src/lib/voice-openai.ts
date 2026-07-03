/**
 * Minimal OpenAI audio client (whisper-1 STT, tts-1 TTS) over plain fetch.
 * Deliberately no `openai` npm dependency. `fetchImpl` is injectable for tests.
 */
export class VoiceProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VoiceProviderError';
  }
}

const OPENAI_BASE = 'https://api.openai.com/v1';

export async function transcribeAudio(
  apiKey: string,
  audio: Blob,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const form = new FormData();
  form.append('file', audio, 'answer.webm');
  form.append('model', 'whisper-1');

  const res = await fetchImpl(`${OPENAI_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    throw new VoiceProviderError(`Transcription failed (${res.status})`);
  }
  const data = (await res.json()) as { text: string };
  return data.text;
}

export async function synthesizeSpeech(
  apiKey: string,
  text: string,
  fetchImpl: typeof fetch = fetch
): Promise<ArrayBuffer> {
  const res = await fetchImpl(`${OPENAI_BASE}/audio/speech`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'tts-1', voice: 'alloy', input: text }),
  });

  if (!res.ok) {
    throw new VoiceProviderError(`Speech synthesis failed (${res.status})`);
  }
  return res.arrayBuffer();
}
