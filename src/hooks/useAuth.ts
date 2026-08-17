import { useCallback, useEffect, useState } from "react";
import { authApi } from "@/api/auth";
import { getCurrentUser } from "@/store/authStore";
import type { User } from "@/types/domain";
import { logger } from "@/lib/logger";

/**
 * Auth state hook. Reacts to session changes (login/logout) across tabs
 * via the `storage` event, and drives the mock `me()` call for parity.
 */

export interface UseAuth {
  user: User | null;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: { name: string; email: string; phone: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
}

const SESSION_KEY = "tntbus:session";

export function useAuth(): UseAuth {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    authApi
      .me()
      .then((u) => {
        if (mounted) setUser(u);
      })
      .catch((err) => {
        logger.warn("me() failed", err);
        if (mounted) setUser(getCurrentUser());
      })
      .finally(() => {
        if (mounted) setIsInitializing(false);
      });

    // Cross-tab session sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) setUser(getCurrentUser());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authApi.login(email, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; phone: string; password: string }) => {
      const u = await authApi.register(input);
      setUser(u);
      return u;
    },
    [],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return { user, isInitializing, login, register, logout };
}
