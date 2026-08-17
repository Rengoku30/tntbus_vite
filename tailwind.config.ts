import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

/**
 * Single source of truth for the "Kinetic High-Contrast" design system.
 * Tokens lifted from kinetic_high_contrast/DESIGN.md and the inline configs in
 * the 9 page mockups (they are identical, so this consolidates them).
 */
const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        background: "#121414",
        surface: "#121414",
        "surface-dim": "#121414",
        "surface-bright": "#37393a",
        "surface-container-lowest": "#0c0f0f",
        "surface-container-low": "#1a1c1c",
        "surface-container": "#1e2020",
        "surface-container-high": "#282a2b",
        "surface-container-highest": "#333535",
        "surface-variant": "#333535",
        "surface-tint": "#cdcd00",

        // Foreground
        "on-surface": "#e2e2e2",
        "on-surface-variant": "#cac8aa",
        "on-background": "#e2e2e2",

        // Primary (action yellow)
        primary: "#ffffff",
        "on-primary": "#323200",
        "primary-container": "#eaea00",
        "on-primary-container": "#686800",
        "primary-fixed": "#eaea00",
        "primary-fixed-dim": "#cdcd00",
        "on-primary-fixed": "#1d1d00",
        "on-primary-fixed-variant": "#494900",
        "inverse-primary": "#626200",

        // Secondary (grey)
        secondary: "#c6c6c6",
        "on-secondary": "#303030",
        "secondary-container": "#474747",
        "on-secondary-container": "#b5b5b5",
        "secondary-fixed": "#e2e2e2",
        "secondary-fixed-dim": "#c6c6c6",
        "on-secondary-fixed": "#1b1b1b",
        "on-secondary-fixed-variant": "#474747",

        // Tertiary
        tertiary: "#ffffff",
        "on-tertiary": "#313030",
        "tertiary-container": "#e5e2e1",
        "on-tertiary-container": "#656464",
        "tertiary-fixed": "#e5e2e1",
        "tertiary-fixed-dim": "#c8c6c5",
        "on-tertiary-fixed": "#1c1b1b",
        "on-tertiary-fixed-variant": "#474746",

        // Error
        error: "#ffb4ab",
        "on-error": "#690005",
        "error-container": "#93000a",
        "on-error-container": "#ffdad6",

        // Inverse
        "inverse-surface": "#e2e2e2",
        "inverse-on-surface": "#2f3131",

        // Lines
        outline: "#939277",
        "outline-variant": "#484831",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.25rem",
        md: "0.75rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      spacing: {
        unit: "8px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "stack-lg": "32px",
        gutter: "16px",
        "container-margin": "20px",
      },
      fontFamily: {
        sans: ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
        body: ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
        "body-md": ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
        "body-lg": ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
        "label-sm": ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
        "label-bold": ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
        display: ['"Montserrat Variable"', ...defaultTheme.fontFamily.sans],
        headline: ['"Montserrat Variable"', ...defaultTheme.fontFamily.sans],
        "headline-md": ['"Montserrat Variable"', ...defaultTheme.fontFamily.sans],
        "headline-lg": ['"Montserrat Variable"', ...defaultTheme.fontFamily.sans],
        "headline-xl": ['"Montserrat Variable"', ...defaultTheme.fontFamily.sans],
        "headline-lg-mobile": [
          '"Montserrat Variable"',
          ...defaultTheme.fontFamily.sans,
        ],
      },
      fontSize: {
        "label-bold": ["14px", { lineHeight: "20px", letterSpacing: "0.05em", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "800" }],
        "headline-xl": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "900" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-lg-mobile": ["28px", { lineHeight: "34px", fontWeight: "800" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "500" }],
      },
      keyframes: {
        popIn: {
          "0%": { transform: "scale(0.8)", opacity: "0.5" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        bounceSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        spin: { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        popIn: "popIn 0.2s cubic-bezier(0.175,0.885,0.32,1.275) forwards",
        bounceSlow: "bounceSlow 1s ease-in-out infinite",
        fadeIn: "fadeIn 0.2s ease-out forwards",
        slideUp: "slideUp 0.25s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
