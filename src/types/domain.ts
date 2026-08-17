/** Shared domain types for TNTBus. */

export type TripKind = "express" | "sleeper" | "direct" | "overnight";

export type Amenity = "wifi" | "power" | "restroom" | "ac";

export interface City {
  code: string;
  name: string;
  station: string;
}

export interface TripStop {
  cityCode: string;
  station: string;
  /** Minutes offset from the trip's departure time (0 = origin). */
  offsetMin: number;
  label: string; // "Departure", "Brief Stop", "Pickup Only", "Final Destination"
  platform?: string;
}

export interface Seat {
  id: string; // "1A", "2C"…
  row: number;
  col: number; // 0-3 across the 4-col grid
  premium: boolean;
  price: number;
}

export interface Trip {
  id: string;
  code: string; // "Express 402"
  vehicle: string; // "Volvo Multi-Axle Sleeper"
  kind: TripKind;
  origin: string; // city code
  destination: string; // city code
  /** ISO date the schedule is generated for. */
  date: string;
  departureHour: number;
  departureMinute: number;
  durationMin: number;
  stops: TripStop[];
  amenities: Amenity[];
  basePrice: number;
  seats: Seat[];
  /** Pre-booked seats (IDs) — stable per trip. */
  bookedSeats: string[];
  fast?: boolean;
  /** True when the route was created by an admin (vs. seeded). */
  adminCreated?: boolean;
}

export interface TripWithAvailability extends Trip {
  seatsLeft: number;
  availableSeats: string[];
}

export interface SearchParams {
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD
  passengers: number;
}

/** User roles — admins can manage routes and view all bookings. */
export type UserRole = "customer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string; // NOTE: demo only — never ship real auth this way.
  role: UserRole;
  isDemo?: boolean;
}

export type BookingStatus = "confirmed" | "completed";

export interface Booking {
  id: string; // internal id
  reference: string; // user-facing, e.g. "TNT-847291"
  userId: string;
  tripId: string;
  date: string;
  seats: string[];
  passengerName: string;
  contactEmail: string;
  contactPhone?: string;
  total: number;
  status: BookingStatus;
  createdAt: number;
  /** True when the date has passed. */
  completed?: boolean;
  /** Internal-only fields (never rendered). */
  meta?: {
    idempotencyKey: string;
  };
}

export interface PaymentResult {
  booking: Booking;
  transactionId: string;
}

export interface SeatLock {
  key: string; // `${tripId}:${seatId}`
  owner: string; // session id
  expiresAt: number;
}

export interface Session {
  userId: string;
  token: string;
  createdAt: number;
}
