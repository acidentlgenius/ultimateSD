import { describe, expect, it, vi } from 'vitest';
import { transcribeAudio, synthesizeSpeech, VoiceProviderError } from '@/lib/voice-openai';

describe('transcribeAudio', () => {
  it('posts multipart form to whisper-1 and returns the text', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: 'design a url shortener' }), { status: 200 })
    );
    const audio = new Blob(['audio-bytes'], { type: 'audio/webm' });

    const text = await transcribeAudio('sk-test', audio, fetchImpl as unknown as typeof fetch);

    expect(text).toBe('design a url shortener');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/audio/transcriptions');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer sk-test');
    const form = init.body as FormData;
    expect(form.get('model')).toBe('whisper-1');
    expect(form.get('file')).toBeInstanceOf(Blob);
  });

  it('throws VoiceProviderError on non-2xx', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('nope', { status: 401 }));
    await expect(
      transcribeAudio('sk-bad', new Blob(['x']), fetchImpl as unknown as typeof fetch)
    ).rejects.toBeInstanceOf(VoiceProviderError);
  });
});

describe('synthesizeSpeech', () => {
  it('posts JSON to tts-1 and returns audio bytes', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    const fetchImpl = vi.fn().mockResolvedValue(new Response(bytes, { status: 200 }));

    const audio = await synthesizeSpeech('sk-test', 'Hello candidate', fetchImpl as unknown as typeof fetch);

    expect(new Uint8Array(audio)).toEqual(new Uint8Array([1, 2, 3]));
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/audio/speech');
    expect(JSON.parse(init.body)).toEqual({
      model: 'tts-1',
      voice: 'alloy',
      input: 'Hello candidate',
    });
  });

  it('throws VoiceProviderError on non-2xx', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('err', { status: 500 }));
    await expect(
      synthesizeSpeech('sk-test', 'hi', fetchImpl as unknown as typeof fetch)
    ).rejects.toBeInstanceOf(VoiceProviderError);
  });
});
