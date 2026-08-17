# Error Handling

Error handling is a **first-class, layered system**. Each layer is a concrete file with a concrete responsibility — this is what makes the app robust without a real backend.

## Layer map

| # | Layer | Files | What it guarantees |
| --- | --- | --- | --- |
| 1 | **Type safety** | `tsconfig.json`, `lib/async.ts` | Strict mode + `noUncheckedIndexedAccess`; async state is a discriminated union so a missing UI branch is a compile error. |
| 2 | **Typed error model** | `lib/errors.ts` | Every failure is an `AppError` subclass with `code`, `userMessage`, `status`, `cause`. UI renders `userMessage` only. |
| 3 | **Runtime validation** | `validation/schemas.ts` | Zod schemas for every form — email, password strength, Luhn-valid card, future expiry, cross-field rules. |
| 4 | **Form UX** | `components/ui/Field.tsx`, `FieldError.tsx` | `aria-invalid`, `aria-describedby`, `role="alert"` first error, disabled submit while pending, focus-first-invalid. |
| 5 | **Async UI states** | `lib/async.ts`, `components/ui/Skeleton.tsx`, `feedback/ErrorBanner.tsx` | Loading → skeleton; error → banner with Retry; empty → `EmptyState`. |
| 6 | **Error boundaries** | `feedback/ErrorBoundary.tsx` | Catches render/lifecycle crashes per-route and at root; friendly screen + error ref id. |
| 7 | **Simulated network** | `api/mockClient.ts`, `lib/retry.ts` | Latency, probabilistic failure, offline rejection, timeout; Retry uses exponential backoff with jitter. |
| 8 | **Routing guards** | `layout/ProtectedRoute.tsx`, `layout/RequireAdmin.tsx`, `pages/NotFoundPage.tsx` | Auth redirect with `?next=`, admin-role enforcement, on-brand 404, foreign booking ids → not-found. |
| 9 | **Offline awareness** | `lib/online.ts`, `feedback/OfflineBanner.tsx` | Sticky banner when offline; API calls reject with `NetworkError` when `navigator.onLine` is false. |
| 10 | **Storage resilience** | `lib/storage.ts` | Quota exceeded / private-mode / corrupt JSON handled; in-memory fallback keeps the session working; toast notifies. |
| 11 | **Asset fallbacks** | `ProfilePage.tsx`, `BookingConfirmedPage.tsx` | Avatar `onError` → initials; QR render error → placeholder; fonts self-hosted (no CDN failure). |
| 12 | **Booking/payment safety** | `store/bookingStore.ts`, `api/payments.ts` | Seat locks with TTL, cross-session race detection, idempotent confirm, no double-charge on retry. |
| 13 | **Observability** | `lib/logger.ts`, `lib/capture.ts` | Leveled logging; every caught error logged with a short `ref` shown to the user. |
| 14 | **Config validation** | `config/env.ts` | Invalid/missing `VITE_*` fails fast with a clear message instead of mysterious `undefined`s. |

## The error model

```ts
// lib/errors.ts
export class AppError extends Error {
  code: ErrorCode;        // "VALIDATION" | "AUTH" | "NOT_FOUND" | "NETWORK" | …
  userMessage: string;    // human-friendly copy for the UI
  status: number;         // HTTP-like status
  cause?: unknown;        // original error for diagnostics
}

export class ForbiddenError extends AppError { … } // code "FORBIDDEN", status 403 — admin access denied
export class SeatTakenError extends AppError { … } // code "SEAT_TAKEN", status 409
export class PaymentDeclinedError extends AppError { … } // code "PAYMENT_DECLINED", status 402
export class NetworkError extends AppError { … } // code "NETWORK", status 0, retryable
```

`toAppError(unknown)` normalizes anything thrown (including non-Error values) into an `AppError`, so a `catch (err)` block can always rely on `.userMessage`.

## Async state machine

`useAsync` returns `state: AsyncState<T>`:

```ts
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: AppError };
```

Rendering code switches on `state.status`, so TypeScript narrows `data`/`error` and a missing branch fails to compile. `run()` doubles as a manual retry (used by `ErrorBanner`).

## Retry policy

`lib/retry.ts` implements exponential backoff with **full jitter**:

- Only retries when the error is genuinely retryable (`NETWORK`, `TIMEOUT`, `RATE_LIMITED`, or status ≥ 500)
- Defaults: 3 retries, base 500 ms, factor 2, cap 5 s, ±25% jitter
- Non-retryable errors (validation, auth, decline, seat-taken) reject immediately so the UI can show the right message

## Form validation flow

1. `react-hook-form` + `zodResolver` validate on blur, then on change after first blur.
2. Zod issues carry per-field messages; `FieldError` renders under the control with `role="alert"`.
3. The input gets `aria-invalid="true"` and `aria-describedby="<id>-error"`.
4. Submit is blocked while invalid or while a request is in flight (double-submit guard in `useMutation`).
5. Server/auth errors surface in an `ErrorBanner` above the form, distinct from field errors.

## Booking & payment safety (layer 12)

- **Seat locks**: selecting seats writes locks keyed `tripId:seatId` with a TTL (`VITE_SEAT_LOCK_TTL_MS`, default 5 min). The lock owner is the session user id.
- **Re-locking**: selecting the same seat again by the same user simply refreshes the hold.
- **Race detection**: `confirm()` rejects with `SeatTakenError` if a seat is booked by anyone or locked by a *different* session — the second buyer sees "Seat X was just taken — please pick another" and is routed back to re-select.
- **Idempotent confirm**: the checkout submit generates one idempotency key per attempt. A retried submit with the same key returns the existing booking instead of creating a duplicate (no double-book / no double-charge).
- **Lock expiry**: the seat page starts a TTL timer; when it fires, a dialog offers to re-select.

## Testing the error paths

Every layer is exercisable without a backend. See [`demo-guide.md`](./demo-guide.md) for the exact steps — e.g. `VITE_API_FAILURE_RATE=0.4` to force network failures, DevTools offline mode for the offline banner, and the `4000 0000 0000 0002` card to simulate a declined payment.
