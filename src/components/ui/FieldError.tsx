/** Inline field error — announced via role=alert, wired to aria-describedby. */
export function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="text-label-sm font-label-bold text-error flex items-center gap-1">
      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">error</span>
      {message}
    </p>
  );
}
