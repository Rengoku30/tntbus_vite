import type { ReactNode } from "react";

/** Friendly empty state for lists/search with no results. */
export function EmptyState({
  icon = "search_off",
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-12 px-4 bg-surface-container-low rounded-lg border border-dashed border-surface-variant">
      <span className="material-symbols-outlined text-headline-xl text-primary-container" aria-hidden="true">
        {icon}
      </span>
      <h3 className="font-headline-md text-headline-md text-on-surface">{title}</h3>
      {message && <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
