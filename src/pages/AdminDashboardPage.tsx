import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { routeSchema } from "@/validation/schemas";
import { adminApi, type BookingWithCustomer } from "@/api/admin";
import { useAsync } from "@/lib/async";
import { toAppError, type AppError } from "@/lib/errors";
import { formatCurrency, formatDate } from "@/lib/format";
import { cityByCode } from "@/data/seed";
import type { Amenity } from "@/types/domain";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { CardSkeletonList } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { useToastContext } from "@/components/feedback/toast";
import type { AdminTripRecord } from "@/store/adminTripsStore";

// RHF works with the raw form input (coerced numbers are strings in the DOM);
// the zod schema validates and produces the typed output.
type RouteFormInput = z.input<typeof routeSchema>;
type RouteFormOutput = z.output<typeof routeSchema>;

const AMENITY_OPTIONS = [
  { value: "wifi", label: "Wi-Fi" },
  { value: "power", label: "Power Outlets" },
  { value: "restroom", label: "Restroom" },
  { value: "ac", label: "AC" },
] as const;

const SELECTABLE_CITIES = ["NYC", "BOS", "PHL", "DC", "CHI", "DET"] as const;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Admin dashboard: all bookings + route management. Admin-role only (RequireAdmin). */
export function AdminDashboardPage() {
  const toast = useToastContext();
  const [routeError, setRouteError] = useState<AppError | null>(null);
  const [adding, setAdding] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<AdminTripRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>(["wifi"]);
  const [dates, setDates] = useState<string[]>([todayIso()]);

  // Bookings + routes load in parallel via useAsync.
  const bookingsAsync = useAsync(() => adminApi.listAllBookings(), []);
  const routesAsync = useAsync(() => adminApi.listRoutes(), []);

  const bookings: BookingWithCustomer[] = bookingsAsync.state.status === "success" ? bookingsAsync.state.data : [];
  const routes: AdminTripRecord[] = routesAsync.state.status === "success" ? routesAsync.state.data : [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RouteFormInput, unknown, RouteFormOutput>({
    resolver: zodResolver(routeSchema),
    mode: "onBlur",
    defaultValues: {
      code: "",
      vehicle: "",
      kind: "express",
      origin: "NYC",
      destination: "BOS",
      basePrice: 35,
      departureHour: 8,
      departureMinute: 0,
      durationMin: 240,
      dates: [],
      amenities: ["wifi"],
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setRouteError(null);
    setAdding(true);
    try {
      await adminApi.createRoute({
        code: values.code,
        vehicle: values.vehicle,
        kind: values.kind,
        origin: values.origin,
        destination: values.destination,
        basePrice: values.basePrice,
        departureHour: values.departureHour,
        departureMinute: values.departureMinute,
        durationMin: values.durationMin,
        dates: dates,
        amenities: amenities,
      });
      toast.success("Route added", `${values.code} is now live in search.`);
      reset({
        code: "",
        vehicle: "",
        kind: "express",
        origin: "NYC",
        destination: "BOS",
        basePrice: 35,
        departureHour: 8,
        departureMinute: 0,
        durationMin: 240,
        dates: [],
        amenities: ["wifi"],
      });
      setAmenities(["wifi"]);
      setDates([todayIso()]);
      routesAsync.run();
      bookingsAsync.run();
    } catch (err) {
      setRouteError(toAppError(err));
    } finally {
      setAdding(false);
    }
  });

  const handleDeleteRoute = async () => {
    if (!routeToDelete) return;
    setDeleting(true);
    try {
      await adminApi.removeRoute(routeToDelete.id);
      toast.success("Route removed", `${routeToDelete.code} removed from the catalog.`);
      routesAsync.run();
    } catch (err) {
      toast.error("Couldn't remove route", toAppError(err).userMessage);
    } finally {
      setDeleting(false);
      setRouteToDelete(null);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-stack-lg max-w-6xl mx-auto">
        <header className="flex flex-col gap-1">
          <h1 className="font-headline-xl text-headline-xl text-primary font-black tracking-tighter">
            Admin Dashboard
          </h1>
          <p className="text-on-surface-variant font-body-md text-body-md">
            View all bookings and manage the bus route catalog.
          </p>
        </header>

        {/* Bookings */}
        <section aria-labelledby="bookings-heading" className="flex flex-col gap-stack-md">
          <div className="flex items-center justify-between">
            <h2 id="bookings-heading" className="font-headline-md text-headline-md text-tertiary">
              All Bookings
            </h2>
            {bookingsAsync.state.status === "success" && (
              <Badge kind="info">
                {bookings.length} total
              </Badge>
            )}
          </div>

          {bookingsAsync.state.status === "loading" && <CardSkeletonList count={2} />}
          {bookingsAsync.state.status === "error" && (
            <ErrorBanner error={bookingsAsync.state.error} onRetry={bookingsAsync.run} />
          )}
          {bookingsAsync.state.status === "success" && bookings.length === 0 && (
            <EmptyState
              icon="confirmation_number"
              title="No bookings yet"
              message="Bookings will appear here once customers purchase tickets."
            />
          )}

          {bookings.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-surface-variant">
              <table className="w-full text-left text-label-sm font-label-sm">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant uppercase tracking-wider">
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Seats</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {bookings.map((b) => (
                    <tr key={b.id} className="bg-surface-container-low hover:bg-surface-container transition-colors">
                      <td className="px-4 py-3 font-label-bold text-primary-container">{b.reference}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-on-surface font-bold">{b.passengerName}</span>
                          <span className="text-on-surface-variant">{b.customer?.email ?? b.contactEmail}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{b.tripId}</td>
                      <td className="px-4 py-3">{formatDate(b.date)}</td>
                      <td className="px-4 py-3">{b.seats.join(", ")}</td>
                      <td className="px-4 py-3 text-right font-label-bold text-on-surface">{formatCurrency(b.total)}</td>
                      <td className="px-4 py-3">
                        <Badge kind="success" icon="check_circle">
                          Confirmed
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Add route */}
        <section aria-labelledby="add-route-heading" className="flex flex-col gap-stack-md">
          <h2 id="add-route-heading" className="font-headline-md text-headline-md text-tertiary">
            Add a New Route
          </h2>

          {routeError && <ErrorBanner error={routeError} onRetry={() => setRouteError(null)} />}

          <Card className="p-gutter">
            <form onSubmit={onSubmit} className="flex flex-col gap-stack-md" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Route Code"
                  placeholder="Express 501"
                  required
                  error={errors.code?.message}
                  {...register("code")}
                />
                <Input
                  label="Vehicle"
                  placeholder="Volvo 9700"
                  required
                  error={errors.vehicle?.message}
                  {...register("vehicle")}
                />
                <Select label="Trip Type" required error={errors.kind?.message} {...register("kind")}>
                  <option value="express">Express</option>
                  <option value="direct">Direct</option>
                  <option value="sleeper">Sleeper</option>
                  <option value="overnight">Overnight</option>
                </Select>
                <Select label="Origin" required error={errors.origin?.message} {...register("origin")}>
                  {SELECTABLE_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {cityByCode(c)?.name} ({c})
                    </option>
                  ))}
                </Select>
                <Select
                  label="Destination"
                  required
                  error={errors.destination?.message}
                  {...register("destination")}
                >
                  {SELECTABLE_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {cityByCode(c)?.name} ({c})
                    </option>
                  ))}
                </Select>
                <Input
                  label="Base Price ($)"
                  type="number"
                  min={5}
                  max={500}
                  required
                  error={errors.basePrice?.message}
                  {...register("basePrice")}
                />
                <Input
                  label="Departure Hour (0–23)"
                  type="number"
                  min={0}
                  max={23}
                  required
                  error={errors.departureHour?.message}
                  {...register("departureHour")}
                />
                <Input
                  label="Departure Minute (0–59)"
                  type="number"
                  min={0}
                  max={59}
                  required
                  error={errors.departureMinute?.message}
                  {...register("departureMinute")}
                />
                <Input
                  label="Duration (minutes)"
                  type="number"
                  min={15}
                  required
                  error={errors.durationMin?.message}
                  {...register("durationMin")}
                />
                <Input
                  label="Travel Date(s) — comma separated"
                  placeholder="2026-08-20, 2026-08-21"
                  value={dates.join(", ")}
                  onChange={(e) => {
                    const parts = e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));
                    setDates(parts.length > 0 ? parts : []);
                  }}
                  error={errors.dates?.message}
                />
              </div>

              {/* Amenities */}
              <div className="flex flex-col gap-2">
                <span className="font-label-bold text-label-bold text-primary-container uppercase tracking-wider">
                  Amenities
                </span>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map((opt) => {
                    const selected = amenities.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setAmenities((prev) =>
                            selected ? prev.filter((a) => a !== opt.value) : [...prev, opt.value],
                          )
                        }
                        aria-pressed={selected}
                        className={`px-3 py-1.5 rounded-full border text-label-sm font-label-sm transition-colors ${
                          selected
                            ? "bg-primary-container text-on-primary-fixed border-primary-container"
                            : "border-surface-variant text-tertiary hover:border-primary-container"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" loading={adding || isSubmitting}>
                  Add Route
                </Button>
              </div>
            </form>
          </Card>
        </section>

        {/* Manage routes */}
        <section aria-labelledby="routes-heading" className="flex flex-col gap-stack-md">
          <h2 id="routes-heading" className="font-headline-md text-headline-md text-tertiary">
            Routes You've Added
          </h2>
          {routesAsync.state.status === "loading" && <CardSkeletonList count={1} />}
          {routesAsync.state.status === "error" && (
            <ErrorBanner error={routesAsync.state.error} onRetry={routesAsync.run} />
          )}
          {routesAsync.state.status === "success" && routes.length === 0 && (
            <EmptyState icon="route" title="No custom routes yet" message="Routes you add will appear here." />
          )}
          {routes.length > 0 && (
            <div className="flex flex-col gap-3">
              {routes.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-4 bg-surface-container-low rounded-lg border border-surface-variant p-4"
                >
                  <div className="flex flex-col">
                    <span className="font-headline-md text-headline-md text-primary-container">{r.code}</span>
                    <span className="text-label-sm text-on-surface-variant">
                      {cityByCode(r.origin)?.name} → {cityByCode(r.destination)?.name} • {formatCurrency(r.basePrice)} •{" "}
                      {r.dates.length === 0 ? "All dates" : `${r.dates.length} date(s)`}
                    </span>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => setRouteToDelete(r)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(routeToDelete)}
        title="Remove route?"
        message={`This will remove ${routeToDelete?.code ?? ""} from the catalog. Existing bookings are not affected.`}
        confirmLabel="Remove"
        onConfirm={handleDeleteRoute}
        onCancel={() => setRouteToDelete(null)}
        loading={deleting}
        danger
      />
    </AppShell>
  );
}
