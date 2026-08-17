import clsx from "clsx";
import { useToastContext } from "./toast";
import type { ToastKind } from "@/hooks/useToast";

const KIND_ICON: Record<ToastKind, string> = {
  success: "check_circle",
  error: "error",
  info: "info",
  warning: "warning",
};

const KIND_CLASS: Record<ToastKind, string> = {
  success: "border-primary-container",
  error: "border-error",
  info: "border-outline-variant",
  warning: "border-[#ff9900]",
};

/** Fixed viewport for toasts (aria-live polite so they're announced). */
export function ToastViewport() {
  const { toasts, dismiss } = useToastContext();

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[110] flex flex-col gap-2 w-[min(92vw,380px)]"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={clsx(
            "bg-surface-container-high border-l-4 rounded-r-lg shadow-2xl p-4 flex items-start gap-3 animate-slideUp",
            KIND_CLASS[t.kind],
          )}
        >
          <span
            className={clsx(
              "material-symbols-outlined text-[22px] mt-0.5",
              t.kind === "error" ? "text-error" : "text-primary-container",
            )}
            aria-hidden="true"
          >
            {KIND_ICON[t.kind]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-label-bold text-label-bold text-on-surface">{t.title}</p>
            {t.message && <p className="text-label-sm text-on-surface-variant mt-0.5">{t.message}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="text-on-surface-variant hover:text-primary-container transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
