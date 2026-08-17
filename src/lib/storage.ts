import { logger } from "./logger";

/**
 * Safe localStorage wrapper.
 *
 * Handles the real-world failure modes of browser storage:
 *  - quota exceeded (Safari private mode throws on setItem)
 *  - storage disabled entirely
 *  - corrupted JSON on read
 *
 * When persistence fails, operations fall back to an in-memory map so the
 * session keeps working; a listener can be notified (e.g. to show a toast).
 */

let memoryStore = new Map<string, string>();
let memoryMode = false;

export type StorageListener = (event: "quota" | "error", detail: string) => void;
const listeners = new Set<StorageListener>();

export function onStorageIssue(listener: StorageListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(event: "quota" | "error", detail: string) {
  logger.warn(`storage ${event}: ${detail}`);
  listeners.forEach((l) => l(event, detail));
}

function canUseLocalStorage(): boolean {
  try {
    const testKey = "__tntbus_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function isQuotaError(err: unknown): boolean {
  if (typeof DOMException !== "undefined" && err instanceof DOMException) {
    return err.name === "QuotaExceededError";
  }
  if (err instanceof Error) {
    return /quota|exceeded/i.test(err.message);
  }
  return false;
}

export interface SafeStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): boolean;
  remove(key: string): void;
  has(key: string): boolean;
}

export const safeStorage: SafeStorage = {
  get<T>(key: string): T | null {
    if (!memoryMode && canUseLocalStorage()) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw) as T;
      } catch (err) {
        notify("error", `corrupt value for ${key}; falling back to memory`);
        memoryMode = true;
        const raw = window.localStorage.getItem(key);
        if (raw) {
          try {
            memoryStore.set(key, raw);
          } catch {
            /* ignore */
          }
        }
      }
    }
    const mem = memoryStore.get(key);
    return mem === undefined ? null : (JSON.parse(mem) as T);
  },

  set<T>(key: string, value: T): boolean {
    let raw: string;
    try {
      raw = JSON.stringify(value);
    } catch (err) {
      notify("error", `non-serializable value for ${key}`);
      return false;
    }

    if (!memoryMode && canUseLocalStorage()) {
      try {
        window.localStorage.setItem(key, raw);
        return true;
      } catch (err) {
        if (isQuotaError(err)) {
          notify("quota", `quota exceeded for ${key}`);
        } else {
          notify("error", `write failed for ${key}`);
        }
        memoryMode = true;
      }
    }
    memoryStore.set(key, raw);
    return false; // persisted only in-memory
  },

  remove(key: string): void {
    if (!memoryMode && canUseLocalStorage()) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    memoryStore.delete(key);
  },

  has(key: string): boolean {
    if (!memoryMode && canUseLocalStorage()) {
      try {
        return window.localStorage.getItem(key) !== null;
      } catch {
        /* ignore */
      }
    }
    return memoryStore.has(key);
  },
};

/** Reset in-memory fallback (mainly for tests). */
export function resetStorageForTests() {
  memoryStore = new Map();
  memoryMode = false;
}
