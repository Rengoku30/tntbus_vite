import { useOnlineStatus } from "@/lib/online";

/** Sticky offline banner (L9). Renders when the browser goes offline. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[60] bg-error-container text-on-error-container text-center text-label-bold text-label-sm py-2 px-4"
    >
      <span className="inline-flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
          wifi_off
        </span>
        You're offline. Some features may be unavailable.
      </span>
    </div>
  );
}
