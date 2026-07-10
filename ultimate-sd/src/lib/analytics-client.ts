'use client';

/**
 * Lightweight client-side funnel events — posts directly to PostHog's public
 * capture endpoint with the NEXT_PUBLIC key (no posthog-js dependency).
 * Fire-and-forget: analytics must never affect UX, so every failure path is
 * swallowed. Server-side events (signup, session started, evaluation) live in
 * src/lib/posthog.ts consumers; these cover the pre-auth activation funnel.
 */

const ANON_ID_KEY = 'sd_ph_anon_id';

function anonId(): string {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

export function captureClientEvent(event: string, properties: Record<string, unknown> = {}): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === 'undefined') return;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

  try {
    const body = JSON.stringify({
      api_key: key,
      event,
      distinct_id: anonId(),
      properties: { ...properties, $current_url: window.location.href },
      timestamp: new Date().toISOString(),
    });
    // sendBeacon survives navigation (these events mostly fire on link clicks)
    if (!navigator.sendBeacon?.(`${host}/capture/`, new Blob([body], { type: 'application/json' }))) {
      void fetch(`${host}/capture/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    /* never let analytics break the page */
  }
}
