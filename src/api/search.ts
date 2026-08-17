import { mockHandler } from "./mockClient";
import { searchTrips, getTripOrThrow, availabilityFor } from "@/store/searchStore";
import type { SearchParams, TripWithAvailability } from "@/types/domain";

/** Search/catalog API surface. */

export const searchApi = {
  async search(params: SearchParams): Promise<TripWithAvailability[]> {
    return mockHandler(() => searchTrips(params))();
  },

  /** Single trip with live availability, for the seat-selection page. */
  async getTrip(id: string): Promise<TripWithAvailability> {
    return mockHandler(() => {
      const trip = getTripOrThrow(id);
      return availabilityFor(trip);
    })();
  },
};
