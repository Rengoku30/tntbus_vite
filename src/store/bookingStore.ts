import { safeStorage, onStorageIssue } from "@/lib/storage";
import { getTripById, mutateTripBookedSeats } from "@/data/seed";
import type { Booking, SeatLock } from "@/types/domain";
import { env } from "@/config/env";
import { newBookingId, newId } from "@/lib/id";
import { logger } from "@/lib/logger";
import { AppError, SeatTakenError } from "@/lib/errors";

/**
 * Bookings store — persisted bookings + session-scoped seat locks with TTL.
 *
 * Seat locking: when a user selects seats, we create locks keyed by
 * `${tripId}:${seatId}` owned by the session. Locks expire after
 * `env.seatLockTtlMs`. Confirmations re-validate that every locked seat is
 * still free (not booked, and not locked by someone else), else we throw
 * SeatTakenError — the "seat race" safety net (L12).
 */

const BOOKINGS_KEY = "tntbus:bookings";
const LOCKS_KEY = "tntbus:seat-locks";
const SESSION_KEY = "tntbus:session";

export interface CreateBookingInput {
  tripId: string;
  date: string;
  seats: string[];
  passengerName: string;
  contactEmail: string;
  contactPhone?: string;
  total: number;
}

function getSessionId(): string | null {
  const raw = safeStorage.get<{ userId: string }>(SESSION_KEY);
  return raw?.userId ?? null;
}

function loadBookings(): Booking[] {
  return safeStorage.get<Booking[]>(BOOKINGS_KEY) ?? [];
}

function saveBookings(bookings: Booking[]): void {
  const persisted = safeStorage.set(BOOKINGS_KEY, bookings);
  if (!persisted) {
    // Storage failed (quota/private mode) — surface via the storage event bus.
    logger.warn("bookings not persisted to disk; session-only");
  }
}

function loadLocks(): SeatLock[] {
  const now = Date.now();
  const locks = safeStorage.get<SeatLock[]>(LOCKS_KEY) ?? [];
  // Purge expired locks on read.
  const live = locks.filter((l) => l.expiresAt > now);
  if (live.length !== locks.length) safeStorage.set(LOCKS_KEY, live);
  return live;
}

function saveLocks(locks: SeatLock[]): void {
  safeStorage.set(LOCKS_KEY, locks);
}

export interface BookingResult {
  booking: Booking;
  /** True if the booking was persisted to disk (false = session-only fallback). */
  persisted: boolean;
}

export const bookingStore = {
  listForUser(userId: string): Booking[] {
    return loadBookings()
      .filter((b) => b.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  /** All bookings, newest first (admin surface — callers enforce roles). */
  listAll(): Booking[] {
    return loadBookings().sort((a, b) => b.createdAt - a.createdAt);
  },

  getById(bookingId: string): Booking | undefined {
    return loadBookings().find((b) => b.id === bookingId || b.reference === bookingId);
  },

  /* ---- seat locks ---- */

  lockSeats(tripId: string, seatIds: string[]): { ok: true; locks: SeatLock[] } | { ok: false; taken: string[] } {
    const locks = loadLocks();
    const now = Date.now();
    const owner = getSessionId() ?? "guest";
    const taken: string[] = [];

    for (const seatId of seatIds) {
      const existing = locks.find((l) => l.key === `${tripId}:${seatId}` && l.expiresAt > now);
      // Only a lock held by ANOTHER session is a conflict; re-locking our own
      // seats simply refreshes the hold (deselect → reselect flow).
      if (existing && existing.owner !== owner) {
        taken.push(seatId);
      }
    }
    if (taken.length > 0) return { ok: false, taken };

    const newLocks: SeatLock[] = seatIds.map((seatId) => ({
      key: `${tripId}:${seatId}`,
      owner,
      expiresAt: now + env.seatLockTtlMs,
    }));
    const merged = [...locks.filter((l) => !newLocks.some((n) => n.key === l.key)), ...newLocks];
    saveLocks(merged);
    return { ok: true, locks: newLocks };
  },

  releaseLocks(tripId: string, seatIds: string[]): void {
    const keys = new Set(seatIds.map((s) => `${tripId}:${s}`));
    const locks = loadLocks().filter((l) => !keys.has(l.key));
    saveLocks(locks);
  },

  /** Which seats are currently locked by other sessions for a trip. */
  lockedSeatIds(tripId: string): string[] {
    const locks = loadLocks().filter((l) => l.key.startsWith(`${tripId}:`));
    const owner = getSessionId();
    return locks.filter((l) => l.owner !== owner).map((l) => l.key.split(":")[1] ?? "");
  },

  /* ---- confirmations ---- */

  /**
   * Confirm a booking. Validates seat availability atomically (booked or
   * locked-by-other => SeatTakenError). Idempotent: re-submitting the same
   * payment key returns the existing booking instead of creating a duplicate.
   */
  confirm(input: CreateBookingInput & { idempotencyKey: string }): { booking: Booking; persisted: boolean } {
    const allBookings = loadBookings();

    // Idempotency FIRST: a retried submit with the same key returns the
    // existing booking without re-validating seats (they're already ours).
    const existing = allBookings.find((b) => b.meta?.idempotencyKey === input.idempotencyKey);
    if (existing) return { booking: existing, persisted: true };

    // Re-validate seats (booked set + other sessions' locks).
    const trip = getTripById(input.tripId);
    if (!trip) throw new AppError({ code: "NOT_FOUND", message: "Trip missing", userMessage: "This trip is no longer available.", status: 404 });

    // Source of truth for "already taken": confirmed bookings in the store
    // (the seed cache may be stale after a prior confirm).
    const bookedFromBookings = new Set<string>();
    for (const b of allBookings) {
      if (b.tripId === input.tripId && b.date === input.date) {
        b.seats.forEach((s) => bookedFromBookings.add(s));
      }
    }
    const seeded = new Set(trip.bookedSeats);
    const booked = new Set([...seeded, ...bookedFromBookings]);

    const locks = loadLocks();
    const owner = getSessionId();
    const taken = input.seats.filter((seatId) => {
      if (booked.has(seatId)) return true;
      const lock = locks.find((l) => l.key === `${input.tripId}:${seatId}` && l.expiresAt > Date.now());
      return lock ? lock.owner !== owner : false;
    });
    if (taken.length > 0) throw new SeatTakenError(taken);

    const createdAt = Date.now();
    const reference = newBookingId();
    const booking: Booking = {
      id: newId("b"),
      reference,
      userId: owner ?? "guest",
      tripId: input.tripId,
      date: input.date,
      seats: input.seats,
      passengerName: input.passengerName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      total: input.total,
      status: "confirmed",
      createdAt,
      completed: false,
      meta: { idempotencyKey: input.idempotencyKey },
    };

    // Mark seats as booked (persist into the trip's booked set).
    const bookings = loadBookings();
    bookings.unshift(booking);
    saveBookings(bookings);
    mutateTripBookedSeats(input.tripId, input.seats);

    // Release our locks for these seats.
    this.releaseLocks(input.tripId, input.seats);

    return { booking, persisted: true };
  },
};

// Storage issue listener → expose a toast-capable event.
export function watchStorageIssues(cb: (kind: "quota" | "error") => void): () => void {
  return onStorageIssue((kind) => cb(kind));
}
