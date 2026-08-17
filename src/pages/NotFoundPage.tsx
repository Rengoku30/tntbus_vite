import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";

/** On-brand 404 (L8). */
export function NotFoundPage() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center text-center gap-4 py-16 min-h-[50vh]">
        <span className="material-symbols-outlined text-headline-xl text-primary-container" aria-hidden="true">
          route
        </span>
        <h1 className="font-headline-xl text-headline-xl text-primary font-black tracking-tighter">
          404
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
          We couldn't find that page. It may have been moved, or the link is out of date.
        </p>
        <Link to="/">
          <Button variant="primary">Return Home</Button>
        </Link>
      </div>
    </AppShell>
  );
}
