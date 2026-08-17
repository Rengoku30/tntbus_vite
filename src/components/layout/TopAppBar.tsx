import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Shared top app bar. On standard pages shows the desktop nav; on
 * transactional pages shows a back button instead (per the mockups'
 * "Navigation Shell Suppressed" pattern).
 */
export function TopAppBar({ backTo }: { backTo?: string | number }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    { to: "/", label: "Home", icon: "home", end: true },
    { to: "/my-bookings", label: "Bookings", icon: "confirmation_number" },
    { to: "/profile", label: "Profile", icon: "person" },
  ];

  return (
    <header className="bg-background border-b border-outline-variant sticky top-0 z-40">
      <div className="flex items-center justify-between w-full px-container-margin py-3.5">
        {backTo !== undefined ? (
          <button
            onClick={() => (typeof backTo === "number" ? navigate(backTo) : navigate(backTo))}
            aria-label="Go back"
            className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-primary-container">arrow_back</span>
          </button>
        ) : (
          <div className="w-10" />
        )}

        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-primary-container text-headline-md fill-icon" aria-hidden="true">
            directions_bus
          </span>
          <span className="font-headline-md text-headline-md font-black text-primary-container tracking-tighter">
            TNTBus
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-1 text-label-bold font-label-bold transition-colors ${
                  isActive
                    ? "text-primary-container border-b-2 border-primary-container pb-0.5"
                    : "text-on-surface-variant hover:text-primary-container"
                }`
              }
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side: user chip or sign-in */}
        {backTo === undefined ? (
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-surface-variant px-3 py-1.5 hover:border-primary-container transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-fixed flex items-center justify-center text-label-sm font-label-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline text-label-sm font-label-bold text-on-surface">
                  {user.name.split(" ")[0]}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-label-bold font-label-bold text-primary-container hover:underline"
              >
                Sign In
              </Link>
            )}
          </div>
        ) : (
          <div className="w-10" />
        )}
      </div>
    </header>
  );
}
