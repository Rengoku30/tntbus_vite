import { createContext, useContext, type ReactNode } from "react";
import { useToast, type ToastApi } from "@/hooks/useToast";

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const api = useToast();
  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>;
}

/** Access the toast API from any component. */
export function useToastContext(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within <ToastProvider>");
  return ctx;
}
