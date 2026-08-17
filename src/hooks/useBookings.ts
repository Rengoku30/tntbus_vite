import { useEffect, useState } from "react";
import { bookingStore } from "@/store/bookingStore";
import type { Booking } from "@/types/domain";

/**
 * Reactive bookings list for the current user. Re-reads on `storage` events
 * (cross-tab) and on a local tick so newly created bookings appear.
 */
export function useBookings(userId: string | null): Booking[] {
  const [bookings, setBookings] = useState<Booking[]>(() =>
    userId ? bookingStore.listForUser(userId) : [],
  );

  useEffect(() => {
    if (!userId) {
      setBookings([]);
      return;
    }
    const refresh = () => setBookings(bookingStore.listForUser(userId));
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [userId]);

  return bookings;
}
