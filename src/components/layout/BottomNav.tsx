import { NavLink } from "react-router-dom";

const ITEMS = [
  { to: "/", label: "Home", icon: "home", end: true },
  { to: "/my-bookings", label: "Bookings", icon: "confirmation_number", end: false },
  { to: "/profile", label: "Profile", icon: "person", end: false },
];

/** Mobile bottom nav (per DESIGN.md: pure black, active = yellow icons). */
export function BottomNav() {
  return (
    <nav
      className="md:hidden bg-surface-container-lowest border-t border-outline-variant fixed bottom-0 w-full z-50"
      aria-label="Mobile"
    >
      <div className="flex justify-around items-center h-16 w-full px-2 pb-safe">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-1/3 py-2 transition-colors ${
                isActive
                  ? "text-primary-container font-bold"
                  : "text-on-secondary-container opacity-60 hover:text-primary-fixed-dim"
              }`
            }
          >
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
              {item.icon}
            </span>
            <span className="text-label-sm font-label-sm mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
