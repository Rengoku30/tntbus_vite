import clsx from "clsx";

/** Skeleton placeholder for async loading states (L5). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx("animate-pulse bg-surface-container-high rounded", className)}
      aria-hidden="true"
    />
  );
}

/** A row of skeleton cards, sized like BusCards. */
export function CardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading results">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-container-low rounded-lg border border-surface-variant p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-3 w-3/4" />
          <div className="flex justify-between items-end">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-10 w-32 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
