import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loginSchema, type LoginForm } from "@/validation/schemas";
import { useAuth } from "@/hooks/useAuth";
import { toAppError } from "@/lib/errors";
import { TransactionalLayout } from "@/components/layout/TransactionalLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [serverError, setServerError] = useState<ReturnType<typeof toAppError> | null>(null);

  const next = params.get("next") ?? "/";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "john@example.com", password: "Password123!" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      navigate(next, { replace: true });
    } catch (err) {
      setServerError(toAppError(err));
    }
  });

  return (
    <TransactionalLayout maxWidth="max-w-[420px]">
      <div className="flex flex-col gap-stack-lg py-4">
        <div className="text-left md:text-center w-full">
          <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight mb-stack-sm">
            Welcome Back
          </h1>
          <p className="font-body-md text-body-md text-secondary">
            Log in to manage your bookings and find your next ride.
          </p>
        </div>

        <div className="bg-surface-container-low/60 border border-surface-variant rounded-lg p-4 text-label-sm text-on-surface-variant flex flex-col gap-2">
          <div>
            <p className="font-label-bold text-label-bold text-primary-container uppercase tracking-wider mb-1">
              Customer demo
            </p>
            <p>Email: <span className="text-primary">john@example.com</span> • Password: <span className="text-primary">Password123!</span></p>
          </div>
          <div className="border-t border-surface-variant pt-2">
            <p className="font-label-bold text-label-bold text-primary-container uppercase tracking-wider mb-1">
              Admin demo
            </p>
            <p>Email: <span className="text-primary">admin@tntbus.com</span> • Password: <span className="text-primary">Admin123!</span></p>
          </div>
        </div>

        {serverError && (
          <ErrorBanner error={serverError} onRetry={() => setServerError(null)} />
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-stack-md w-full" noValidate>
          <Input
            label="Email Address"
            type="email"
            placeholder="traveler@example.com"
            icon="mail"
            required
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon="lock"
            required
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="flex justify-end mt-1">
            <Link
              to="/forgot-password"
              className="font-label-bold text-label-sm text-secondary hover:text-primary transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
          <Button type="submit" size="lg" block loading={isSubmitting} className="mt-stack-sm uppercase tracking-wide">
            Sign In
            <span className="material-symbols-outlined font-bold" aria-hidden="true">
              arrow_forward
            </span>
          </Button>
        </form>

        <div className="flex items-center gap-4 w-full opacity-60" aria-hidden="true">
          <div className="h-px bg-surface-variant flex-grow" />
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">OR</span>
          <div className="h-px bg-surface-variant flex-grow" />
        </div>

        <div className="flex flex-col gap-stack-sm w-full">
          <Button
            variant="secondary"
            block
            onClick={() => navigate("/")}
          >
            Continue as Guest
          </Button>
        </div>

        <div className="text-center mt-stack-md">
          <span className="font-body-md text-body-md text-secondary">Don't have an account? </span>
          <Link
            to="/register"
            className="font-label-bold text-label-bold text-primary-fixed hover:text-primary transition-colors underline decoration-2 underline-offset-4"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </TransactionalLayout>
  );
}
