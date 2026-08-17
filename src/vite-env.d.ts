/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_FAILURE_RATE?: string;
  readonly VITE_API_LATENCY_MS?: string;
  readonly VITE_SEAT_LOCK_TTL_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
