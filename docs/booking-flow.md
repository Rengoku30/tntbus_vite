# Booking Flow

The complete journey from "Where are you going?" to "Payment Successful", including the safety mechanisms (seat locks, idempotent payment) that make it behave like a real booking system.

## Flow diagram

```
 Home                    Search Results          Route Details           Checkout                 Booking Confirmed
 ─────                   ──────────────          ─────────────           ────────                 ─────────────────
 search form      ──▶   loading skeleton   ──▶   trip + itinerary  ──▶   passenger form     ──▶   ticket card + QR
 (zod validated)        error + retry           interactive seat       card form (Luhn)          download ticket
 origin ≠ dest          empty state             map                    mock pay / decline
 date not past          sort + filters          live total              seat re-validation
                        Select Seat             seat locks (TTL)       idempotency key
                                                lock-expiry dialog      booking created
```

## Step by step

### 1. Home → search

- Zod `searchSchema` validates origin ≠ destination, date not in the past, passengers 1–9.
- On success the search is saved to **recent searches** (localStorage, max 4) and the app navigates to `/search-results?origin=NYC&destination=BOS&date=…&passengers=1`.
- Popular-route cards and recent-search chips deep-link with the same query shape.

### 2. Search results

- Reads query params; calls `searchApi.search()`.
- Renders **skeleton → error banner (Retry) → empty state → cards** based on the async state.
- Client-side controls: sort (Recommended / Fastest / Cheapest / Early Departure) and amenity chips (Wi-Fi / Power / Restroom / AC). Filters compose — a trip must include *all* selected amenities.
- Each `BusCard` shows times, duration, amenities, seats left ("Selling Fast" badge at ≤4), price, and a **Select Seat** button (disabled when sold out).

### 3. Route details + seat selection

- Left column: trip summary (code, vehicle, kind badge), itinerary timeline (departure / stops / destination with platform numbers), amenity chips.
- Right column: **SeatMap** — a 4-column grid with a driver area and aisle marker, exactly like the mockup.
  - **Available** (yellow outline) · **Booked** (grey, disabled, from seed + confirmed bookings) · **Selected** (yellow fill) · **Premium** (orange outline, star, higher price)
  - Selection is capped at the passenger count.
- Selecting seats calls `bookingsApi.lockSeats()` → creates TTL seat locks owned by this session.
- A TTL timer runs while seats are selected; on expiry a dialog offers to re-select.
- Sticky bottom bar shows the live count and total; **Proceed to Book** navigates to `/checkout` with the seats in router state (and the same data in the URL query so a refresh doesn't lose the trip).

### 4. Checkout (protected)

- **ProtectedRoute**: guests are redirected to `/login?next=/checkout` and returned after sign-in.
- Re-loads the trip and filters the seat list to the selected ids; the total is computed from actual seat prices (server-side, not from the URL).
- Passenger details + card form, all zod-validated:
  - card number passes the **Luhn checksum** (`validation/schemas.ts` + `api/payments.ts`)
  - expiry must be in the future (`MM/YY`)
  - CVV 3–4 digits; phone optional but validated when present
- On submit:
  1. `paymentsApi.charge()` — mock gateway. **Idempotency key** generated per attempt. `4242 4242 4242 4242` succeeds; `4000 0000 0000 0002` declines with a `PaymentDeclinedError`; any invalid-Luhn number declines too.
  2. `bookingsApi.confirm()` — re-validates every seat against *confirmed bookings + other sessions' locks*. If a seat was taken in the meantime → `SeatTakenError` → inline banner + route back to re-select. Same idempotency key → returns the existing booking (no duplicate).
  3. On success → navigate to `/booking-confirmed/<bookingId>`.

### 5. Booking confirmed (guarded)

- Loads the booking by id; renders the ticket **only if** it exists **and** `booking.userId === currentUser.id`. Typing someone else's (or a fake) id shows the not-found page — no "fake success" by URL.
- Ticket card: route, times, date, passenger, bus number, seats, total paid, and a **QR code** encoding `TNTBUS|<reference>|<seats>`.
- **Download Ticket** serializes the details to a text Blob and triggers a browser download (wrapped in try/catch → toast on failure).
- QR render is guarded: if it throws, a branded placeholder shows instead.

### 6. My bookings

- Upcoming / Past tabs. A booking is "past" when its travel date is before today.
- Each card shows reference, status badge (Confirmed / Completed), route, departure, seats, and total; **View Ticket** opens the confirmed page for that booking.
- Empty states per tab with a CTA back to search.

### 7. Profile & logout

- Avatar: file picker → object URL preview; `onError` falls back to initials.
- Settings list: *My Bookings* navigates; the rest toast "Coming soon".
- **Logout** asks for confirmation, clears the session, and returns to `/login`.

## Safety mechanisms recap

| Mechanism | Why |
| --- | --- |
| Seat locks with TTL | Prevents two buyers selecting the same seat simultaneously |
| Cross-session lock check | A different user sees your held seat as unavailable |
| Re-validation at confirm | Closes the gap between seat selection and payment |
| Idempotency key | Double-submit or retry can't create two bookings / two charges |
| Booking ownership guard | `/booking-confirmed/:id` is only valid for the owner |
| Seed + confirmed-union availability | A sold seat stays sold even after a page reload |

## Known behaviors worth knowing

- Seat locks are **session-scoped**: a different browser/tab has a different "owner", so the race test works by opening two tabs and picking the same seat.
- Confirmed bookings persist in localStorage and are unioned into availability everywhere, so refresh after purchase shows the seat as sold.
- Recent searches are capped at 4 and de-duplicated by route pair.
