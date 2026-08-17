import { isRetryable } from "./errors";
import { logger } from "./logger";

export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  factor: number;
  jitter: number;
}

export const DEFAULT_RETRY: RetryOptions = {
  retries: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
  factor: 2,
  jitter: 0.25,
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Exponential backoff with full jitter. Only retries when the error is
 * actually retryable (network/timeout/5xx). Non-retryable errors reject fast.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULT_RETRY, ...options };
  let lastErr: unknown;
  let delay = opts.baseDelayMs;

  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt >= opts.retries || !isRetryable(err)) throw err;
      const jittered = delay * (1 + (Math.random() - 0.5) * 2 * opts.jitter);
      const wait = Math.min(Math.max(jittered, 0), opts.maxDelayMs);
      logger.debug(`retry ${attempt + 1}/${opts.retries} after ${Math.round(wait)}ms`);
      await sleep(wait);
      delay = Math.min(delay * opts.factor, opts.maxDelayMs);
    }
  }
  throw lastErr;
}
