import { mockHandler, request } from "./mockClient";
import { bookingStore, type CreateBookingInput } from "@/store/bookingStore";
import type { Booking } from "@/types/domain";
import { NotFoundError } from "@/lib/errors";

/** Bookings API surface. */

export const bookingsApi = {
  async listForUser(userId: string): Promise<Booking[]> {
    return mockHandler(() => bookingStore.listForUser(userId))();
  },

  async getById(bookingId: string): Promise<Booking> {
    return mockHandler(() => {
      const booking = bookingStore.getById(bookingId);
      if (!booking) {
        throw new NotFoundError("Booking not found", "We couldn't find that booking. It may have been removed.");
      }
      return booking;
    })();
  },

  async lockSeats(tripId: string, seatIds: string[]) {
    return mockHandler(() => bookingStore.lockSeats(tripId, seatIds))();
  },

  async releaseSeats(tripId: string, seatIds: string[]) {
    return request(() => bookingStore.releaseLocks(tripId, seatIds));
  },

  async confirm(input: CreateBookingInput & { idempotencyKey: string }) {
    return mockHandler(() => bookingStore.confirm(input))();
  },
};
