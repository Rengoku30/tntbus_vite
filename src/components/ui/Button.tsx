import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary-container text-on-primary-fixed hover:bg-primary-fixed-dim active:scale-[0.98] shadow-[0_0_20px_rgba(234,234,0,0.1)]",
  secondary:
    "bg-transparent border-2 border-primary-container text-primary-container hover:bg-primary-container hover:text-on-primary-fixed",
  ghost: "bg-transparent text-primary hover:bg-surface-container-high",
  danger:
    "bg-error-container text-on-error-container hover:bg-error hover:text-on-error",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-2 text-label-sm",
  md: "px-5 py-3 text-label-bold",
  lg: "px-6 py-4 text-headline-md",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Renders a spinner and disables the button. */
  loading?: boolean;
  /** Full width on mobile (matches the mockups' primary CTAs). */
  block?: boolean;
  leadingIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  block = false,
  leadingIcon,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        "rounded font-label-bold tracking-wide flex items-center justify-center gap-2 transition-all",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-container/40",
        "disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="Loading"
        />
      ) : (
        leadingIcon
      )}
      {children}
    </button>
  );
}
