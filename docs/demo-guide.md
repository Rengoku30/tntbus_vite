# Demo Guide

How to run TNTBus and demo every screen — including the error paths that show off the error-handling system.

## 1. Run it

```bash
npm install
npm run dev        # → http://localhost:5173
```

For a production check:

```bash
npm run build
npm run preview    # → http://localhost:4173
```

## 2. Happy path (5 minutes)

1. **Home** — pick Origin `NYC (New York)`, Destination `BOS (Boston)`, choose a **future** date, 2 passengers → **Search Buses**.
2. **Results** — try the sort options and amenity chips; pick a bus (a "Selling Fast" card works great) → **Select Seat**.
3. **Route details** — select 2 seats (premium row 5 is orange and pricier); watch the sticky bar total update → **Proceed to Book**.
4. **Login** (you'll be redirected if signed out) — use the demo account:
   - Email: `john@example.com` · Password: `Password123!`
5. **Checkout** — passenger fields prefill from the profile. Card:
   - Number: `4242 4242 4242 4242` · Expiry: any future date (`12/30`) · CVV: `123`
   - → **Pay** → **Payment Successful**.
6. **Confirmed** — see the ticket + QR. **Download Ticket** saves a `.txt`; **Return Home** goes back.
7. **My Bookings** — the booking is under **Upcoming**; **View Ticket** reopens it.
8. **Profile** — change the avatar, open settings, then **Logout** (confirm).

## 3. Register & forgot password

- **Register** — create a fresh account (password strength meter + terms required); you're auto-logged-in.
- **Forgot password** — enter any email; the app always shows "Reset link sent" (no account enumeration).

## 4. Error paths (the fun part)

| Scenario | How to trigger | What you should see |
| --- | --- | --- |
| **Form validation** | Submit empty / bad email / origin = destination / past date | Inline field errors, `aria-invalid`, focus jumps to first invalid field |
| **Password strength** | Type in Register | Live meter: weak → strong |
| **Network failure + retry** | Create `.env` with `VITE_API_FAILURE_RATE=0.4`, restart dev, search repeatedly | Error banner "Something went wrong on our end" + **Retry**; retries back off and eventually succeed |
| **Offline** | DevTools → Network → Offline, then search | Sticky offline banner; API calls fail with a network message; go back online → banner clears |
| **Payment decline** | Checkout with card `4000 0000 0000 0002` | "Your card was declined" inline error; **no booking created**; retry with the good card works |
| **Card validation** | Enter `1234 5678 9012 3456` (fails Luhn) or an expired date | Field errors, payment blocked |
| **Seat race (two tabs)** | Open two tabs → same trip → pick the same seat in both → confirm both | Second buyer gets "Seat X was just taken" and is routed back to re-select |
| **Seat hold expiry** | Set `VITE_SEAT_LOCK_TTL_MS=15000` in `.env`, select a seat, wait 15 s | Dialog: "Your seat hold has expired — please re-select" |
| **Double-submit** | Spam **Pay** on checkout | Only one booking created (idempotency key); button disabled while pending |
| **404** | Visit `/nope` | On-brand not-found page |
| **Stale booking id** | Visit `/booking-confirmed/does-not-exist` | Not-found page (no crash, no fake success) |
| **Foreign booking** | Log in as another user, visit your own booking id | Not-found page (ownership guard) |
| **Protected route** | Logged out, visit `/my-bookings` | Redirect to `/login?next=/my-bookings`, returns after login |
| **Storage full** | DevTools → Application → fill localStorage to quota | Toast "We couldn't save your data…" but the session keeps working |
| **Avatar image error** | Upload a corrupt image file | Falls back to initials avatar |

## 5. Configuration cheat sheet

```bash
# .env (copy from .env.example)
VITE_API_FAILURE_RATE=0.4      # force ~40% of mock calls to fail (retry UI)
VITE_API_LATENCY_MS=350        # artificial network latency
VITE_SEAT_LOCK_TTL_MS=15000    # short seat-hold for demoing expiry
VITE_DEBUG_FAILURES=false      # occasionally simulate timeouts in dev
```

Restart `npm run dev` after changing `.env`.

## 6. Development tips

- **Typecheck**: `npm run typecheck`
- **Build**: `npm run build` (typecheck + bundle; output in `dist/`)
- **Design tokens**: everything stems from `tailwind.config.ts` — change a color once and every page follows (see `docs/architecture.md`).
- **Seed data**: `src/data/seed.ts` — trips are generated deterministically per date, so demos are reproducible.
- **Reset demo state**: clear site data / localStorage (`tntbus:*` keys) to restore the pristine seed.
