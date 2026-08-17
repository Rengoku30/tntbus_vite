import { ConfigError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Environment configuration with fail-fast validation.
 * A missing/invalid env var surfaces a clear, friendly startup error instead
 * of cryptic runtime `undefined` behavior (L14).
 */

function parseFloatEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = import.meta.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (Number.isNaN(n) || n < min || n > max) {
    throw new ConfigError(
      `Invalid ${name}=${raw} (expected number in [${min}, ${max}])`,
      "Configuration error: the app environment is invalid. Please check VITE_* variables.",
    );
  }
  return n;
}

function parseBoolEnv(name: string, fallback: boolean): boolean {
  const raw = import.meta.env[name];
  if (raw === undefined || raw === "") return fallback;
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  throw new ConfigError(
    `Invalid ${name}=${raw} (expected boolean)`,
    "Configuration error: the app environment is invalid. Please check VITE_* variables.",
  );
}

export interface AppEnv {
  /** 0..1 — probability a mock API call fails, for exercising error UI. */
  apiFailureRate: number;
  /** Base artificial latency in ms applied to mock calls. */
  apiLatencyMs: number;
  /** Seat lock TTL in ms. */
  seatLockTtlMs: number;
  /** Simulate payments failing network-wise (in addition to declines). */
  debugFailures: boolean;
}

export function loadEnv(): AppEnv {
  return {
    apiFailureRate: parseFloatEnv("VITE_API_FAILURE_RATE", 0, 0, 1),
    apiLatencyMs: parseFloatEnv("VITE_API_LATENCY_MS", 350, 0, 5000),
    seatLockTtlMs: parseFloatEnv("VITE_SEAT_LOCK_TTL_MS", 5 * 60_000, 10_000, 30 * 60_000),
    debugFailures: parseBoolEnv("VITE_DEBUG_FAILURES", import.meta.env.DEV),
  };
}

// Loaded once at module scope; validate early so the app fails loudly at boot.
export const env = loadEnv();

logger.debug("env:", env);
