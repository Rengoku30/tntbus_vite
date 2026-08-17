import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchApi } from "@/api/search";
import { useAsync } from "@/lib/async";
import { AppShell } from "@/components/layout/AppShell";
import { RouteSummary } from "@/components/bus/RouteSummary";
import { BusCard } from "@/components/bus/BusCard";
import { FilterPanel, type SortKey, type AmenityKey } from "@/components/bus/FilterPanel";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { CardSkeletonList } from "@/components/ui/Skeleton";
import type { TripWithAvailability } from "@/types/domain";

function sortTrips(trips: TripWithAvailability[], sort: SortKey): TripWithAvailability[] {
  const copy = [...trips];
  switch (sort) {
    case "fastest":
      return copy.sort((a, b) => a.durationMin - b.durationMin);
    case "cheapest":
      return copy.sort((a, b) => a.basePrice - b.basePrice);
    case "early":
      return copy.sort((a, b) => a.departureHour * 60 + a.departureMinute - (b.departureHour * 60 + b.departureMinute));
    case "recommended":
    default:
      return copy.sort((a, b) => b.seatsLeft - a.seatsLeft);
  }
}

export function SearchResultsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const origin = params.get("origin") ?? "";
  const destination = params.get("destination") ?? "";
  const date = params.get("date") ?? "";
  const passengers = Number(params.get("passengers") ?? "1") || 1;

  const [sort, setSort] = useState<SortKey>("recommended");
  const [amenities, setAmenities] = useState<AmenityKey[]>([]);

  const query = useMemo(
    () => ({ origin, destination, date, passengers }),
    [origin, destination, date, passengers],
  );

  const { state, run } = useAsync(
    () => searchApi.search(query),
    [query.origin, query.destination, query.date, query.passengers],
    Boolean(origin && destination && date),
  );

  const [retrying, setRetrying] = useState(false);
  const handleRetry = () => {
    setRetrying(true);
    run();
    window.setTimeout(() => setRetrying(false), 1200);
  };

  const toggleAmenity = (a: AmenityKey) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const searchData = state.status === "success" ? state.data : [];

  const filtered = useMemo(() => {
    let list = searchData;
    if (amenities.length > 0) {
      list = list.filter((t) => amenities.every((a) => t.amenities.includes(a)));
    }
    return sortTrips(list, sort);
  }, [searchData, amenities, sort]);

  const homeModify = "/";

  return (
    <AppShell>
      <RouteSummary
        origin={origin}
        destination={destination}
        date={date}
        passengers={passengers}
        modifyTo={homeModify}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-gutter">
        <FilterPanel sort={sort} onSort={setSort} amenities={amenities} onToggleAmenity={toggleAmenity} />

        <div className="lg:col-span-3 space-y-stack-sm">
          {state.status === "loading" && <CardSkeletonList count={3} />}

          {state.status === "error" && (
            <ErrorBanner error={state.error} onRetry={handleRetry} retrying={retrying} />
          )}

          {state.status === "success" && state.data.length === 0 && (
            <EmptyState
              icon="search_off"
              title="No buses found"
              message="There are no trips matching your search. Try a different date or route."
              action={
                <button
                  onClick={() => navigate("/")}
                  className="text-primary-container font-label-bold text-label-bold hover:underline"
                >
                  Back to search
                </button>
              }
            />
          )}

          {state.status === "success" && state.data.length > 0 && filtered.length === 0 && (
            <EmptyState
              icon="filter_alt_off"
              title="No trips match your filters"
              message="Try removing an amenity filter."
              action={
                <button
                  onClick={() => setAmenities([])}
                  className="text-primary-container font-label-bold text-label-bold hover:underline"
                >
                  Clear filters
                </button>
              }
            />
          )}

          {state.status === "success" &&
            filtered.map((trip) => (
              <BusCard
                key={trip.id}
                trip={trip}
                onSelect={() =>
                  navigate(
                    `/route-details/${trip.id}?origin=${origin}&destination=${destination}&date=${date}&passengers=${passengers}`,
                  )
                }
              />
            ))}
        </div>
      </div>
    </AppShell>
  );
}
