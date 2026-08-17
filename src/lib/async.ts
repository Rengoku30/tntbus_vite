import { useCallback, useEffect, useRef, useState } from "react";
import { toAppError, type AppError } from "./errors";

/**
 * Discriminated-union async state. Renderers exhaustively switch on `status`,
 * so a missing branch is a compile error — a concrete piece of L1/L5 safety.
 */
export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: AppError };

/**
 * useAsync returns the discriminated union as `state` (so `switch (state.status)`
 * narrows `data`/`error` correctly) plus `run`/`reset` for triggering loads.
 */
export interface AsyncRunner<T> {
  state: AsyncState<T>;
  /** Trigger a (re)load. Safe to call from effects and event handlers. */
  run: () => void;
  /** Set state back to idle. */
  reset: () => void;
}

/**
 * Run an async load, typically on mount and when `deps` change.
 * The returned `run()` also works as a manual retry.
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
  enabled = true,
): AsyncRunner<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "idle" });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const depsKey = useRef("");

  const run = useCallback(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    fnRef
      .current()
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: "success", data });
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setState({ status: "error", error: toAppError(err) });
      });
    return controller;
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  useEffect(() => {
    if (!enabled) return;
    const controller = run();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, depsKey.current, ...deps]);

  return { state, run, reset };
}

export interface UseMutationOptions<TInput, TData> {
  onSuccess?: (data: TData, input: TInput) => void;
  onError?: (error: AppError, input: TInput) => void;
}

export type MutationState<TInput, TData> = {
  status: "idle" | "pending" | "success" | "error";
  error: AppError | null;
  /** Track the last input so callers can retry with identical args. */
  mutate: (input: TInput) => Promise<TData>;
  reset: () => void;
};

/**
 * Mutation hook with a pending guard (prevents double-submit) and an
 * `error` field the UI can render. `mutate` returns the data on success
 * and throws the AppError on failure so callers can also use try/catch.
 */
export function useMutation<TInput, TData>(
  fn: (input: TInput) => Promise<TData>,
  options: UseMutationOptions<TInput, TData> = {},
): MutationState<TInput, TData> {
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [error, setError] = useState<AppError | null>(null);
  const pendingRef = useRef(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const optsRef = useRef(options);
  optsRef.current = options;

  const mutate = useCallback(async (input: TInput): Promise<TData> => {
    if (pendingRef.current) {
      // Double-submit guard: keep the existing in-flight promise behavior
      // minimal — reject so callers know not to proceed twice.
      return Promise.reject(new Error("mutation already in flight"));
    }
    pendingRef.current = true;
    setStatus("pending");
    setError(null);
    try {
      const data = await fnRef.current(input);
      setStatus("success");
      optsRef.current.onSuccess?.(data, input);
      return data;
    } catch (err) {
      const appErr = toAppError(err);
      setStatus("error");
      setError(appErr);
      optsRef.current.onError?.(appErr, input);
      throw appErr;
    } finally {
      pendingRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { status, error, mutate, reset };
}
