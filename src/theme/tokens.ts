/**
 * Raw design tokens for JS consumers (mirrors tailwind.config.ts).
 * Kept in sync by hand; used where Tailwind classes can't express a value
 * (e.g. inline styles, canvas, charts).
 */
export const tokens = {
  colors: {
    background: "#121414",
    surface: "#121414",
    surfaceLow: "#1a1c1c",
    surfaceContainer: "#1e2020",
    surfaceHigh: "#282a2b",
    surfaceHighest: "#333535",
    onSurface: "#e2e2e2",
    onSurfaceVariant: "#cac8aa",
    primary: "#ffffff",
    primaryContainer: "#eaea00",
    primaryFixedDim: "#cdcd00",
    onPrimaryContainer: "#686800",
    onPrimaryFixed: "#1d1d00",
    secondary: "#c6c6c6",
    error: "#ffb4ab",
    errorContainer: "#93000a",
    onErrorContainer: "#ffdad6",
    outline: "#939277",
    outlineVariant: "#484831",
    premium: "#ff9900",
  },
  radius: { sm: 4, md: 12, lg: 8, xl: 12, full: 9999 },
  spacing: { unit: 8, sm: 8, md: 16, lg: 32, gutter: 16, margin: 20 },
} as const;
