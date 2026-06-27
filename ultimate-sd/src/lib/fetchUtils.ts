export interface FetchWithRetryOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export function getFetchErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'The request timed out. Check your connection and try again.';
  }

  if (error instanceof TypeError) {
    return 'Could not reach the server. Check your internet connection and try again.';
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (attempt === retries) {
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
