import { getTripsForDate, getTripById, todayIso } from "@/data/seed";
import type { Trip, SearchParams, Booking } from "@/types/domain";
import { safeStorage } from "@/lib/storage";
import { NotFoundError } from "@/lib/errors";

/** Read/search access to trips (the "catalog"). Seats mutate via bookingStore. */

export interface TripWithAvailability extends Trip {
  seatsLeft: number;
  availableSeats: string[];
}

function confirmedBookedSeats(tripId: string, date: string): Set<string> {
  const bookings = safeStorage.get<Booking[]>("tntbus:bookings") ?? [];
  const out = new Set<string>();
  for (const b of bookings) {
    if (b.tripId === tripId && b.date === date) {
      b.seats.forEach((s) => out.add(s));
    }
  }
  return out;
}

export function searchTrips(params: SearchParams): TripWithAvailability[] {
  const trips = getTripsForDate(params.date);
  const origin = params.origin.toUpperCase();
  const destination = params.destination.toUpperCase();
  return trips
    .filter((t) => t.origin === origin && t.destination === destination)
    .map((t) => availabilityFor(t));
}

/** Availability: total seats minus booked. Seat locks are not counted here
 *  because they're session-scoped and expire — only confirmed bookings count. */
export function availabilityFor(trip: Trip): TripWithAvailability {
  const booked = new Set([...trip.bookedSeats, ...confirmedBookedSeats(trip.id, trip.date)]);
  const availableSeats = trip.seats.filter((s) => !booked.has(s.id)).map((s) => s.id);
  return { ...trip, seatsLeft: availableSeats.length, availableSeats };
}

export function getTripOrThrow(id: string): Trip {
  const trip = getTripById(id);
  if (!trip) throw new NotFoundError("Trip not found", "We couldn't find that trip. It may have been removed.");
  return trip;
}

/** The trip a booking references, generated for the booking's date. */
export function getTripForBooking(tripId: string, date: string): Trip | null {
  const trip = getTripById(tripId);
  if (trip && trip.date === date) return trip;
  // Regenerate for the booking's own date.
  const trips = getTripsForDate(date);
  return trips.find((t) => t.id === tripId) ?? null;
}

export function upcomingTripDates(count = 7): string[] {
  const today = new Date(todayIso() + "T00:00:00");
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

/** Pre-warm the trip cache for the next N days (fast search, predictable tests). */
export function prewarmTrips(days = 7): void {
  upcomingTripDates(days).forEach((d) => getTripsForDate(d));
}

/* ---- recent searches (home page persistence) ---- */

const RECENT_KEY = "tntbus:recent-searches";

export interface RecentSearch {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  at: number;
}

export function getRecentSearches(): RecentSearch[] {
  return safeStorage.get<RecentSearch[]>(RECENT_KEY) ?? [];
}

export function addRecentSearch(search: RecentSearch): RecentSearch[] {
  const list = getRecentSearches().filter(
    (r) => !(r.origin === search.origin && r.destination === search.destination),
  );
  list.unshift(search);
  const trimmed = list.slice(0, 4);
  safeStorage.set(RECENT_KEY, trimmed);
  return trimmed;
}

export function clearRecentSearches(): void {
  safeStorage.remove(RECENT_KEY);
}
