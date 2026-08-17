/** Central logger. Debug/info are dev-only; warnings/errors always print. */

export type LogLevel = "debug" | "info" | "warn" | "error";

const IS_DEV = import.meta.env.DEV;

export const logger = {
  debug(...args: unknown[]) {
    if (IS_DEV) console.debug("[TNTBus]", ...args);
  },
  info(...args: unknown[]) {
    if (IS_DEV) console.info("[TNTBus]", ...args);
  },
  warn(...args: unknown[]) {
    console.warn("[TNTBus]", ...args);
  },
  error(...args: unknown[]) {
    console.error("[TNTBus]", ...args);
  },
};
