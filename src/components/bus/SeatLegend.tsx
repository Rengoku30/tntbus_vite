/** Seat legend — available / booked / selected / premium (from the mockup). */
export function SeatLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-label-sm font-label-sm">
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 border-2 border-primary-container rounded-sm" />
        <span className="text-on-surface">Available</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-surface-variant rounded-sm" />
        <span className="text-on-surface-variant">Booked</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-primary-container rounded-sm" />
        <span className="text-on-surface">Selected</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 border-2 border-[#ff9900] rounded-sm" />
        <span className="text-on-surface-variant">Premium</span>
      </div>
    </div>
  );
}
