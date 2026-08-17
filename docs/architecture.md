# Architecture

This document explains how the TNTBus codebase is organized and how data flows through the app.

## Layer overview

```
┌──────────────────────────────────────────────────────────────┐
│  Pages (src/pages)                                            │
│  One component per route; owns UI state and data fetching     │
└───────────────────────────┬──────────────────────────────────┘
                            │ hooks
┌───────────────────────────▼──────────────────────────────────┐
│  Hooks (src/hooks)                                            │
│  useAuth · useBookings · useToast · useOnlineStatus           │
└───────────────────────────┬──────────────────────────────────┘
                            │ calls
┌───────────────────────────▼──────────────────────────────────┐
│  API layer (src/api)                                          │
│  auth · search · bookings · payments — all through mockClient │
└───────────────────────────┬──────────────────────────────────┘
                            │ reads/writes
┌───────────────────────────▼──────────────────────────────────┐
│  Stores (src/store) + Seed (src/data/seed.ts)                 │
│  authStore · bookingStore (seat locks) · searchStore          │
└───────────────────────────┬──────────────────────────────────┘
                            │ persists via
┌───────────────────────────▼──────────────────────────────────┐
│  lib/storage.ts (safe localStorage)                           │
└──────────────────────────────────────────────────────────────┘
```

Cross-cutting: `lib/errors.ts` (typed errors), `lib/async.ts` (async state), `lib/retry.ts` (backoff), `config/env.ts` (env validation), `theme/tokens.ts` + `tailwind.config.ts` (design system).

## Directory responsibilities

| Directory | Responsibility |
| --- | --- |
| `src/pages/` | Route components. No direct localStorage access — always via hooks/API. |
| `src/hooks/` | React glue: auth session, bookings list, toasts, online status, debounce, localStorage state. |
| `src/api/` | The "server". Every call flows through `mockClient.ts` which adds latency, random failure, offline and timeout behavior. API functions throw typed `AppError`s. |
| `src/store/` | Pure-ish data layer. `authStore` (users/session), `bookingStore` (bookings + seat locks with TTL), `searchStore` (catalog + availability), `adminTripsStore` (admin-created routes). |
| `src/data/seed.ts` | Deterministic trip catalog generated per date, plus demo users and the city list. |
| `src/lib/` | Framework-free utilities: errors, safe storage, async state machine, retry, online, logging, formatting, ids. |
| `src/validation/` | Zod schemas — the single source of truth for form rules. |
| `src/components/` | Reusable UI. `layout/` shells, `ui/` primitives, `feedback/` error/toast/modal, `bus/` domain components (BusCard, SeatMap…), `forms/`. |
| `src/types/domain.ts` | Shared domain types (`Trip`, `Booking`, `User`, `Seat`, `SeatLock`…). |

## Admin layer

Admin features live in three places:

- **`src/store/adminTripsStore.ts`** — persists admin-created routes (code, vehicle, times, price, dates, amenities) to localStorage and registers them with the seed catalog via `registerCustomTripSource`. New/removed routes invalidate the trip cache so searches and seat maps pick them up immediately. Every mutation calls `requireAdmin()` and throws `ForbiddenError` for non-admins.
- **`src/api/admin.ts`** — `adminApi.listAllBookings()` (all bookings + customer info), `listRoutes()`, `createRoute()`, `removeRoute()`. Each re-checks `isAdmin()` at the edge (defense in depth).
- **`src/components/layout/RequireAdmin.tsx`** — route guard composing `ProtectedRoute`; redirects signed-in non-admins away from `/admin`. The "Admin" nav link only renders for admins.

Roles are stored on the user (`role: "customer" | "admin"`). New registrations are always `customer`; the seeded `admin@tntbus.com` account is the only admin.

## Data flow: search → booking

1. **Home** validates the search with `searchSchema`, persists a recent-search entry, and navigates to `/search-results?...`.
2. **SearchResultsPage** reads query params, calls `searchApi.search()`, and renders one of four states: loading skeleton, error banner (retry), empty state, or the result list. Sorting and amenity filtering happen client-side in a `useMemo`.
3. **RouteDetailsPage** loads the trip via `searchApi.getTrip()`. Selecting seats calls `bookingsApi.lockSeats()` which creates **seat locks with a TTL** owned by the current session.
4. **CheckoutPage** (protected) re-loads the trip, shows the chosen seats + total, and on submit:
   - `paymentsApi.charge()` — mock gateway, idempotency key, Luhn check, can decline
   - `bookingsApi.confirm()` — **re-validates** seats (booked by anyone? locked by another session?), then creates the booking
5. **BookingConfirmedPage** loads the booking by id and only renders the ticket if it exists **and** belongs to the current user.
6. **MyBookingsPage** reads all bookings for the user and splits them into upcoming/past by travel date.

## Availability & the seed cache

Trips are generated once per date and cached in memory (`tripCache`). Confirmed bookings are the **source of truth** for availability:

- `bookingStore.confirm()` unions the seed's pre-booked seats with seats from actual confirmed bookings before validating — so a seat already sold via checkout can never be re-sold.
- `searchStore.availabilityFor()` does the same when rendering the seat map / result cards.

This closes the "stale cache" race: book a seat in one tab and it is unavailable in another immediately.

## Routing & shells

- `AppShell` — standard pages: `TopAppBar` (desktop nav + user chip) + content + `BottomNav` (mobile).
- `TransactionalLayout` — auth + booking-decision screens: back button in the top bar, **no bottom nav**, narrower content column.
- `ProtectedRoute` — wraps `/checkout`, `/my-bookings`, `/profile`; redirects to `/login?next=<path>` and restores the destination after sign-in.

## Design-token consolidation

The 9 Stitch mockups each carried an identical inline `tailwind.config` (~60 color tokens + typography). This project lifts them **once** into `tailwind.config.ts`, keyed exactly as the mockups used them (`primary-container`, `surface-container-low`, `headline-xl`, …), so any page can use `bg-primary-container`, `font-headline-xl`, `px-container-margin` etc. `theme/tokens.ts` mirrors the raw values for JS (inline styles, canvas).
