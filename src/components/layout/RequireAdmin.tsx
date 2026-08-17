import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "./ProtectedRoute";

/**
 * Admin-only route guard (composes ProtectedRoute).
 *
 * - Not signed in  → /login?next=<path>
 * - Signed in but not an admin → redirected home (the entry point is also
 *   hidden from non-admins in the nav; this is the enforcement layer).
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <ProtectedRoute>
      {user && user.role !== "admin" ? (
        <Navigate to="/" replace state={{ from: location.pathname }} />
      ) : (
        children
      )}
    </ProtectedRoute>
  );
}
