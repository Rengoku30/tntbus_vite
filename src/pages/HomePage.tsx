import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { searchSchema, type SearchForm } from "@/validation/schemas";
import { CITIES_SELECTABLE, todayIso } from "@/data/seed";
import { addRecentSearch, clearRecentSearches, getRecentSearches, type RecentSearch } from "@/store/searchStore";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { AppShell } from "@/components/layout/AppShell";
import { formatDate } from "@/lib/format";

const POPULAR_ROUTES = [
  { from: "NYC", to: "BOS", tag: "Express", price: 45, fromName: "New York", toName: "Boston" },
  { from: "PHL", to: "DC", tag: "Direct", price: 38, fromName: "Philadelphia", toName: "Washington" },
  { from: "CHI", to: "DET", tag: "Overnight", price: 62, fromName: "Chicago", toName: "Detroit" },
];

export function HomePage() {
  const navigate = useNavigate();
  const [recent, setRecent] = useState<RecentSearch[]>(() => getRecentSearches());

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      origin: "",
      destination: "",
      date: todayIso(),
      passengers: 1,
    },
    mode: "onBlur",
  });

  const onSubmit = (values: SearchForm) => {
    const origin = values.origin.toUpperCase();
    const destination = values.destination.toUpperCase();
    addRecentSearch({ origin, destination, date: values.date, passengers: values.passengers, at: Date.now() });
    setRecent(getRecentSearches());
    navigate(`/search-results?origin=${origin}&destination=${destination}&date=${values.date}&passengers=${values.passengers}`);
  };

  const runSearch = (origin: string, destination: string, date: string) => {
    navigate(`/search-results?origin=${origin}&destination=${destination}&date=${date}&passengers=1`);
  };

  return (
    <AppShell>
      {/* Hero */}
      <section className="flex flex-col gap-stack-sm">
        <h1 className="text-headline-lg-mobile md:text-headline-xl font-headline-lg-mobile md:font-headline-xl tracking-tighter">
          Where are you going?
        </h1>
        <p className="text-on-surface-variant font-body-md text-body-md max-w-md">
          Book your next journey instantly. High-speed, reliable intercity transit.
        </p>
      </section>

      {/* Search card */}
      <section className="bg-surface-container-low rounded-lg border border-surface-variant p-4 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
        <div
          className="absolute -inset-1 bg-primary-container opacity-10 blur-xl group-hover:opacity-20 transition-opacity duration-500 rounded-xl -z-10 pointer-events-none"
          aria-hidden="true"
        />
        <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Origin"
              icon="my_location"
              error={errors.origin?.message}
              {...register("origin")}
            >
              <option value="">City or Station</option>
              {CITIES_SELECTABLE.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </Select>
            <Select
              label="Destination"
              icon="location_on"
              error={errors.destination?.message}
              {...register("destination")}
            >
              <option value="">City or Station</option>
              {CITIES_SELECTABLE.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date of Travel"
              type="date"
              icon="calendar_month"
              error={errors.date?.message}
              {...register("date")}
            />
            <Select
              label="Passengers"
              icon="group"
              error={errors.passengers?.message}
              {...register("passengers")}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "Passenger" : "Passengers"}
                </option>
              ))}
            </Select>
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            className="mt-2 w-full md:w-auto md:self-end"
            leadingIcon={
              <span className="material-symbols-outlined fill-icon" aria-hidden="true">
                arrow_forward
              </span>
            }
          >
            Search Buses
          </Button>
        </form>
      </section>

      {/* Recent searches */}
      {recent.length > 0 && (
        <section className="flex flex-col gap-stack-sm">
          <div className="flex justify-between items-end">
            <h2 className="text-headline-md font-headline-md">Recent Searches</h2>
            <button
              onClick={() => {
                clearRecentSearches();
                setRecent([]);
              }}
              className="text-primary-container font-label-bold text-label-bold hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="flex overflow-x-auto hide-scrollbar gap-gutter snap-x pb-2">
            {recent.map((r, i) => (
              <button
                key={`${r.origin}-${r.destination}-${i}`}
                onClick={() => runSearch(r.origin, r.destination, r.date)}
                className="flex-shrink-0 snap-center border border-[#333333] bg-[#1A1A1A] hover:border-primary-container rounded-full px-4 py-2 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-sm" aria-hidden="true">
                  history
                </span>
                <span className="font-label-bold text-label-bold">
                  {r.origin} <span className="material-symbols-outlined text-[10px] mx-1" aria-hidden="true">arrow_forward</span> {r.destination}
                </span>
                <span className="text-on-surface-variant text-label-sm font-label-sm ml-2">{formatDate(r.date)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Popular routes */}
      <section className="flex flex-col gap-stack-sm">
        <h2 className="text-headline-md font-headline-md">Popular Routes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {POPULAR_ROUTES.map((r) => (
            <button
              key={`${r.from}-${r.to}`}
              onClick={() => runSearch(r.from, r.to, todayIso())}
              className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-4 flex flex-col gap-4 hover:border-primary-container transition-colors cursor-pointer group relative overflow-hidden text-left"
            >
              <div
                className="absolute top-0 right-0 w-16 h-16 bg-primary-container opacity-5 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300"
                aria-hidden="true"
              />
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-primary-container font-label-bold text-label-bold uppercase">{r.tag}</span>
                  <span className="font-headline-md text-headline-md">{r.toName}</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container transition-colors" aria-hidden="true">
                  east
                </span>
              </div>
              <div className="flex justify-between items-end border-t border-[#333333] pt-4 mt-auto">
                <div className="flex flex-col">
                  <span className="text-on-surface-variant font-label-sm text-label-sm">From</span>
                  <span className="font-label-bold text-label-bold text-tertiary">{r.fromName}</span>
                </div>
                <div className="text-right flex flex-col">
                  <span className="text-on-surface-variant font-label-sm text-label-sm">Starting at</span>
                  <span className="font-headline-md text-headline-md text-primary-container">${r.price}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
