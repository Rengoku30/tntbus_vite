import { useEffect, useState } from "react";
import { safeStorage } from "@/lib/storage";

/**
 * useState that mirrors into safeStorage and reacts to cross-tab changes.
 * Falls back to in-memory automatically if storage is unavailable.
 */
export function useLocalStorage<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    const stored = safeStorage.get<T>(key);
    if (stored !== null) return stored;
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });

  useEffect(() => {
    safeStorage.set(key, value);
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        const next = safeStorage.get<T>(key);
        if (next !== null) setValue(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  return [value, setValue] as const;
}
