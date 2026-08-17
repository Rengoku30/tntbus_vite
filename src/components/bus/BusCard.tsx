import type { TripWithAvailability } from "@/types/domain";
import { formatCurrency, formatDuration, formatTime } from "@/lib/format";
import { cityByCode } from "@/data/seed";

const AMENITY_ICONS: Record<string, string> = {
  wifi: "wifi",
  power: "power",
  restroom: "wc",
  ac: "ac_unit",
};

/** Result-list bus card (matches the search-results mockup). */
export function BusCard({
  trip,
  onSelect,
  loading = false,
}: {
  trip: TripWithAvailability;
  onSelect: () => void;
  loading?: boolean;
}) {
  const origin = cityByCode(trip.origin);
  const dest = cityByCode(trip.destination);
  const arrHour = (trip.departureHour + Math.floor(trip.durationMin / 60)) % 24;
  const sellingFast = trip.seatsLeft <= 4;
  const soldOut = trip.seatsLeft === 0;

  return (
    <article
      className={`bg-[#1A1A1A] rounded-lg p-4 relative overflow-hidden transition-all ${
        sellingFast ? "border-2 border-primary-container" : "border border-[#333333] hover:border-surface-variant"
      } ${soldOut ? "opacity-60" : ""}`}
    >
      {sellingFast && (
        <div className="absolute top-0 right-0 bg-error text-on-error text-label-sm font-label-sm px-3 py-1 rounded-bl-lg font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            local_fire_department
          </span>
          Selling Fast
        </div>
      )}
      {soldOut && (
        <div className="absolute top-0 right-0 bg-surface-variant text-on-surface text-label-sm font-label-sm px-3 py-1 rounded-bl-lg font-bold">
          Sold Out
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between gap-4 mt-2">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <div className="text-center">
              <div className={`text-headline-md font-headline-md ${sellingFast ? "text-primary-container" : "text-tertiary"}`}>
                {formatTime(trip.departureHour, trip.departureMinute)}
              </div>
              <div className="text-label-sm font-label-sm text-on-surface-variant">{trip.origin}</div>
            </div>

            <div className="flex-1 flex flex-col items-center relative min-w-[100px]">
              <div className="text-label-sm font-label-sm text-on-secondary-container mb-1">
                {formatDuration(trip.durationMin)}
              </div>
              <div className="w-full h-[2px] bg-surface-variant relative">
                <div
                  className={`absolute inset-0 ${sellingFast ? "bg-primary-container" : "bg-[#333333]"}`}
                />
                <div className="absolute left-1/2 -top-[10px] -translate-x-1/2 bg-[#1A1A1A] px-1">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      sellingFast ? "text-primary-container" : "text-on-surface-variant"
                    }`}
                    aria-hidden="true"
                  >
                    directions_bus
                  </span>
                </div>
              </div>
              <div className="text-label-sm font-label-sm text-on-secondary-container mt-1">
                {trip.stops.length <= 2 ? "Direct" : `${trip.stops.length - 2} Stop${trip.stops.length > 3 ? "s" : ""}`}
              </div>
            </div>

            <div className="text-center">
              <div className={`text-headline-md font-headline-md ${sellingFast ? "text-primary-container" : "text-tertiary"}`}>
                {formatTime(arrHour, trip.departureMinute)}
              </div>
              <div className="text-label-sm font-label-sm text-on-surface-variant">{trip.destination}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {trip.amenities.map((a) => (
              <span
                key={a}
                className="bg-surface-variant text-tertiary text-label-sm font-label-sm px-2 py-1 rounded flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                  {AMENITY_ICONS[a]}
                </span>
                {a === "wifi" ? "Wi-Fi" : a === "power" ? "Outlets" : a === "restroom" ? "Restroom" : "AC"}
              </span>
            ))}
            <span
              className={`text-label-sm font-label-sm flex items-center gap-1 font-bold ${
                sellingFast ? "text-primary-container" : "text-on-secondary-container"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                event_seat
              </span>
              {trip.seatsLeft === 0
                ? "Sold out"
                : `${trip.seatsLeft} Seat${trip.seatsLeft > 1 ? "s" : ""} Left`}
            </span>
          </div>
        </div>

        <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end md:w-48 md:border-l border-outline-variant md:pl-4">
          <div className="text-right">
            <div className="text-label-sm font-label-sm text-on-surface-variant line-through">
              {formatCurrency(trip.basePrice * 1.1)}
            </div>
            <div className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-tertiary leading-none mb-1">
              {formatCurrency(trip.basePrice)}
            </div>
            <div className="text-label-sm font-label-sm text-on-secondary-container">Per person</div>
          </div>
          <button
            onClick={onSelect}
            disabled={soldOut || loading}
            className={`font-label-bold text-label-bold py-3 px-6 rounded w-auto md:w-full mt-0 md:mt-4 transition-all ${
              soldOut
                ? "bg-surface-variant text-on-surface-variant cursor-not-allowed"
                : "bg-primary-container text-on-primary-fixed hover:opacity-90 active:scale-[0.98]"
            }`}
          >
            {soldOut ? "Sold Out" : "Select Seat"}
          </button>
        </div>
      </div>

      {/* Visually-hidden route line for a11y */}
      <p className="sr-only">
        {trip.code} from {origin?.name} to {dest?.name}, departing{" "}
        {formatTime(trip.departureHour, trip.departureMinute)}, {trip.seatsLeft} seats left.
      </p>
    </article>
  );
}
