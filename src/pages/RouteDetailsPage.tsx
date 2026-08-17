import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { searchApi } from "@/api/search";
import { bookingsApi } from "@/api/bookings";
import { bookingStore } from "@/store/bookingStore";
import { useAsync } from "@/lib/async";
import { env } from "@/config/env";
import { formatDate, formatDuration, formatTime } from "@/lib/format";
import { TransactionalLayout } from "@/components/layout/TransactionalLayout";
import { SeatMap } from "@/components/bus/SeatMap";
import { SeatLegend } from "@/components/bus/SeatLegend";
import { ItineraryTimeline } from "@/components/bus/ItineraryTimeline";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { CardSkeletonList } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { useToastContext } from "@/components/feedback/toast";
import type { Trip } from "@/types/domain";

export function RouteDetailsPage() {
  const { tripId = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToastContext();

  const passengers = Number(params.get("passengers") ?? "1") || 1;

  const { state, run } = useAsync(
    () => searchApi.getTrip(tripId),
    [tripId],
    Boolean(tripId),
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [lockExpired, setLockExpired] = useState(false);
  const [locking, setLocking] = useState(false);

  const trip: Trip | null = state.status === "success" ? state.data : null;

  // Lock seats when the trip loads and selection changes.
  useEffect(() => {
    if (state.status !== "success" || selected.length === 0 || !trip) return;
    let cancelled = false;
    setLocking(true);
    bookingsApi
      .lockSeats(trip.id, selected)
      .then(() => {
        if (!cancelled) setLocking(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLocking(false);
          toast.error("Couldn't reserve seats", "Please try again.");
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, trip?.id, selected.length > 0 ? selected.join(",") : ""]);

  // Release locks when leaving the page.
  useEffect(() => {
    return () => {
      if (selected.length > 0 && trip) {
        bookingsApi.releaseSeats(trip.id, selected).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id]);

  const lockedByOther = useMemo(
    () => (state.status === "success" && trip ? bookingStoreLocked(trip.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.status, trip?.id, selected.join(",")],
  );

  // Lock-expiry watcher: when the lock TTL passes, prompt to re-select.
  useEffect(() => {
    if (selected.length === 0) return;
    const t = window.setTimeout(() => {
      setLockExpired(true);
    }, env.seatLockTtlMs);
    return () => window.clearTimeout(t);
  }, [selected]);

  const toggleSeat = (seatId: string) => {
    setSelected((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : prev.length >= passengers ? prev : [...prev, seatId],
    );
  };

  const total = useMemo(() => {
    if (!trip || selected.length === 0) return 0;
    return selected.reduce((sum, id) => {
      const seat = trip.seats.find((s) => s.id === id);
      return sum + (seat?.price ?? 0);
    }, 0);
  }, [trip, selected]);

  const handleExpired = () => {
    setSelected([]);
    setLockExpired(false);
    toast.info("Seat selection reset", "Your seat hold expired. Please pick your seats again.");
  };

  const proceed = () => {
    if (!trip) return;
    navigate(`/checkout?tripId=${trip.id}&date=${trip.date}`, {
      state: { seats: selected, tripId: trip.id, date: trip.date },
    });
  };

  if (state.status === "loading" || state.status === "idle") {
    return (
      <TransactionalLayout>
        <CardSkeletonList count={2} />
      </TransactionalLayout>
    );
  }

  if (state.status === "error") {
    return (
      <TransactionalLayout>
        <ErrorBanner error={state.error} onRetry={run} />
      </TransactionalLayout>
    );
  }

  if (!trip) return null;

  return (
    <TransactionalLayout maxWidth="max-w-4xl">
      <div className="flex flex-col lg:flex-row gap-stack-lg pb-32">
        {/* Left: trip + itinerary */}
        <div className="w-full lg:w-1/2 flex flex-col gap-stack-md">
          <div className="bg-surface-container-low p-gutter rounded border border-surface-variant flex flex-col gap-unit">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-tertiary">
                  {trip.code}
                </h1>
                <p className="text-on-secondary-container text-label-sm font-label-sm mt-1 uppercase tracking-widest">
                  {trip.vehicle}
                </p>
              </div>
              <div className="bg-primary-container/10 px-3 py-1 rounded border border-primary-container text-primary-container text-label-bold font-label-bold flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
                  bolt
                </span>
                {trip.kind.toUpperCase()}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-stack-sm text-tertiary font-body-lg text-body-lg">
              <span className="font-bold">{trip.origin}</span>
              <span className="material-symbols-outlined text-primary-container" aria-hidden="true">
                arrow_forward
              </span>
              <span className="font-bold">{trip.destination}</span>
            </div>
            <div className="text-on-surface-variant text-body-md font-body-md">
              {formatDate(trip.date)}, {formatTime(trip.departureHour, trip.departureMinute)} •{" "}
              {formatDuration(trip.durationMin)} Duration
            </div>
          </div>

          <div className="bg-surface-container-low p-gutter rounded border border-surface-variant">
            <h2 className="text-headline-md font-headline-md text-tertiary mb-stack-md">Itinerary</h2>
            <ItineraryTimeline
              stops={trip.stops}
              departureHour={trip.departureHour}
              departureMinute={trip.departureMinute}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {trip.amenities.map((a) => (
              <span
                key={a}
                className="border border-outline-variant rounded px-3 py-1 flex items-center gap-2 text-on-surface text-label-sm font-label-sm"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
                  {a === "wifi" ? "wifi" : a === "power" ? "power" : a === "restroom" ? "wc" : "ac_unit"}
                </span>
                {a === "wifi" ? "Free WiFi" : a === "power" ? "Outlets" : a === "restroom" ? "Restroom" : "AC"}
              </span>
            ))}
          </div>
        </div>

        {/* Right: seat selection */}
        <div className="w-full lg:w-1/2 flex flex-col gap-stack-md">
          <div className="bg-surface-container-high p-gutter rounded border border-surface-variant flex flex-col h-full">
            <div className="flex justify-between items-center mb-stack-md pb-unit border-b border-outline-variant flex-wrap gap-2">
              <h2 className="text-headline-md font-headline-md text-tertiary">Select Seats</h2>
              <SeatLegend />
            </div>
            <SeatMap
              seats={trip.seats}
              bookedSeats={trip.bookedSeats}
              lockedByOther={lockedByOther}
              selectedSeats={selected}
              maxSelectable={passengers}
              onToggle={toggleSeat}
            />
          </div>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 w-full bg-surface-container-high border-t-2 border-primary-container p-4 md:px-container-margin md:py-6 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
          <div className="flex flex-col">
            <span className="text-on-surface-variant text-label-sm font-label-sm uppercase tracking-wider">
              {selected.length === 0
                ? "0 Seats Selected"
                : selected.length === 1
                  ? `Seat: ${selected[0]}`
                  : `Seats: ${selected.join(", ")}`}
            </span>
            <div className="flex items-end gap-1 mt-1">
              <span className="text-on-surface-variant text-body-md font-body-md leading-none mb-0.5">$</span>
              <span className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-primary-container leading-none">
                {total.toFixed(2)}
              </span>
            </div>
          </div>
          <button
            onClick={proceed}
            disabled={selected.length === 0 || locking}
            className={`px-8 py-3 rounded text-label-bold font-label-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
              selected.length === 0 || locking
                ? "bg-surface-variant text-on-surface-variant opacity-50 pointer-events-none"
                : "bg-primary-container text-on-primary-fixed hover:brightness-110 hover:-translate-y-1 shadow-lg"
            }`}
          >
            {locking && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            Proceed to Book
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
              arrow_forward
            </span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={lockExpired}
        title="Seat hold expired"
        message="Your seat hold has expired. Please select your seats again to continue."
        confirmLabel="Re-select seats"
        onConfirm={handleExpired}
        onCancel={handleExpired}
      />
    </TransactionalLayout>
  );
}

/** Locks held by OTHER sessions for a trip (drives SeatMap "unavailable"). */
function bookingStoreLocked(tripId: string): string[] {
  return bookingStore.lockedSeatIds(tripId);
}
