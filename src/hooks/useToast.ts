import { useCallback, useMemo, useState } from "react";
import { newId } from "@/lib/id";

export type ToastKind = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
  autoDismissMs?: number;
}

export interface ToastApi {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
}

const DEFAULT_MS = 5000;

export function useToast(): ToastApi {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = newId("toast");
      setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
      const ms = toast.autoDismissMs ?? DEFAULT_MS;
      if (ms > 0) {
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, ms);
      }
      return id;
    },
    [],
  );

  const api = useMemo<ToastApi>(
    () => ({
      toasts,
      push,
      dismiss,
      success: (title, message) => push({ kind: "success", title, message }),
      error: (title, message) => push({ kind: "error", title, message, autoDismissMs: 8000 }),
      info: (title, message) => push({ kind: "info", title, message }),
      warning: (title, message) => push({ kind: "warning", title, message, autoDismissMs: 8000 }),
    }),
    [toasts, push, dismiss],
  );

  return api;
}
