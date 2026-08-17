import type { TripStop } from "@/types/domain";
import { formatTime } from "@/lib/format";

/** Itinerary timeline (ports the route-details mockup). */
export function ItineraryTimeline({
  stops,
  departureHour,
  departureMinute,
}: {
  stops: TripStop[];
  departureHour: number;
  departureMinute: number;
}) {
  const isOrigin = (i: number) => i === 0;
  const isDest = (i: number) => i === stops.length - 1;

  return (
    <div className="relative pl-6 border-l-2 border-surface-variant space-y-8">
      {stops.map((s, i) => {
        const minutes = s.offsetMin;
        const hour = (departureHour + Math.floor(minutes / 60)) % 24;
        const minute = (departureMinute + (minutes % 60)) % 60;
        const isHighlight = isOrigin(i) || isDest(i);
        return (
          <div key={i} className="relative">
            <div
              className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-surface-container-low ${
                isHighlight ? "bg-primary-container" : "bg-surface-variant"
              }`}
            />
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-tertiary text-label-bold font-label-bold">{s.station}</h3>
                <p className="text-on-surface-variant text-label-sm font-label-sm mt-1">
                  {s.label}
                  {s.platform ? ` • ${s.platform}` : ""}
                </p>
              </div>
              <span
                className={`text-label-bold font-label-bold whitespace-nowrap ${
                  isHighlight ? "text-primary-container" : "text-tertiary"
                }`}
              >
                {formatTime(hour, minute)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
