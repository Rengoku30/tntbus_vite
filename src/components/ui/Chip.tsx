import clsx from "clsx";

export function Chip({
  selected = false,
  onClick,
  children,
  className,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      className={clsx(
        "px-3 py-1 rounded-full text-label-sm font-label-sm transition-colors border",
        selected
          ? "bg-primary-container text-on-primary-fixed border-primary-container"
          : "bg-transparent text-tertiary border-surface-variant hover:border-primary-container",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
