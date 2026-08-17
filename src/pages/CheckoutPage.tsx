import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { checkoutSchema, type CheckoutForm } from "@/validation/schemas";
import { searchApi } from "@/api/search";
import { bookingsApi } from "@/api/bookings";
import { paymentsApi } from "@/api/payments";
import { useAuth } from "@/hooks/useAuth";
import { useAsync } from "@/lib/async";
import { toAppError, SeatTakenError, type AppError } from "@/lib/errors";
import { newIdempotencyKey } from "@/lib/id";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { cityByCode } from "@/data/seed";
import { TransactionalLayout } from "@/components/layout/TransactionalLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { useToastContext } from "@/components/feedback/toast";

interface RouterState {
  seats?: string[];
  tripId?: string;
  date?: string;
}

export function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const toast = useToastContext();

  const routeState = (location.state ?? {}) as RouterState;
  const tripId = routeState.tripId ?? params.get("tripId") ?? "";
  const initialSeats = routeState.seats ?? [];

  // If someone lands here without a trip, bounce back.
  useEffect(() => {
    if (!tripId) navigate("/", { replace: true });
  }, [tripId, navigate]);

  const [payError, setPayError] = useState<AppError | null>(null);
  const [seatConflict, setSeatConflict] = useState(false);

  const { state: tripState } = useAsync(
    () => searchApi.getTrip(tripId),
    [tripId],
    Boolean(tripId),
  );
  const trip = tripState.status === "success" ? tripState.data : null;

  const seats = useMemo(() => {
    if (!trip || initialSeats.length === 0) return [];
    return trip.seats.filter((s) => initialSeats.includes(s.id));
  }, [trip, initialSeats]);

  const total = useMemo(
    () => seats.reduce((sum, s) => sum + s.price, 0),
    [seats],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    mode: "onBlur",
    defaultValues: {
      passengerName: user?.name ?? "",
      contactEmail: user?.email ?? "",
      contactPhone: user?.phone ?? "",
      cardName: "",
      cardNumber: "",
      expiry: "",
      cvv: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!trip || seats.length === 0) return;
    setPayError(null);
    setSeatConflict(false);

    const idempotencyKey = newIdempotencyKey();
    const rawDigits = values.cardNumber.replace(/\D/g, "");

    try {
      // Idempotent mock payment.
      await paymentsApi.charge({
        card: {
          number: rawDigits,
          expiryMM: values.expiry.slice(0, 2),
          expiryYY: values.expiry.slice(3),
          cvv: values.cvv,
          name: values.cardName,
        },
        amount: total,
        idempotencyKey,
      });

      // Confirm booking (re-validates seat availability).
      const { booking } = await bookingsApi.confirm({
        tripId: trip.id,
        date: trip.date,
        seats: seats.map((s) => s.id),
        passengerName: values.passengerName,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone || undefined,
        total,
        idempotencyKey,
      });

      toast.success("Booking confirmed!", `Reference ${booking.reference}`);
      navigate(`/booking-confirmed/${booking.id}`, { replace: true });
    } catch (err) {
      const appErr = toAppError(err);
      if (appErr instanceof SeatTakenError) {
        setSeatConflict(true);
        setPayError(appErr);
        toast.error("Seats were taken", appErr.userMessage);
      } else {
        setPayError(appErr);
        toast.error("Payment failed", appErr.userMessage);
      }
    }
  });

  if (!trip) {
    return (
      <TransactionalLayout>
        <div className="text-center py-12 text-on-surface-variant">Loading trip details…</div>
      </TransactionalLayout>
    );
  }

  const origin = cityByCode(trip.origin);
  const dest = cityByCode(trip.destination);

  return (
    <TransactionalLayout maxWidth="max-w-2xl">
      <div className="flex flex-col gap-stack-lg">
        <h1 className="font-headline-xl text-headline-xl text-primary font-black tracking-tighter">
          Checkout
        </h1>

        {/* Trip + seat summary */}
        <Card className="p-gutter flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="font-headline-md text-headline-md text-primary-container">
                {trip.origin}
              </span>
              <span className="material-symbols-outlined text-primary-fixed-dim" aria-hidden="true">
                arrow_right_alt
              </span>
              <span className="font-headline-md text-headline-md text-primary-container">
                {trip.destination}
              </span>
            </div>
            <span className="text-label-sm text-on-surface-variant">
              {formatDate(trip.date)} • {formatTime(trip.departureHour, trip.departureMinute)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-label-sm text-on-surface-variant">
              {origin?.name} → {dest?.name}
            </span>
            <span className="text-label-sm text-primary-container font-bold">
              Seats: {seats.map((s) => s.id).join(", ")}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-outline-variant pt-3">
            <span className="text-label-bold text-label-bold text-on-surface-variant">Total</span>
            <span className="text-headline-md text-headline-md text-primary-container">
              {formatCurrency(total)}
            </span>
          </div>
        </Card>

        {seatConflict && payError && (
          <ErrorBanner
            error={payError}
            onRetry={() => {
              setSeatConflict(false);
              navigate(
                `/route-details/${trip.id}?origin=${trip.origin}&destination=${trip.destination}&date=${trip.date}`,
              );
            }}
          />
        )}

        {payError && !seatConflict && (
          <ErrorBanner
            error={payError}
            onRetry={() => undefined}
          />
        )}

        {/* Passenger + payment form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-stack-md" noValidate>
          <section className="flex flex-col gap-stack-sm">
            <h2 className="font-headline-md text-headline-md text-tertiary">Passenger details</h2>
            <Input
              label="Passenger Name"
              placeholder="Jane Doe"
              required
              error={errors.passengerName?.message}
              {...register("passengerName")}
            />
            <Input
              label="Contact Email"
              type="email"
              placeholder="jane@example.com"
              required
              error={errors.contactEmail?.message}
              {...register("contactEmail")}
            />
            <Input
              label="Contact Phone (optional)"
              type="tel"
              placeholder="+1 (555) 000-0000"
              error={errors.contactPhone?.message}
              {...register("contactPhone")}
            />
          </section>

          <section className="flex flex-col gap-stack-sm">
            <h2 className="font-headline-md text-headline-md text-tertiary">Payment</h2>
            <div className="bg-surface-container-low rounded-lg border border-surface-variant p-4 text-label-sm text-on-surface-variant">
              <p className="font-label-bold text-label-bold text-primary-container uppercase tracking-wider mb-1">
                Demo mode
              </p>
              <p>Use <span className="text-primary">4242 4242 4242 4242</span> to pay, or{" "}
                <span className="text-primary">4000 0000 0000 0002</span> to simulate a decline. Any future expiry date and any 3-digit CVV work.</p>
            </div>
            <Input
              label="Name on Card"
              placeholder="JANE DOE"
              autoComplete="cc-name"
              required
              error={errors.cardName?.message}
              {...register("cardName")}
            />
            <Input
              label="Card Number"
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="cc-number"
              required
              error={errors.cardNumber?.message}
              {...register("cardNumber")}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Expiry"
                placeholder="MM/YY"
                inputMode="numeric"
                autoComplete="cc-exp"
                required
                error={errors.expiry?.message}
                {...register("expiry")}
              />
              <Input
                label="CVV"
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
                required
                error={errors.cvv?.message}
                {...register("cvv")}
              />
            </div>
          </section>

          <Button type="submit" size="lg" block loading={isSubmitting}>
            {isSubmitting ? "Processing…" : `Pay ${formatCurrency(total)}`}
          </Button>
        </form>
      </div>
    </TransactionalLayout>
  );
}
