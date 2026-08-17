/** Live password strength meter for the register form (L4). */

export type Strength = 0 | 1 | 2 | 3 | 4;

export function evaluateStrength(pw: string): { score: Strength; label: string } {
  if (!pw) return { score: 0, label: "Enter a password" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  // Cap at 4.
  score = Math.min(score, 4);
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"] as const;
  return { score: score as Strength, label: labels[score] ?? "Good" };
}

const COLORS: Record<Strength, string> = {
  0: "bg-surface-variant",
  1: "bg-error",
  2: "bg-[#ff9900]",
  3: "bg-primary-fixed-dim",
  4: "bg-primary-container",
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label } = evaluateStrength(password);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? COLORS[score as Strength] : "bg-surface-variant"}`}
          />
        ))}
      </div>
      <p className="text-label-sm text-on-surface-variant">
        Password strength: <span className="font-label-bold">{label}</span>
      </p>
    </div>
  );
}
