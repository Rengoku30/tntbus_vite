import type { AppError } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import clsx from "clsx";

/**
 * Error banner for async failures (L5). Shows the human message, offers
 * Retry (for retryable errors) and logs the reference id.
 */
export function ErrorBanner({
  error,
  onRetry,
  retrying = false,
  className,
}: {
  error: AppError;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  const isAuth = error.code === "AUTH";
  return (
    <div
      role="alert"
      className={clsx(
        "flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-error-container/20 border border-error-container rounded-lg p-4",
        className,
      )}
    >
      <span className="material-symbols-outlined text-error" aria-hidden="true">
        {isAuth ? "lock" : "cloud_off"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-label-bold text-label-bold text-on-error-container">{error.userMessage}</p>
        <p className="text-label-sm text-on-surface-variant mt-0.5">
          {error.code === "NETWORK" || error.code === "TIMEOUT"
            ? "Your connection may be unstable."
            : `Reference: ${error.code}`}
        </p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} loading={retrying}>
          Retry
        </Button>
      )}
    </div>
  );
}
