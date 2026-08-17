import { Link } from "react-router-dom";
import { cityByCode } from "@/data/seed";
import { formatDate } from "@/lib/format";

/** Route summary strip for the search-results page. */
export function RouteSummary({
  origin,
  destination,
  date,
  passengers,
  modifyTo,
}: {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  modifyTo: string;
}) {
  const o = cityByCode(origin.toUpperCase());
  const d = cityByCode(destination.toUpperCase());
  return (
    <section className="mb-stack-lg bg-surface-container-low p-4 rounded-lg border border-surface-variant">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-headline-md font-headline-md text-tertiary">
              {o?.name ?? origin} ({origin.toUpperCase()})
            </h2>
            <p className="text-on-secondary-container text-label-sm font-label-sm">{o?.station}</p>
          </div>
          <span className="material-symbols-outlined text-primary-fixed-dim text-[32px]" aria-hidden="true">
            arrow_right_alt
          </span>
          <div>
            <h2 className="text-headline-md font-headline-md text-tertiary">
              {d?.name ?? destination} ({destination.toUpperCase()})
            </h2>
            <p className="text-on-secondary-container text-label-sm font-label-sm">{d?.station}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 w-full md:w-auto flex justify-between md:block items-center">
          <p className="text-body-md font-body-md text-on-surface-variant">
            {formatDate(date)} • {passengers} {passengers === 1 ? "Passenger" : "Passengers"}
          </p>
          <Link
            to={modifyTo}
            className="bg-surface-variant hover:bg-surface-container-highest text-tertiary px-4 py-2 rounded text-label-bold font-label-bold transition-colors"
          >
            Modify
          </Link>
        </div>
      </div>
    </section>
  );
}
