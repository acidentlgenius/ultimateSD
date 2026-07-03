import type { Page } from '@playwright/test';

/** Replaces MediaRecorder + getUserMedia with synchronous fakes (no real mic). */
export async function fakeMediaRecorder(page: Page) {
  await page.addInitScript(() => {
    class FakeMediaRecorder {
      static isTypeSupported() {
        return true;
      }
      state: 'inactive' | 'recording' = 'inactive';
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      constructor(_stream: MediaStream) {}
      start() {
        this.state = 'recording';
      }
      stop() {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['fake-audio'], { type: 'audio/webm' }) });
        this.onstop?.();
      }
    }
    // @ts-expect-error test double
    window.MediaRecorder = FakeMediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: async () => new MediaStream() },
      configurable: true,
    });
  });
}

/** Stubs all /api/voice/* providers so no real STT/TTS is called. */
export async function mockVoiceRoutes(page: Page) {
  await page.route('**/api/voice/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: 'vs-e2e',
        question: 'What are the core requirements?',
      }),
    })
  );
  await page.route('**/api/voice/transcribe', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ transcript: 'I would start with URL shortening and redirects.' }),
    })
  );
  await page.route('**/api/voice/reply', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ text: 'Good. How would you handle 100 million redirects a day?' }),
    })
  );
  await page.route('**/api/voice/speak', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'audio/mpeg',
      // Not a decodable mp3 — VoicePanel treats playback failure as PLAYBACK_ENDED.
      body: Buffer.from([0xff, 0xf3, 0x18, 0xc4]),
    })
  );
}
