import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { bookingsApi } from "@/api/bookings";
import { searchApi } from "@/api/search";
import { useAuth } from "@/hooks/useAuth";
import { useAsync } from "@/lib/async";
import { captureError } from "@/lib/capture";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { cityByCode } from "@/data/seed";
import { TransactionalLayout } from "@/components/layout/TransactionalLayout";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { NotFoundPage } from "./NotFoundPage";
import { useToastContext } from "@/components/feedback/toast";
import type { Booking } from "@/types/domain";

/**
 * Success page. Guarded: the booking must exist AND belong to the current
 * user — typing the URL of a booking you don't own shows the not-found state
 * instead of a "fake success" (L8/L12).
 */
export function BookingConfirmedPage() {
  const { bookingId = "" } = useParams();
  const { user } = useAuth();
  const toast = useToastContext();
  const [qrFailed, setQrFailed] = useState(false);

  const { state, run } = useAsync(() => bookingsApi.getById(bookingId), [bookingId], Boolean(bookingId));

  const booking: Booking | null = state.status === "success" ? state.data : null;
  const owned = booking && user ? booking.userId === user.id : false;

  // Also load the trip for display (best-effort; if it fails, show booking basics).
  const { state: tripState } = useAsync(
    () => searchApi.getTrip(booking?.tripId ?? ""),
    [booking?.tripId],
    Boolean(booking && booking.tripId),
  );
  const trip = tripState.status === "success" ? tripState.data : null;

  useEffect(() => {
    if (state.status === "success" && booking && user && !owned) {
      toast.error("Booking not found", "This booking doesn't belong to your account.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, owned]);

  const downloadTicket = () => {
    try {
      const content = [
        "TNTBus — Digital Ticket",
        `Reference: ${booking?.reference}`,
        `Route: ${trip?.origin ?? ""} → ${trip?.destination ?? ""}`,
        `Date: ${booking?.date}`,
        `Seats: ${booking?.seats.join(", ")}`,
        `Passenger: ${booking?.passengerName}`,
        `Total: ${booking ? formatCurrency(booking.total) : ""}`,
      ].join("\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TNTBus-${booking?.reference}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Ticket downloaded");
    } catch (err) {
      captureError(err, "downloadTicket");
      toast.error("Download failed", "Please try again.");
    }
  };

  if (state.status === "loading" || state.status === "idle") {
    return (
      <TransactionalLayout>
        <div className="text-center py-12 text-on-surface-variant">Loading your ticket…</div>
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

  if (!booking || !owned) {
    return <NotFoundPage />;
  }

  const origin = cityByCode(trip?.origin ?? "");
  const dest = cityByCode(trip?.destination ?? "");

  return (
    <TransactionalLayout maxWidth="max-w-md">
      <div className="flex flex-col items-center gap-stack-lg py-4">
        {/* Success indicator */}
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center mb-stack-md shadow-[0_0_30px_rgba(234,234,0,0.4)]">
            <span className="material-symbols-outlined text-[64px] text-background fill-icon" aria-hidden="true">
              check
            </span>
          </div>
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-primary-container tracking-tighter">
            Payment Successful
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant mt-stack-sm">
            Your booking is confirmed.
          </p>
        </div>

        {/* Digital ticket card */}
        <div className="w-full bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden shadow-2xl relative">
          <div className="bg-surface-container border-b border-outline-variant p-gutter flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container" aria-hidden="true">
                directions_bus
              </span>
              <span className="text-label-bold font-label-bold text-primary-container">TNTBus</span>
            </div>
            <div className="text-label-sm font-label-sm text-on-surface-variant">
              Booking ID: <span className="text-on-background">{booking.reference}</span>
            </div>
          </div>

          <div className="p-gutter relative">
            <div
              className="absolute -left-3 top-1/2 w-6 h-6 bg-background rounded-full transform -translate-y-1/2 border border-outline-variant border-l-0"
              aria-hidden="true"
            />
            <div
              className="absolute -right-3 top-1/2 w-6 h-6 bg-background rounded-full transform -translate-y-1/2 border border-outline-variant border-r-0"
              aria-hidden="true"
            />
            <div className="flex justify-between items-center mb-stack-md">
              <div className="flex flex-col">
                <span className="text-headline-md font-headline-md text-primary-container">{trip?.origin ?? "—"}</span>
                <span className="text-label-sm font-label-sm text-on-surface-variant">{origin?.name}</span>
                <span className="text-body-md font-body-md text-on-background mt-1">
                  {trip ? formatTime(trip.departureHour, trip.departureMinute) : ""}
                </span>
              </div>
              <div className="flex flex-col items-center flex-grow px-4">
                <span className="text-label-sm font-label-sm text-on-surface-variant mb-1">
                  {trip ? formatDurationShort(trip.durationMin) : "—"}
                </span>
                <div className="w-full border-t-2 border-dashed border-outline-variant relative">
                  <span
                    className="material-symbols-outlined absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary-container bg-surface-container-low px-1 text-sm"
                    aria-hidden="true"
                  >
                    east
                  </span>
                </div>
                <span className="text-label-sm font-label-sm text-primary-container mt-1">
                  {trip && trip.stops.length <= 2 ? "Direct" : "Stops"}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-headline-md font-headline-md text-primary-container">{trip?.destination ?? "—"}</span>
                <span className="text-label-sm font-label-sm text-on-surface-variant">{dest?.name}</span>
                <span className="text-body-md font-body-md text-on-background mt-1">
                  {trip ? formatArrival(trip) : ""}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-outline-variant pt-stack-md mt-stack-md">
              <div>
                <span className="text-label-sm font-label-sm text-on-surface-variant block mb-1">Date</span>
                <span className="text-label-bold font-label-bold text-on-background">{formatDate(booking.date)}</span>
              </div>
              <div>
                <span className="text-label-sm font-label-sm text-on-surface-variant block mb-1">Passenger</span>
                <span className="text-label-bold font-label-bold text-on-background">{booking.passengerName}</span>
              </div>
              <div>
                <span className="text-label-sm font-label-sm text-on-surface-variant block mb-1">Bus Number</span>
                <span className="text-label-bold font-label-bold text-primary-container">{trip?.code ?? "—"}</span>
              </div>
              <div>
                <span className="text-label-sm font-label-sm text-on-surface-variant block mb-1">Seat Number</span>
                <span className="text-headline-md font-headline-md text-primary-container">
                  {booking.seats.join(", ")}
                </span>
              </div>
              <div>
                <span className="text-label-sm font-label-sm text-on-surface-variant block mb-1">Total Paid</span>
                <span className="text-label-bold font-label-bold text-primary-container">{formatCurrency(booking.total)}</span>
              </div>
            </div>
          </div>

          {/* QR */}
          <div className="bg-surface-container-highest p-gutter flex flex-col items-center justify-center border-t border-dashed border-outline-variant">
            {qrFailed ? (
              <div className="w-32 h-32 flex items-center justify-center bg-white rounded-md">
                <span className="material-symbols-outlined text-5xl text-black" aria-hidden="true">
                  qr_code_2
                </span>
              </div>
            ) : (
              <QRCodeSVG
                value={`TNTBUS|${booking.reference}|${booking.seats.join("+")}`}
                size={128}
                bgColor="#ffffff"
                fgColor="#000000"
                onError={() => setQrFailed(true)}
                aria-label="Boarding pass QR code"
              />
            )}
            <span className="text-label-sm font-label-sm text-on-surface-variant text-center mt-2">
              Scan at boarding gate
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-stack-sm">
          <Button variant="primary" block onClick={downloadTicket}>
            <span className="material-symbols-outlined" aria-hidden="true">
              download
            </span>
            Download Ticket
          </Button>
          <Link to="/" className="w-full">
            <Button variant="secondary" block>
              <span className="material-symbols-outlined" aria-hidden="true">
                home
              </span>
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </TransactionalLayout>
  );
}

function formatDurationShort(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatArrival(trip: { departureHour: number; departureMinute: number; durationMin: number }): string {
  const totalMin = trip.departureHour * 60 + trip.departureMinute + trip.durationMin;
  const hour = Math.floor(totalMin / 60) % 24;
  const minute = totalMin % 60;
  return formatTime(hour, minute);
}
