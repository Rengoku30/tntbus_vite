# TNTBus — Intercity Bus Booking System

A full end-to-end intercity bus booking web app built with **React 19 + Vite + TypeScript (strict)**. Every screen in the booking journey — search, results, seat selection, payment, confirmation, and booking management — is wired into one connected flow, styled with the **Kinetic High-Contrast** design system (dark canvas, signal-yellow actions, Montserrat/Inter typography).

The app is **frontend-only by design**: a localStorage-backed mock data layer simulates a backend (latency, failures, offline) so the entire error-handling stack is real, testable, and demoable without a server.

> **Demo login** — `john@example.com` / `Password123!`
>
> **Demo card** — `4242 4242 4242 4242` (success) or `4000 0000 0000 0002` (declined)

---

## Table of contents

- [Screens & flow](#screens--flow)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Error handling](#error-handling)
- [Demo data](#demo-data)
- [Scripts](#scripts)
- [Design system](#design-system)
- [Documentation](#documentation)
- [Out of scope](#out-of-scope)
- [License](#license)

---

## Screens & flow

| Route | Page | Notes |
| --- | --- | --- |
| `/` | Home | Search form, recent searches, popular routes |
| `/search-results` | Search Results | Sort + amenity filters, loading/error/empty states |
| `/route-details/:tripId` | Route Details | Itinerary timeline + interactive seat map |
| `/checkout` | Checkout | **Protected** — passenger + mock card payment |
| `/booking-confirmed/:bookingId` | Confirmed | Guarded digital ticket + QR + download |
| `/my-bookings` | My Bookings | **Protected** — upcoming/past tabs |
| `/login`, `/register`, `/forgot-password` | Auth | Transactional screens (no bottom nav) |
| `/profile` | Profile | **Protected** — avatar, settings, logout |
| `*` | 404 | On-brand not-found |

```
Home ──▶ Search Results ──▶ Route Details ──▶ Checkout ──▶ Booking Confirmed
 │                             │                                   │
 └──── My Bookings ◀───────────┴─────────── Profile ◀─────────────┘
        (upcoming / past)                          (auth gated)
```

## Tech stack

- **React 19** + **Vite 8** + **TypeScript 7** (`strict`, `noUncheckedIndexedAccess`)
- **Tailwind CSS 3** with one shared `tailwind.config.ts` (single source of truth for design tokens)
- **React Router 7** — protected routes, query params, deep links
- **Zod 4** + **react-hook-form** — runtime validation with typed, accessible form errors
- **Self-hosted fonts/icons** (`@fontsource` Inter/Montserrat + Material Symbols) — no Google CDN dependency
- **qrcode.react** — boarding-pass QR with graceful fallback
- **nanoid / clsx / tiny-invariant** — ids, class composition, dev assertions

## Quick start

Requires **Node.js ≥ 20**.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
# → http://localhost:5173

# 3. Production build + preview
npm run build
npm run preview
# → http://localhost:4173
```

**Try the full flow:** log in with the demo account → search NYC → BOS on a future date → pick 2 seats → pay with the demo card → view the ticket → check it in *My Bookings*.

## Environment variables

All optional — sensible defaults apply. Copy `.env.example` to `.env` to override.

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_FAILURE_RATE` | `0` | Probability (0–1) that a mock call fails — set `0.4` to exercise error UI |
| `VITE_API_LATENCY_MS` | `350` | Artificial latency so loading states are visible |
| `VITE_SEAT_LOCK_TTL_MS` | `300000` | Seat-hold lock TTL (5 min) before re-selection is prompted |
| `VITE_DEBUG_FAILURES` | `false` | Simulate occasional network timeouts in dev |

## Project structure

```
├─ index.html                     # HTML entry (dark color-scheme, meta)
├─ tailwind.config.ts             # DESIGN.md tokens → single Tailwind config
├─ vite.config.ts                 # @/ path alias, React plugin
├─ src/
│  ├─ main.tsx                    # React root + fatal-error guard
│  ├─ App.tsx                     # Router + providers + error boundary
│  ├─ index.css                   # Tailwind directives + custom utils
│  ├─ config/env.ts               # Fail-fast env validation
│  ├─ theme/tokens.ts             # Raw tokens for JS consumers
│  ├─ types/domain.ts             # Trip/Booking/User/Seat types
│  ├─ validation/schemas.ts       # Zod schemas (login…checkout)
│  ├─ lib/                        # errors, storage, async, retry, online…
│  ├─ api/                        # mock transport + auth/search/bookings/payments
│  ├─ store/                      # localStorage-backed stores + seat locks
│  ├─ data/seed.ts                # cities, trips, seat maps, demo user
│  ├─ hooks/                      # useAuth, useBookings, useToast…
│  ├─ components/
│  │  ├─ layout/                  # AppShell, TopAppBar, BottomNav, ProtectedRoute
│  │  ├─ ui/                      # Button, Input, Chip, Skeleton…
│  │  ├─ forms/                   # PasswordStrengthMeter
│  │  ├─ feedback/                # ErrorBoundary, ErrorBanner, Toast, Modal…
│  │  └─ bus/                     # BusCard, SeatMap, FilterPanel…
│  └─ pages/                      # One component per route
└─ docs/                          # Architecture & error-handling deep dives
```

## Error handling

Error handling is a **first-class, layered system** — 14 layers, each with a concrete file and job:

| # | Layer | Where |
| --- | --- | --- |
| 1 | Type safety (strict TS, discriminated unions) | `tsconfig.json`, `lib/async.ts` |
| 2 | Typed error model with user-facing messages | `lib/errors.ts` |
| 3 | Runtime input validation (Zod) | `validation/schemas.ts` |
| 4 | Accessible form UX (`aria-invalid`, `role=alert`) | `components/ui/Field*` |
| 5 | Async states: loading / error / empty / success | `lib/async.ts`, `Skeleton`, `ErrorBanner` |
| 6 | Error boundaries with error refs | `components/feedback/ErrorBoundary.tsx` |
| 7 | Simulated network failures + retry w/ backoff | `api/mockClient.ts`, `lib/retry.ts` |
| 8 | Routing guards & not-found states | `ProtectedRoute`, `NotFoundPage` |
| 9 | Offline awareness | `lib/online.ts`, `OfflineBanner` |
| 10 | Storage resilience (quota / private mode) | `lib/storage.ts` |
| 11 | Asset fallbacks (avatar, QR, fonts) | `ProfilePage`, `BookingConfirmedPage` |
| 12 | Booking/payment safety (seat race, idempotency) | `store/bookingStore.ts`, `api/payments.ts` |
| 13 | Observability (leveled logger + refs) | `lib/logger.ts`, `lib/capture.ts` |
| 14 | Fail-fast config validation | `config/env.ts` |

Every UI error renders `error.userMessage` — raw stack traces never reach the user, and each failure is logged with a short reference id for support.

## Demo data

Seeded from `src/data/seed.ts` (deterministic per date):

- **6 bookable cities** — NYC, Boston, Philadelphia, DC, Chicago, Detroit (plus intermediate stops for itineraries)
- **10 trips/day** — Express / Direct / Overnight / Sleeper with realistic times, prices, amenities, and 4-column seat maps (some pre-booked, a premium row at a higher price)
- **Demo user** — `john@example.com` / `Password123!` (created on first run)

Confirmed bookings persist to localStorage and **immediately reduce availability** — a seat booked in one tab is sold out in another.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck (`tsc --noEmit`) then production build |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript strict typecheck only |

## Design system

The **Kinetic High-Contrast** system (from `kinetic_high_contrast/DESIGN.md`) is encoded once in `tailwind.config.ts`:

- Dark canvas `#121414` · signal-yellow actions `#eaea00` · white primary text
- Montserrat (headlines) + Inter (body/labels), 8px spacing grid
- Tonal elevation + low-contrast outlines (no soft shadows)
- Rounded corners; pills reserved for status tags
- Transactional screens suppress the bottom nav (per the mockups)

The original Stitch mockups live in the `tntbus_*/` folders as `code.html` + `screen.png` references.

## Documentation

- **`docs/architecture.md`** — modules, data flow, routing, design-token consolidation
- **`docs/error-handling.md`** — the 14-layer strategy, each layer with code references
- **`docs/booking-flow.md`** — the end-to-end flow including seat locks and idempotent payment
- **`docs/demo-guide.md`** — how to run and demo the app, including every error path

## Out of scope

This is a **frontend-only demo**. Auth, payments, and seat inventory are mocked — a production build would add a real backend (hashed passwords, a payment provider, transactional seat inventory with optimistic locking).

## License

Private project. © TNTBus.
