import { Chip } from "@/components/ui/Chip";

export type SortKey = "recommended" | "fastest" | "cheapest" | "early";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "fastest", label: "Fastest" },
  { key: "cheapest", label: "Cheapest" },
  { key: "early", label: "Early Departure" },
];

export const AMENITY_OPTIONS = [
  { key: "wifi", label: "Wi-Fi" },
  { key: "power", label: "Power Outlets" },
  { key: "restroom", label: "Restroom" },
  { key: "ac", label: "AC" },
] as const;

export type AmenityKey = (typeof AMENITY_OPTIONS)[number]["key"];

/** Desktop sidebar filters + mobile sort chips. */
export function FilterPanel({
  sort,
  onSort,
  amenities,
  onToggleAmenity,
}: {
  sort: SortKey;
  onSort: (s: SortKey) => void;
  amenities: AmenityKey[];
  onToggleAmenity: (a: AmenityKey) => void;
}) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:col-span-1 space-y-stack-md">
        <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant">
          <h3 className="text-body-lg font-body-lg text-tertiary mb-4">Filters</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-label-bold font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider">
                Sort By
              </h4>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Sort results">
                {SORT_OPTIONS.map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      checked={sort === opt.key}
                      onChange={() => onSort(opt.key)}
                      className="form-radio text-primary-container bg-surface-dim border-outline-variant focus:ring-primary-container"
                    />
                    <span className="text-body-md font-body-md text-on-surface">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <hr className="border-outline-variant" />
            <div>
              <h4 className="text-label-bold font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider">
                Amenities
              </h4>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.key}
                    selected={amenities.includes(opt.key)}
                    onClick={() => onToggleAmenity(opt.key)}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sort chips */}
      <div className="flex lg:hidden overflow-x-auto pb-2 gap-2 hide-scrollbar">
        {SORT_OPTIONS.map((opt) => (
          <Chip key={opt.key} selected={sort === opt.key} onClick={() => onSort(opt.key)}>
            {opt.label}
          </Chip>
        ))}
      </div>
    </>
  );
}
