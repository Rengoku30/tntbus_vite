import clsx from "clsx";

const KINDS = {
  success: "bg-primary-container/15 text-primary-container border-primary-container",
  warning: "bg-[#ff9900]/15 text-[#ff9900] border-[#ff9900]",
  error: "bg-error/15 text-error border-error",
  info: "bg-surface-container-high text-on-surface-variant border-outline-variant",
} as const;

export type BadgeKind = keyof typeof KINDS;

export function Badge({
  kind = "info",
  children,
  className,
  icon,
}: {
  kind?: BadgeKind;
  children: React.ReactNode;
  className?: string;
  icon?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded border text-label-sm font-label-bold uppercase tracking-wider",
        KINDS[kind],
        className,
      )}
    >
      {icon && (
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
