export interface FetchWithRetryOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export class HttpError extends Error {
  status: number;
  /** Server-provided human-readable message, when the body carried one. */
  serverMessage?: string;

  constructor(status: number, serverMessage?: string) {
    // Keep the legacy "status: NNN" text — getFetchErrorMessage and existing
    // callers pattern-match on it.
    super(`HTTP error! status: ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

export function getFetchErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'The request timed out. Check your connection and try again.';
  }

  if (error instanceof TypeError) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }

  // Prefer the server's own explanation (e.g. "add an API key in Settings")
  // over a generic status-based message.
  if (error instanceof HttpError && error.serverMessage) {
    return error.serverMessage;
  }

  if (error instanceof Error) {
    const statusMatch = error.message.match(/status: (\d+)/);
    if (statusMatch) {
      const status = Number(statusMatch[1]);
      if (status === 401 || status === 403) {
        return 'You need to sign in to use the AI interviewer.';
      }
      if (status === 402) {
        return 'AI credits exhausted. Upgrade your plan or add an API key in settings.';
      }
      if (status === 429) {
        return 'Too many requests. Please wait a moment and try again.';
      }
      if (status === 404) {
        return 'This problem could not be found. Try refreshing the page.';
      }
      if (status >= 500) {
        return 'The AI service is temporarily unavailable. Please try again shortly.';
      }
    }

    if (error.message.includes('Failed to fetch') || error.message === 'Network error') {
      return 'Could not reach the server. Check your internet connection and try again.';
    }
  }

  return 'Something went wrong while sending your message. Please try again.';
}

// Deterministic client errors won't change on retry; retrying them just
// makes the user stare at a spinner before the same failure.
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 408 || status >= 500;
}

async function readServerMessage(response: Response): Promise<string | undefined> {
  try {
    const data = await response.clone().json();
    const message = data?.message ?? data?.error;
    return typeof message === 'string' && message.length > 0 ? message : undefined;
  } catch {
    return undefined;
  }
}

export async function fetchWithRetry(url: string, options: FetchWithRetryOptions = {}): Promise<Response> {
  const { retries = 3, retryDelay = 1000, timeout = 8000, ...fetchOptions } = options;

  let attempt = 0;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new HttpError(response.status, await readServerMessage(response));
      }

      return response;
    } catch (error) {
      const retryable = !(error instanceof HttpError) || isRetryableStatus(error.status);
      if (!retryable || attempt === retries) {
        throw error;
      }
      attempt++;
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error("fetchWithRetry: Exceeded retries");
}
