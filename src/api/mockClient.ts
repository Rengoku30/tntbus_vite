import { env } from "@/config/env";
import { useOnlineStatus } from "@/lib/online";
import { NetworkError, TimeoutError, ApiError } from "@/lib/errors";
import { sleep } from "@/lib/delay";

/**
 * Simulated transport layer for the mock backend.
 *
 * Every mock API call flows through `request()`, which applies:
 *  - artificial latency (VITE_API_LATENCY_MS)
 *  - probabilistic failure (VITE_API_FAILURE_RATE, or VITE_DEBUG_FAILURES)
 *  - offline rejection when the browser is offline
 *  - timeout rejection when latency is unusually high
 *
 * This lets the full error-handling stack (banners, retries, offline state)
 * be built and verified without a real server.
 */

function shouldFail(): boolean {
  if (env.apiFailureRate > 0 && Math.random() < env.apiFailureRate) return true;
  return false;
}

function timeoutFor(): number {
  // Simulate a timeout sometimes in debug mode.
  if (env.debugFailures && Math.random() < 0.02) return 60; // ms — artificially low
  return env.apiLatencyMs * 3 + 1500;
}

export async function request<T>(fn: () => T | Promise<T>, opts: { offline?: boolean } = {}): Promise<T> {
  // Offline guard — the caller may pass the live navigator status.
  if (opts.offline === true || (typeof navigator !== "undefined" && !navigator.onLine)) {
    throw new NetworkError();
  }

  const started = performance.now();
  const maxWait = timeoutFor();
  const work = fn();

  // Race the work against the timeout.
  const result = await Promise.race([
    work,
    sleep(maxWait).then(() => {
      throw new TimeoutError();
    }),
  ]);

  // Simulated latency AFTER the work completes (so loading states are visible).
  const elapsed = performance.now() - started;
  const remaining = Math.max(0, env.apiLatencyMs - elapsed);
  if (remaining > 0) await sleep(remaining);

  return result;
}

/** Wrap a handler so failures are injected at the edge (L7). */
export function mockHandler<T>(fn: () => T | Promise<T>): () => Promise<T> {
  return async () => {
    if (shouldFail()) {
      // Fail as a 5xx-style error so retry logic engages.
      throw new ApiError();
    }
    return request(fn);
  };
}

/** React hook: pass the live online state into request(). */
export function useMockRequest() {
  const online = useOnlineStatus();
  return <T,>(fn: () => T | Promise<T>) => request(fn, { offline: !online });
}
