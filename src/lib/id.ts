import { nanoid } from "nanoid";

/** Compact unique id for internal records. */
export const newId = (prefix: string) => `${prefix}_${nanoid(10)}`;

/** Short id for error refs / log correlation. */
export const shortId = (len = 6) => nanoid(len);

/** User-facing booking reference, e.g. "TNT-847291". */
export const newBookingId = () => {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `TNT-${n}`;
};

/** Idempotency key for payment attempts (prevents double-charge on retry). */
export const newIdempotencyKey = () => `pay_${nanoid(16)}`;
