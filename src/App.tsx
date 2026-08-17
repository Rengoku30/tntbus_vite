import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastProvider } from "@/components/feedback/toast";
import { ToastViewport } from "@/components/feedback/ToastViewport";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { HomePage } from "@/pages/HomePage";
import { SearchResultsPage } from "@/pages/SearchResultsPage";
import { RouteDetailsPage } from "@/pages/RouteDetailsPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { BookingConfirmedPage } from "@/pages/BookingConfirmedPage";
import { MyBookingsPage } from "@/pages/MyBookingsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <ErrorBoundary label="app-root">
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/search-results" element={<SearchResultsPage />} />
            <Route path="/route-details/:tripId" element={<RouteDetailsPage />} />
            <Route path="/booking-confirmed/:bookingId" element={<BookingConfirmedPage />} />

            {/* Protected */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <ToastViewport />
      </ToastProvider>
    </ErrorBoundary>
  );
}
