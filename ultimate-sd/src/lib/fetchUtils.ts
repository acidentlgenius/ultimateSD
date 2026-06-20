export interface FetchWithRetryOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
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
