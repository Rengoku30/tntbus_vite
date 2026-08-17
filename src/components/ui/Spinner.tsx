import clsx from "clsx";

/** Small spinner used in buttons and inline loads. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin",
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
