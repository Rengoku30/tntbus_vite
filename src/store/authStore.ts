import { safeStorage } from "@/lib/storage";
import { DEMO_USER } from "@/data/seed";
import type { User, Session } from "@/types/domain";
import { newId } from "@/lib/id";
import { AuthError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Auth store — users + session persisted to localStorage.
 * Password handling is DEMO-ONLY (plaintext compare). A real app MUST
 * hash server-side; this is clearly documented and never shipped as-is.
 */

const USERS_KEY = "tntbus:users";
const SESSION_KEY = "tntbus:session";

export interface StoredUser extends User {}

function loadUsers(): StoredUser[] {
  const existing = safeStorage.get<StoredUser[]>(USERS_KEY);
  if (existing && existing.length > 0) return existing;
  // First run: seed the demo user.
  const seeded = [DEMO_USER];
  safeStorage.set(USERS_KEY, seeded);
  return seeded;
}

function saveUsers(users: StoredUser[]): void {
  safeStorage.set(USERS_KEY, users);
}

export const authStore = {
  listUsers(): StoredUser[] {
    return loadUsers();
  },

  findByEmail(email: string): StoredUser | undefined {
    return loadUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  createUser(input: { name: string; email: string; phone: string; password: string }): StoredUser {
    const users = loadUsers();
    const existing = users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (existing) {
      throw new AuthError("Email already registered", "An account with this email already exists. Try signing in.", 409);
    }
    const user: StoredUser = {
      id: newId("u"),
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: input.password, // demo only
    };
    users.push(user);
    saveUsers(users);
    logger.debug("created user", user.id);
    return user;
  },

  verifyCredentials(email: string, password: string): StoredUser {
    const user = loadUsers().find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password,
    );
    if (!user) {
      throw new AuthError("Invalid credentials", "Incorrect email or password. Please try again.", 401);
    }
    return user;
  },

  /* ---- session ---- */

  getSession(): Session | null {
    return safeStorage.get<Session>(SESSION_KEY);
  },

  saveSession(session: Session): void {
    safeStorage.set(SESSION_KEY, session);
  },

  clearSession(): void {
    safeStorage.remove(SESSION_KEY);
  },

  getUserById(id: string): StoredUser | undefined {
    return loadUsers().find((u) => u.id === id);
  },
};

/** Convenience: current user or null. */
export function getCurrentUser(): StoredUser | null {
  const session = authStore.getSession();
  if (!session) return null;
  return authStore.getUserById(session.userId) ?? null;
}
