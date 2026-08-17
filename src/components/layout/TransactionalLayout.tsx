import type { ReactNode } from "react";
import { TopAppBar } from "./TopAppBar";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";

/**
 * Transactional flow shell: suppresses the BottomNav and shows a back
 * button (login, register, forgot-password, route-details, confirmed).
 */
export function TransactionalLayout({
  children,
  backTo,
  maxWidth = "max-w-md",
}: {
  children: ReactNode;
  backTo?: string;
  maxWidth?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <OfflineBanner />
      <TopAppBar backTo={backTo ?? -1} />
      <main className={`flex-1 w-full mx-auto px-container-margin py-stack-lg ${maxWidth}`}>
        {children}
      </main>
    </div>
  );
}
