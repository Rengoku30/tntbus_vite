import type { ReactNode } from "react";
import { TopAppBar } from "./TopAppBar";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";

/**
 * Standard page shell: TopAppBar (with desktop nav) + content + BottomNav
 * on mobile. Bottom nav is suppressed on transactional pages via
 * TransactionalLayout.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <OfflineBanner />
      <TopAppBar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-container-margin py-stack-lg pb-28 md:pb-12">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
