/**
 * Typed error model — the backbone of the error-handling system.
 *
 * Every error surfaced to the UI is an AppError subclass carrying:
 *  - code:       machine-readable category (for branching/logging)
 *  - userMessage: human-friendly copy shown in error UI (never raw stack traces)
 *  - status:     HTTP-like status for parity with a real backend
 *  - cause:      the original error, for diagnostics
 */

export type ErrorCode =
  | "VALIDATION"
  | "AUTH"
  | "NOT_FOUND"
  | "NETWORK"
  | "TIMEOUT"
  | "STORAGE"
  | "PAYMENT_DECLINED"
  | "SEAT_TAKEN"
  | "RATE_LIMITED"
  | "CONFIG"
  | "UNKNOWN";

export interface AppErrorOptions {
  code: ErrorCode;
  /** Technical message (logged, never shown directly). */
  message: string;
  /** Human-friendly message rendered to the user. */
  userMessage: string;
  status?: number;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly userMessage: string;
  readonly status: number;
  readonly cause?: unknown;

  constructor(opts: AppErrorOptions) {
    super(opts.message);
    this.name = "AppError";
    this.code = opts.code;
    this.userMessage = opts.userMessage;
    this.status = opts.status ?? 0;
    this.cause = opts.cause;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, userMessage = message) {
    super({ code: "VALIDATION", message, userMessage, status: 400 });
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(
    message = "Authentication failed",
    userMessage = "Your session has expired. Please sign in again.",
    status = 401,
  ) {
    super({ code: "AUTH", message, userMessage, status });
    this.name = "AuthError";
  }
}

export class NotFoundError extends AppError {
  constructor(
    message = "Resource not found",
    userMessage = "We couldn't find what you're looking for. It may have been removed.",
  ) {
    super({ code: "NOT_FOUND", message, userMessage, status: 404 });
    this.name = "NotFoundError";
  }
}

export class NetworkError extends AppError {
  constructor(
    message = "Network request failed",
    userMessage = "We couldn't reach our servers. Check your connection and try again.",
  ) {
    super({ code: "NETWORK", message, userMessage, status: 0 });
    this.name = "NetworkError";
  }
}

/** Generic upstream/server failure — retryable (status >= 500). */
export class ApiError extends AppError {
  constructor(
    message = "Server error",
    userMessage = "Something went wrong on our end. Please try again.",
    status = 503,
  ) {
    super({ code: "NETWORK", message, userMessage, status });
    this.name = "ApiError";
  }
}

export class TimeoutError extends AppError {
  constructor(
    message = "Request timed out",
    userMessage = "This is taking longer than expected. Please try again.",
  ) {
    super({ code: "TIMEOUT", message, userMessage, status: 504 });
    this.name = "TimeoutError";
  }
}

export class PaymentDeclinedError extends AppError {
  constructor(userMessage = "Your card was declined. Please try another payment method.") {
    super({ code: "PAYMENT_DECLINED", message: "Payment declined", userMessage, status: 402 });
    this.name = "PaymentDeclinedError";
  }
}

export class SeatTakenError extends AppError {
  readonly seats: string[];

  constructor(seats: string[]) {
    super({
      code: "SEAT_TAKEN",
      message: `Seat(s) no longer available: ${seats.join(", ")}`,
      userMessage: `Seat${seats.length > 1 ? "s" : ""} ${seats.join(", ")} ${
        seats.length > 1 ? "were" : "was"
      } just taken. Please pick another.`,
      status: 409,
    });
    this.name = "SeatTakenError";
    this.seats = seats;
  }
}

export class StorageError extends AppError {
  constructor(
    message = "Could not persist data",
    userMessage = "We couldn't save your data in this browser. Your progress will be kept for this session only.",
  ) {
    super({ code: "STORAGE", message, userMessage, status: 500 });
    this.name = "StorageError";
  }
}

export class ConfigError extends AppError {
  constructor(message: string, userMessage = "The application is not configured correctly.") {
    super({ code: "CONFIG", message, userMessage, status: 500 });
    this.name = "ConfigError";
  }
}

/** Normalize any thrown value into an AppError (never throws). */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) {
    return new AppError({
      code: "UNKNOWN",
      message: err.message,
      userMessage: "Something went wrong. Please try again.",
      cause: err,
    });
  }
  return new AppError({
    code: "UNKNOWN",
    message: typeof err === "string" ? err : "Unknown error",
    userMessage: "Something went wrong. Please try again.",
    cause: err,
  });
}

/** True when a retry has a real chance of succeeding. */
export function isRetryable(err: unknown): boolean {
  if (!(err instanceof AppError)) return false;
  if (err.code === "NETWORK" || err.code === "TIMEOUT" || err.code === "RATE_LIMITED") return true;
  return err.status >= 500;
}

/** Discriminated result for API-ish operations: `ok` or `error`. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T = never>(error: AppError): Result<T> {
  return { ok: false, error };
}

/** Run an async fn, converting any throw into a Result. */
export async function attempt<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (e) {
    return err(toAppError(e));
  }
}
