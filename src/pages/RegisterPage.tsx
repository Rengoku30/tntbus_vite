import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { registerSchema, type RegisterForm } from "@/validation/schemas";
import { useAuth } from "@/hooks/useAuth";
import { toAppError } from "@/lib/errors";
import { TransactionalLayout } from "@/components/layout/TransactionalLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";
import { useToastContext } from "@/components/feedback/toast";
import { logger } from "@/lib/logger";

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToastContext();
  const [serverError, setServerError] = useState<ReturnType<typeof toAppError> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const password = watch("password");

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });
      toast.success("Account created", "Welcome to TNTBus!");
      navigate("/", { replace: true });
    } catch (err) {
      const appErr = toAppError(err);
      setServerError(appErr);
      logger.warn("register failed", appErr);
    }
  });

  return (
    <TransactionalLayout maxWidth="max-w-[420px]">
      <div className="flex flex-col gap-stack-lg py-4">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-primary font-black tracking-tighter mb-2">
            Create Account
          </h1>
          <p className="font-body-md text-body-md text-secondary">
            Join TNTBus for faster, clearer bookings.
          </p>
        </div>

        {serverError && (
          <ErrorBanner error={serverError} onRetry={() => setServerError(null)} />
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-stack-md" noValidate>
          <Input
            label="Full Name"
            placeholder="Jane Doe"
            icon="person"
            required
            autoComplete="name"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="jane@example.com"
            icon="mail"
            required
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 000-0000"
            icon="call"
            required
            autoComplete="tel"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon="lock"
            required
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <PasswordStrengthMeter password={password ?? ""} />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            icon="lock"
            required
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          {/* Terms checkbox */}
          <div className="flex items-start gap-3 p-4 bg-surface-container rounded-lg border border-surface-variant">
            <div className="flex items-center h-6">
              <input
                id="terms"
                type="checkbox"
                aria-invalid={errors.terms ? true : undefined}
                aria-describedby={errors.terms ? "terms-error" : undefined}
                className="w-5 h-5 bg-surface border-2 border-surface-variant rounded-sm text-primary-fixed focus:ring-primary-fixed focus:ring-offset-surface cursor-pointer checked:border-primary-fixed transition-colors"
                {...register("terms")}
              />
            </div>
            <label htmlFor="terms" className="font-body-md text-body-md text-secondary cursor-pointer leading-tight pt-0.5">
              I agree to the{" "}
              <span className="text-primary-fixed font-bold">Terms and Conditions</span> and Privacy Policy.
            </label>
          </div>
          {errors.terms && (
            <p id="terms-error" role="alert" className="text-label-sm font-label-bold text-error">
              {errors.terms.message}
            </p>
          )}

          <Button type="submit" size="lg" block loading={isSubmitting}>
            Create Account
            <span className="material-symbols-outlined font-bold" aria-hidden="true">
              arrow_forward
            </span>
          </Button>
        </form>

        <p className="text-center font-body-md text-body-md text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-fixed font-bold hover:underline rounded px-1">
            Log In
          </Link>
        </p>
      </div>
    </TransactionalLayout>
  );
}
