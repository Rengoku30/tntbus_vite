import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBookings } from "@/hooks/useBookings";
import { getTripForBooking } from "@/store/searchStore";
import { cityByCode } from "@/data/seed";
import { formatDate, formatTime, formatCurrency } from "@/lib/format";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge } from "@/components/ui/Badge";
import type { Booking } from "@/types/domain";

type Tab = "upcoming" | "past";

function isPast(booking: Booking): boolean {
  const today = new Date();
  const d = new Date(`${booking.date}T00:00:00`);
  return d.getTime() < today.setHours(0, 0, 0, 0);
}

export function MyBookingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const bookings = useBookings(user?.id ?? null);
  const [tab, setTab] = useState<Tab>("upcoming");

  const { upcoming, past } = useMemo(() => {
    const up: Booking[] = [];
    const pa: Booking[] = [];
    for (const b of bookings) {
      if (isPast(b)) pa.push(b);
      else up.push(b);
    }
    return { upcoming: up, past: pa };
  }, [bookings]);

  const visible = tab === "upcoming" ? upcoming : past;

  return (
    <AppShell>
      <h1 className="font-headline-xl text-headline-xl text-primary font-black uppercase tracking-tighter mb-stack-lg">
        My Bookings
      </h1>

      {/* Tabs */}
      <div className="flex border-b border-surface-container-highest mb-stack-lg">
        <button
          onClick={() => setTab("upcoming")}
          aria-selected={tab === "upcoming"}
          role="tab"
          className={`flex-1 pb-unit border-b-2 text-label-bold font-label-bold transition-colors ${
            tab === "upcoming"
              ? "border-primary-fixed text-primary-fixed"
              : "border-transparent text-secondary-fixed-dim"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setTab("past")}
          aria-selected={tab === "past"}
          role="tab"
          className={`flex-1 pb-unit border-b-2 text-label-bold font-label-bold transition-colors ${
            tab === "past"
              ? "border-primary-fixed text-primary-fixed"
              : "border-transparent text-secondary-fixed-dim"
          }`}
        >
          Past
        </button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={tab === "upcoming" ? "confirmation_number" : "history"}
          title={tab === "upcoming" ? "No upcoming trips" : "No past trips"}
          message={
            tab === "upcoming"
              ? "Book your next journey and it'll show up here."
              : "Completed trips will appear here."
          }
          action={
            <Link
              to="/"
              className="text-primary-container font-label-bold text-label-bold hover:underline"
            >
              Search buses
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-stack-md">
          {visible.map((b) => {
            const trip = getTripForBooking(b.tripId, b.date);
            const isUpcoming = !isPast(b);
            const origin = cityByCode(trip?.origin ?? "");
            const dest = cityByCode(trip?.destination ?? "");
            return (
              <article
                key={b.id}
                className="bg-[#1A1A1A] p-stack-md rounded flex flex-col gap-stack-sm border border-surface-container-highest relative overflow-hidden"
              >
                <div className="flex justify-between items-center mb-unit">
                  <span className="bg-surface-container text-secondary-fixed-dim px-2 py-1 rounded-sm font-label-sm text-label-sm uppercase tracking-wider">
                    ID: {b.reference}
                  </span>
                  <Badge kind={isUpcoming ? "success" : "info"} icon={isUpcoming ? "check_circle" : "history"}>
                    {isUpcoming ? "Confirmed" : "Completed"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-headline-md text-headline-md md:text-headline-lg font-black text-on-surface">
                      {trip?.origin ?? "—"}
                    </span>
                    <span className="text-secondary-fixed-dim font-body-md text-body-md">
                      {origin?.name ?? "Unknown"}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center justify-center px-4 relative">
                    <div className="h-[2px] bg-surface-container-highest w-full absolute top-1/2 -translate-y-1/2" />
                    <span
                      className="material-symbols-outlined text-primary-fixed relative z-10 bg-[#1A1A1A] px-2 fill-icon"
                      aria-hidden="true"
                    >
                      directions_bus
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="font-headline-md text-headline-md md:text-headline-lg font-black text-on-surface">
                      {trip?.destination ?? "—"}
                    </span>
                    <span className="text-secondary-fixed-dim font-body-md text-body-md">
                      {dest?.name ?? "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-stack-sm bg-surface-container-low p-stack-sm rounded">
                  <div className="flex flex-col">
                    <span className="text-secondary-fixed-dim font-label-sm text-label-sm uppercase">Departure</span>
                    <span className="text-primary-fixed font-label-bold text-body-lg font-bold">
                      {formatDate(b.date)} • {trip ? formatTime(trip.departureHour, trip.departureMinute) : ""}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-secondary-fixed-dim font-label-sm text-label-sm uppercase block">Seats</span>
                    <span className="text-primary-fixed font-label-bold font-label-bold">{b.seats.join(", ")}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-secondary-fixed-dim font-label-sm text-label-sm uppercase block">Paid</span>
                    <span className="text-primary-fixed font-label-bold font-label-bold">{formatCurrency(b.total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/booking-confirmed/${b.id}`)}
                  className="w-full mt-stack-md bg-primary-fixed text-on-primary-fixed font-label-bold text-label-bold py-3 rounded active:scale-95 transition-transform duration-100 uppercase tracking-widest"
                >
                  View Ticket
                </button>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
