import { mockHandler, request } from "./mockClient";
import { authStore, getCurrentUser } from "@/store/authStore";
import type { User } from "@/types/domain";
import { AuthError } from "@/lib/errors";
import { newId } from "@/lib/id";

/** Auth API surface. All calls flow through the mock transport (latency/failures). */

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export const authApi = {
  async register(input: RegisterInput): Promise<User> {
    return mockHandler(() => {
      const user = authStore.createUser(input);
      // Auto-login on register.
      authStore.saveSession({ userId: user.id, token: newId("tok"), createdAt: Date.now() });
      return user;
    })();
  },

  async login(email: string, password: string): Promise<User> {
    return mockHandler(() => {
      const user = authStore.verifyCredentials(email, password);
      authStore.saveSession({ userId: user.id, token: newId("tok"), createdAt: Date.now() });
      return user;
    })();
  },

  async logout(): Promise<void> {
    return request(() => {
      authStore.clearSession();
    });
  },

  /** Request a password reset. Always succeeds to avoid account enumeration. */
  async requestPasswordReset(_email: string): Promise<{ sent: boolean }> {
    return mockHandler(() => ({ sent: true }))();
  },

  /** Current authenticated user, or null. Throws AuthError if session invalid. */
  async me(): Promise<User | null> {
    return request(() => {
      const user = getCurrentUser();
      if (!user) return null;
      return user;
    });
  },
};

export function requireAuth(): User {
  const user = getCurrentUser();
  if (!user) throw new AuthError("Not authenticated", "Please sign in to continue.");
  return user;
}
