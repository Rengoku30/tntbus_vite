import type { City, Trip, TripStop, User, Seat } from "@/types/domain";
import { safeStorage } from "@/lib/storage";

export const CITIES: City[] = [
  { code: "NYC", name: "New York", station: "Port Authority Bus Terminal" },
  { code: "BOS", name: "Boston", station: "South Station Bus Terminal" },
  { code: "PHL", name: "Philadelphia", station: "Greyhound Terminal" },
  { code: "DC", name: "Washington", station: "Union Station" },
  { code: "CHI", name: "Chicago", station: "Union Station" },
  { code: "DET", name: "Detroit", station: "Michigan Central Station" },
  // Intermediate stops (used in itineraries, not selectable as origin/destination)
  { code: "STM", name: "Stamford", station: "Stamford Transportation Center, CT" },
  { code: "NHV", name: "New Haven", station: "New Haven Union Station, CT" },
  { code: "TOL", name: "Toledo", station: "Toledo Bus Station, OH" },
  { code: "PTT", name: "Pittsburgh", station: "Pittsburgh Greyhound Station, PA" },
];

export const cityByCode = (code: string): City | undefined =>
  CITIES.find((c) => c.code === code);

/** Cities a traveler can pick as origin/destination (excludes stop-overs). */
export const CITIES_SELECTABLE = CITIES.filter((c) =>
  ["NYC", "BOS", "PHL", "DC", "CHI", "DET"].includes(c.code),
);

export const DEMO_USER: User = {
  id: "u_demo",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1 (555) 000-0000",
  // "Password123!" — demo only; a real app must hash server-side.
  passwordHash: "Password123!",
  role: "customer",
  isDemo: true,
};

export const DEMO_ADMIN: User = {
  id: "u_admin",
  name: "Admin User",
  email: "admin@tntbus.com",
  phone: "+1 (555) 000-0001",
  // "Admin123!" — demo only; a real app must hash server-side.
  passwordHash: "Admin123!",
  role: "admin",
  isDemo: true,
};

/* ---------- Seat map generation ---------- */

const ROWS = 5;
const COLS = 4;
const PREMIUM_ROWS = [5];
const PREMIUM_PRICE_MULT = 1.2;

function buildSeats(basePrice: number): Seat[] {
  const seats: Seat[] = [];
  for (let row = 1; row <= ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const letter = String.fromCharCode(65 + col); // A,B,C,D
      const premium = PREMIUM_ROWS.includes(row);
      seats.push({
        id: `${row}${letter}`,
        row,
        col,
        premium,
        price: premium ? Math.round(basePrice * PREMIUM_PRICE_MULT) : basePrice,
      });
    }
  }
  return seats;
}

function seededPick(seedStr: string, count: number, from: string[]): string[] {
  let h = 0;
  for (const ch of seedStr) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = [...from];
  const out: string[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const idx = h % pool.length;
    out.push(pool[idx] as string);
    pool.splice(idx, 1);
  }
  return out;
}

function makeTrip(partial: Omit<Trip, "seats" | "bookedSeats">): Trip {
  const seats = buildSeats(partial.basePrice);
  const all = seats.map((s) => s.id);
  // Deterministic "already booked" set based on trip id + date so it's stable.
  const bookedSeats = seededPick(`${partial.id}:${partial.date}`, 6, all);
  return { ...partial, seats, bookedSeats };
}

/* ---------- Stop builders ---------- */

const stop = (
  cityCode: string,
  offsetMin: number,
  label: string,
  platform?: string,
): TripStop => {
  const c = cityByCode(cityCode);
  if (!c) throw new Error(`Unknown city code in seed: ${cityCode}`);
  return {
    cityCode,
    station: c.station,
    offsetMin,
    label,
    ...(platform ? { platform } : {}),
  };
};

/* ---------- Trips (one per day, per route) ---------- */

function tripsForDate(date: string): Trip[] {
  return [
    makeTrip({
      id: `trip_nyc_bos_104`,
      code: "Express 104",
      vehicle: "Volvo Multi-Axle Sleeper",
      kind: "express",
      origin: "NYC",
      destination: "BOS",
      date,
      departureHour: 8,
      departureMinute: 0,
      durationMin: 255, // 4h 15m
      stops: [
        stop("NYC", 0, "Departure", "Platform 42"),
        stop("STM", 105, "Brief Stop (10 mins)"),
        stop("NHV", 150, "Pickup Only"),
        stop("BOS", 255, "Final Destination"),
      ],
      amenities: ["wifi", "power", "ac"],
      basePrice: 45,
      fast: true,
    }),
    makeTrip({
      id: `trip_nyc_bos_110`,
      code: "Direct 110",
      vehicle: "Prevost X3-45",
      kind: "direct",
      origin: "NYC",
      destination: "BOS",
      date,
      departureHour: 9,
      departureMinute: 30,
      durationMin: 270,
      stops: [stop("NYC", 0, "Departure", "Platform 12"), stop("BOS", 270, "Final Destination")],
      amenities: ["wifi", "power"],
      basePrice: 42,
    }),
    makeTrip({
      id: `trip_nyc_bos_116`,
      code: "Express 116",
      vehicle: "Setra S 517 HD",
      kind: "express",
      origin: "NYC",
      destination: "BOS",
      date,
      departureHour: 11,
      departureMinute: 0,
      durationMin: 300,
      stops: [
        stop("NYC", 0, "Departure", "Platform 30"),
        stop("STM", 120, "Brief Stop"),
        stop("BOS", 300, "Final Destination"),
      ],
      amenities: ["wifi", "ac"],
      basePrice: 28,
    }),
    makeTrip({
      id: `trip_nyc_bos_night`,
      code: "Overnight 402",
      vehicle: "Volvo 9700 Sleeper",
      kind: "overnight",
      origin: "NYC",
      destination: "BOS",
      date,
      departureHour: 22,
      departureMinute: 30,
      durationMin: 255,
      stops: [
        stop("NYC", 0, "Departure", "Platform 42"),
        stop("STM", 75, "Brief Stop (10 mins)"),
        stop("NHV", 120, "Pickup Only"),
        stop("BOS", 255, "Final Destination"),
      ],
      amenities: ["wifi", "power", "ac", "restroom"],
      basePrice: 55,
      fast: true,
    }),
    makeTrip({
      id: `trip_phl_dc_210`,
      code: "Direct 210",
      vehicle: "MCI J4500",
      kind: "direct",
      origin: "PHL",
      destination: "DC",
      date,
      departureHour: 7,
      departureMinute: 15,
      durationMin: 180,
      stops: [stop("PHL", 0, "Departure", "Gate 4"), stop("DC", 180, "Final Destination")],
      amenities: ["wifi", "power", "ac"],
      basePrice: 38,
    }),
    makeTrip({
      id: `trip_phl_dc_214`,
      code: "Express 214",
      vehicle: "MCI J4500",
      kind: "express",
      origin: "PHL",
      destination: "DC",
      date,
      departureHour: 12,
      departureMinute: 0,
      durationMin: 150,
      stops: [stop("PHL", 0, "Departure", "Gate 4"), stop("DC", 150, "Final Destination")],
      amenities: ["wifi", "ac"],
      basePrice: 32,
    }),
    makeTrip({
      id: `trip_chi_det_310`,
      code: "Express 310",
      vehicle: "Van Hool TX45",
      kind: "express",
      origin: "CHI",
      destination: "DET",
      date,
      departureHour: 6,
      departureMinute: 45,
      durationMin: 300,
      stops: [
        stop("CHI", 0, "Departure", "Track 1"),
        stop("TOL", 150, "Brief Stop"),
        stop("DET", 300, "Final Destination"),
      ],
      amenities: ["wifi", "power", "ac", "restroom"],
      basePrice: 49,
    }),
    makeTrip({
      id: `trip_chi_det_318`,
      code: "Overnight 318",
      vehicle: "Volvo 9700 Sleeper",
      kind: "overnight",
      origin: "CHI",
      destination: "DET",
      date,
      departureHour: 23,
      departureMinute: 30,
      durationMin: 330,
      stops: [stop("CHI", 0, "Departure", "Track 3"), stop("DET", 330, "Final Destination")],
      amenities: ["wifi", "power", "restroom", "ac"],
      basePrice: 62,
    }),
    makeTrip({
      id: `trip_nyc_chi_400`,
      code: "Sleeper 400",
      vehicle: "Volvo 9700 Sleeper",
      kind: "sleeper",
      origin: "NYC",
      destination: "CHI",
      date,
      departureHour: 20,
      departureMinute: 0,
      durationMin: 1080,
      stops: [
        stop("NYC", 0, "Departure", "Platform 18"),
        stop("PHL", 120, "Brief Stop"),
        stop("PTT", 480, "Pickup Only"),
        stop("CHI", 1080, "Final Destination"),
      ],
      amenities: ["wifi", "power", "ac", "restroom"],
      basePrice: 89,
    }),
    makeTrip({
      id: `trip_det_chi_420`,
      code: "Direct 420",
      vehicle: "Van Hool TX45",
      kind: "direct",
      origin: "DET",
      destination: "CHI",
      date,
      departureHour: 10,
      departureMinute: 30,
      durationMin: 300,
      stops: [stop("DET", 0, "Departure", "Gate 2"), stop("CHI", 300, "Final Destination")],
      amenities: ["wifi", "power", "ac"],
      basePrice: 52,
    }),
  ];
}

/** Cache per date so repeated calls return stable trip objects. */
const tripCache = new Map<string, Trip[]>();

/**
 * Persist newly booked seats into the trip's booked set so availability
 * drops immediately (and stays dropped across reloads for the same date).
 * The mutation is applied per-date and re-applied on next load.
 */
const persistedBookingsKey = "tntbus:extra-booked";

export function mutateTripBookedSeats(tripId: string, seatIds: string[]): void {
  const map = safeStorage.get<Record<string, string[]>>(persistedBookingsKey) ?? {};
  const current = map[tripId] ?? [];
  map[tripId] = Array.from(new Set([...current, ...seatIds]));
  safeStorage.set(persistedBookingsKey, map);
}

function applyExtraBooked(trip: Trip): Trip {
  const map = safeStorage.get<Record<string, string[]>>(persistedBookingsKey) ?? {};
  const extra = map[trip.id];
  if (!extra || extra.length === 0) return trip;
  return { ...trip, bookedSeats: Array.from(new Set([...trip.bookedSeats, ...extra])) };
}

export function getTripsForDate(date: string): Trip[] {
  const cached = tripCache.get(date);
  if (cached) return cached;
  const trips = [...tripsForDate(date).map(applyExtraBooked), ...customTripsForDate(date)];
  tripCache.set(date, trips);
  return trips;
}

/* ---- Admin-created custom trips (merged into the catalog) ---- */

type TripSource = (date: string) => Trip[];
const customTripSources: TripSource[] = [];

/**
 * Register a provider of admin-created trips. Each provider returns the
 * custom trips available for a given date; they are merged into the catalog
 * by getTripsForDate so admin routes flow through search and booking.
 */
export function registerCustomTripSource(source: TripSource): void {
  customTripSources.push(source);
}

function customTripsForDate(date: string): Trip[] {
  const out: Trip[] = [];
  for (const source of customTripSources) {
    out.push(...source(date));
  }
  return out;
}

/** Drop the cache for a date so newly added custom trips are picked up. */
export function invalidateTripCache(date?: string): void {
  if (date) {
    tripCache.delete(date);
  } else {
    tripCache.clear();
  }
}

export function getTripById(id: string): Trip | undefined {
  // Trips are generated per-date; search the union of generated dates.
  const dates = [...tripCache.keys()];
  for (const d of dates) {
    const found = getTripsForDate(d).find((t) => t.id === id);
    if (found) return found;
  }
  return undefined;
}

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
