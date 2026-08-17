import { safeStorage } from "@/lib/storage";
import { registerCustomTripSource, invalidateTripCache } from "@/data/seed";
import type { Trip, Amenity, TripStop, TripKind } from "@/types/domain";
import { adminError, ValidationError } from "@/lib/errors";
import { newId } from "@/lib/id";
import { logger } from "@/lib/logger";

/**
 * Admin trips store — routes created by admins, persisted to localStorage.
 *
 * Custom trips are registered as a source in the seed catalog via
 * `registerCustomTripSource`, so they appear in customer searches and the
 * booking flow exactly like generated trips. The trip cache for the
 * affected date is invalidated on write so changes show up immediately.
 */

const CUSTOM_TRIPS_KEY = "tntbus:admin-trips";

export interface AdminTripRecord {
  id: string;
  code: string;
  vehicle: string;
  kind: TripKind;
  origin: string; // city code
  destination: string; // city code
  /** ISO dates this route runs on (empty = all dates). */
  dates: string[];
  departureHour: number;
  departureMinute: number;
  durationMin: number;
  stops: TripStop[];
  amenities: Amenity[];
  basePrice: number;
  createdAt: number;
}

function loadCustomTrips(): AdminTripRecord[] {
  return safeStorage.get<AdminTripRecord[]>(CUSTOM_TRIPS_KEY) ?? [];
}

function saveCustomTrips(records: AdminTripRecord[]): void {
  safeStorage.set(CUSTOM_TRIPS_KEY, records);
}

/** The current user (read from the session) — used for role checks. */
function currentUserRole(): string | null {
  const session = safeStorage.get<{ userId: string }>("tntbus:session");
  if (!session) return null;
  const users = safeStorage.get<Array<{ id: string; role?: string }>>("tntbus:users") ?? [];
  return users.find((u) => u.id === session.userId)?.role ?? null;
}

function requireAdmin(): void {
  const role = currentUserRole();
  if (role !== "admin") throw adminError();
}

/** Build a full Trip (with seat map) from an admin record. */
function materializeTrip(record: AdminTripRecord, date: string): Trip {
  const seats = buildSeats(record.basePrice);
  return {
    id: record.id,
    code: record.code,
    vehicle: record.vehicle,
    kind: record.kind,
    origin: record.origin,
    destination: record.destination,
    date,
    departureHour: record.departureHour,
    departureMinute: record.departureMinute,
    durationMin: record.durationMin,
    stops: record.stops,
    amenities: record.amenities,
    basePrice: record.basePrice,
    seats,
    bookedSeats: [],
    adminCreated: true,
  };
}

function buildSeats(basePrice: number): Trip["seats"] {
  const seats: Trip["seats"] = [];
  const ROWS = 5;
  const COLS = 4;
  for (let row = 1; row <= ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const letter = String.fromCharCode(65 + col);
      const premium = row === 5;
      seats.push({
        id: `${row}${letter}`,
        row,
        col,
        premium,
        price: premium ? Math.round(basePrice * 1.2) : basePrice,
      });
    }
  }
  return seats;
}

// Register the catalog source at module load.
registerCustomTripSource((date) => {
  const records = loadCustomTrips();
  return records
    .filter((r) => r.dates.length === 0 || r.dates.includes(date))
    .map((r) => materializeTrip(r, date));
});

export interface CreateRouteInput {
  code: string;
  vehicle: string;
  kind: TripKind;
  origin: string;
  destination: string;
  dates: string[];
  departureHour: number;
  departureMinute: number;
  durationMin: number;
  /** Optional custom itinerary; defaults to origin → destination. */
  stops?: TripStop[];
  amenities: Amenity[];
  basePrice: number;
}

function defaultStops(origin: string, destination: string, durationMin: number): TripStop[] {
  const originCity = CITY_CODES_BY_CODE[origin];
  const destCity = CITY_CODES_BY_CODE[destination];
  return [
    {
      cityCode: origin,
      station: originCity?.station ?? origin,
      offsetMin: 0,
      label: "Departure",
      platform: "TBD",
    },
    {
      cityCode: destination,
      station: destCity?.station ?? destination,
      offsetMin: durationMin,
      label: "Final Destination",
    },
  ];
}

// Small lookup so stops show proper station names without importing the seed.
const CITY_CODES_BY_CODE: Record<string, { station: string }> = {
  NYC: { station: "Port Authority Bus Terminal" },
  BOS: { station: "South Station Bus Terminal" },
  PHL: { station: "Greyhound Terminal" },
  DC: { station: "Union Station" },
  CHI: { station: "Union Station" },
  DET: { station: "Michigan Central Station" },
};

export const adminTripsStore = {
  /** All custom routes (any role can view if already authenticated — used for admin UI only). */
  list(): AdminTripRecord[] {
    return loadCustomTrips();
  },

  /** Create a route. Throws ForbiddenError unless the caller is an admin. */
  create(input: CreateRouteInput): AdminTripRecord {
    requireAdmin();
    const records = loadCustomTrips();
    const code = input.code.trim().toUpperCase();
    if (records.some((r) => r.code === code)) {
      throw new ValidationError("A route with this code already exists", `Route code ${code} already exists.`);
    }
    const record: AdminTripRecord = {
      id: newId("trip"),
      code,
      vehicle: input.vehicle.trim(),
      kind: input.kind,
      origin: input.origin.toUpperCase(),
      destination: input.destination.toUpperCase(),
      dates: [...new Set(input.dates)],
      departureHour: input.departureHour,
      departureMinute: input.departureMinute,
      durationMin: input.durationMin,
      stops: input.stops ?? defaultStops(input.origin.toUpperCase(), input.destination.toUpperCase(), input.durationMin),
      amenities: input.amenities,
      basePrice: input.basePrice,
      createdAt: Date.now(),
    };
    records.push(record);
    saveCustomTrips(records);
    // Invalidate every cached date the route applies to.
    if (record.dates.length === 0) invalidateTripCache();
    else record.dates.forEach((d) => invalidateTripCache(d));
    logger.info("admin created route", record.code);
    return record;
  },

  /** Remove a route. Throws ForbiddenError unless the caller is an admin. */
  remove(id: string): void {
    requireAdmin();
    const records = loadCustomTrips();
    const record = records.find((r) => r.id === id);
    if (!record) return;
    const next = records.filter((r) => r.id !== id);
    saveCustomTrips(next);
    if (record.dates.length === 0) invalidateTripCache();
    else record.dates.forEach((d) => invalidateTripCache(d));
    logger.info("admin removed route", record.code);
  },
};
