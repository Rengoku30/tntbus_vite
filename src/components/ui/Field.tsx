import clsx from "clsx";
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { FieldError } from "./FieldError";

const baseFieldClass =
  "w-full bg-surface-container-low border border-surface-variant text-on-surface font-body-md rounded p-3.5 " +
  "placeholder:text-surface-variant focus:outline-none focus:border-2 focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all";

export interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

/** Label + control + inline error, wired with aria-describedby. */
export function FieldShell({
  id,
  label,
  error,
  hint,
  required,
  className,
  children,
}: FieldShellProps & { children: React.ReactNode }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="font-label-bold text-label-bold text-primary-container uppercase tracking-wider"
      >
        {label}
        {required && <span className="text-error" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-label-sm text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`} message={error} />}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Renders a Material Symbol icon inside the field's leading edge. */
  icon?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, error, hint, required, icon, className, ...rest },
  ref,
) {
  const inputId = id ?? rest.name ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint} required={required} className={className}>
      <div className="relative flex items-center">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant pointer-events-none" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={clsx(baseFieldClass, icon && "pl-11")}
          {...rest}
        />
      </div>
    </FieldShell>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, error, hint, required, icon, className, children, ...rest },
  ref,
) {
  const inputId = id ?? rest.name ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint} required={required} className={className}>
      <div className="relative flex items-center">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant pointer-events-none" aria-hidden="true">
            {icon}
          </span>
        )}
        <select
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={clsx(baseFieldClass, "appearance-none pr-10", icon && "pl-11")}
          {...rest}
        >
          {children}
        </select>
        <span className="material-symbols-outlined absolute right-3 text-on-surface-variant pointer-events-none" aria-hidden="true">
          expand_more
        </span>
      </div>
    </FieldShell>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id, label, error, hint, required, className, ...rest },
  ref,
) {
  const inputId = id ?? rest.name ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint} required={required} className={className}>
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={clsx(baseFieldClass, "min-h-[90px]")}
        {...rest}
      />
    </FieldShell>
  );
});
