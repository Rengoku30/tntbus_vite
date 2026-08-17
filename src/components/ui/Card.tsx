import clsx from "clsx";
import type { ReactNode } from "react";

/** Card container — tonal surface, low-contrast outline (DESIGN.md elevation L1). */
export function Card({
  className,
  children,
  interactive = false,
}: {
  className?: string;
  children: ReactNode;
  interactive?: boolean;
}) {
  return (
    <div
      className={clsx(
        "bg-surface-container-low rounded-lg border border-surface-variant",
        interactive && "hover:border-primary-container transition-colors cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}
