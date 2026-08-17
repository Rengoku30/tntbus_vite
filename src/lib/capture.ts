import { logger } from "./logger";
import { shortId } from "./id";

/** Log an error and return a short reference id that can be shown to the user for support. */
export function captureError(err: unknown, context?: string): string {
  const ref = shortId();
  logger.error(`[ref:${ref}]${context ? ` ${context}` : ""}`, err);
  return ref;
}
