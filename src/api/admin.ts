import { mockHandler, request } from "./mockClient";
import { adminTripsStore, type CreateRouteInput, type AdminTripRecord } from "@/store/adminTripsStore";
import { bookingStore } from "@/store/bookingStore";
import { authStore } from "@/store/authStore";
import { adminError } from "@/lib/errors";
import type { Booking, User } from "@/types/domain";

/**
 * Admin API surface. Every mutation re-checks the caller's role inside the
 * store (defense in depth — the UI hides the entry point AND the store
 * refuses non-admins).
 */

function isAdmin(): boolean {
  const session = authStore.getSession();
  if (!session) return false;
  const user = authStore.getUserById(session.userId);
  return user?.role === "admin";
}

export interface BookingWithCustomer extends Booking {
  customer?: Pick<User, "id" | "name" | "email" | "phone" | "role">;
}

export const adminApi = {
  /** All bookings, newest first, with customer info attached. */
  async listAllBookings(): Promise<BookingWithCustomer[]> {
    return mockHandler(() => {
      if (!isAdmin()) throw adminError();
      const bookings = bookingStore.listAll();
      return bookings.map((b) => {
        const customer = authStore.getUserById(b.userId);
        return {
          ...b,
          customer: customer
            ? { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, role: customer.role }
            : undefined,
        };
      });
    })();
  },

  /** List admin-created routes. */
  async listRoutes(): Promise<AdminTripRecord[]> {
    return request(() => {
      if (!isAdmin()) throw adminError();
      return adminTripsStore.list();
    });
  },

  /** Create a route. */
  async createRoute(input: CreateRouteInput): Promise<AdminTripRecord> {
    return mockHandler(() => {
      if (!isAdmin()) throw adminError();
      return adminTripsStore.create(input);
    })();
  },

  /** Remove a route. */
  async removeRoute(id: string): Promise<void> {
    return mockHandler(() => {
      if (!isAdmin()) throw adminError();
      adminTripsStore.remove(id);
    })();
  },
};
