import clsx from "clsx";
import type { Seat } from "@/types/domain";
import { formatCurrency } from "@/lib/format";

/**
 * Interactive seat map (ports the mockup's seat-selection JS).
 *
 * States: available / booked / selected / premium. Premium seats are marked
 * with a star and cost more. Renders a 4-column grid with a driver area and
 * aisle marker, exactly like the mockup.
 */
export function SeatMap({
  seats,
  bookedSeats,
  lockedByOther,
  selectedSeats,
  maxSelectable,
  onToggle,
}: {
  seats: Seat[];
  bookedSeats: string[];
  lockedByOther: string[];
  selectedSeats: string[];
  maxSelectable: number;
  onToggle: (seatId: string) => void;
}) {
  const booked = new Set(bookedSeats);
  const locked = new Set(lockedByOther);

  const rows = seats.reduce<number[]>((acc, s) => (acc.includes(s.row) ? acc : [...acc, s.row]), []);

  return (
    <div className="flex-1 flex justify-center py-stack-md overflow-x-auto">
      <div className="border-4 border-outline-variant rounded-t-[40px] rounded-b-lg p-6 bg-surface-container flex flex-col gap-6 relative min-w-[280px]">
        {/* Driver area */}
        <div className="flex justify-end border-b-2 border-outline-variant pb-4 mb-2">
          <div className="w-10 h-10 border-2 border-outline-variant rounded flex items-center justify-center opacity-50">
            <span className="material-symbols-outlined" aria-hidden="true">
              airline_seat_recline_normal
            </span>
          </div>
        </div>

        {/* Seat grid */}
        <div className="grid grid-cols-4 gap-x-8 gap-y-4 relative">
          <div
            className="absolute top-0 bottom-0 left-[50%] w-px bg-surface-variant -translate-x-1/2"
            aria-hidden="true"
          />
          {rows.map((row) => {
            const rowSeats = seats.filter((s) => s.row === row);
            return rowSeats.map((seat) => {
              const isBooked = booked.has(seat.id) || locked.has(seat.id);
              const isSelected = selectedSeats.includes(seat.id);
              const disabled = isBooked || (selectedSeats.length >= maxSelectable && !isSelected);

              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={isBooked || disabled}
                  aria-pressed={isSelected}
                  aria-label={
                    isBooked
                      ? `Seat ${seat.id}, unavailable`
                      : `Seat ${seat.id}, ${formatCurrency(seat.price)}, ${isSelected ? "selected" : "available"}`
                  }
                  onClick={() => onToggle(seat.id)}
                  className={clsx(
                    "relative w-10 h-10 md:w-12 md:h-12 rounded flex items-center justify-center text-label-bold font-label-bold transition-colors",
                    isBooked &&
                      "bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed",
                    !isBooked &&
                      !isSelected &&
                      seat.premium &&
                      "border-2 border-[#ff9900] text-[#ff9900] hover:bg-[#ff9900]/20",
                    !isBooked && !isSelected && !seat.premium &&
                      "border-2 border-primary-container text-primary-container hover:bg-primary-container/20",
                    isSelected && "bg-primary-container text-on-primary-fixed seat-selected",
                    disabled && !isBooked && "opacity-40 cursor-not-allowed",
                  )}
                >
                  {seat.id}
                  {seat.premium && (
                    <span className="absolute -top-1 -right-1 text-[8px] bg-[#ff9900] text-black px-1 rounded-full">
                      ★
                    </span>
                  )}
                </button>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}
