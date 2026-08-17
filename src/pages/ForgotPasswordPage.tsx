import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { forgotPasswordSchema, type ForgotPasswordForm } from "@/validation/schemas";
import { authApi } from "@/api/auth";
import { toAppError } from "@/lib/errors";
import { TransactionalLayout } from "@/components/layout/TransactionalLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<ReturnType<typeof toAppError> | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      // Always succeeds — we never confirm whether an account exists (no enumeration).
      await authApi.requestPasswordReset(values.email);
      setSent(true);
    } catch (err) {
      setError(toAppError(err));
    }
  });

  return (
    <TransactionalLayout maxWidth="max-w-[420px]">
      <div className="flex flex-col gap-stack-lg py-4">
        <section className="flex flex-col gap-stack-sm">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary-container">
            Reset Password
          </h1>
          <p className="font-body-md text-body-md text-secondary">
            {sent
              ? "If an account exists for that email, we've sent a reset link. Check your inbox."
              : "Enter your email address and we'll send you a code to reset your password."}
          </p>
        </section>

        {error && <ErrorBanner error={error} onRetry={() => setError(null)} />}

        {sent ? (
          <div className="flex flex-col gap-4">
            <div className="bg-surface-container-low border border-surface-variant rounded-lg p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-container fill-icon" aria-hidden="true">
                mark_email_read
              </span>
              <p className="font-body-md text-body-md text-on-surface">
                Reset link sent. It expires in 30 minutes.
              </p>
            </div>
            <Link to="/login">
              <Button variant="secondary" block>
                Back to login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-stack-lg flex-1" noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder="name@domain.com"
              icon="mail"
              required
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <div className="flex flex-col gap-stack-md">
              <Button type="submit" size="lg" block loading={isSubmitting}>
                Send Reset Link
              </Button>
              <Link
                to="/login"
                className="text-center font-label-bold text-label-bold text-primary-container hover:opacity-80 transition-opacity"
              >
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </TransactionalLayout>
  );
}
