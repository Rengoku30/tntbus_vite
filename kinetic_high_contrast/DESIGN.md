---
name: Kinetic High-Contrast
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#37393a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#cac8aa'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#939277'
  outline-variant: '#484831'
  surface-tint: '#cdcd00'
  primary: '#ffffff'
  on-primary: '#323200'
  primary-container: '#eaea00'
  on-primary-container: '#686800'
  inverse-primary: '#626200'
  secondary: '#c6c6c6'
  on-secondary: '#303030'
  secondary-container: '#474747'
  on-secondary-container: '#b5b5b5'
  tertiary: '#ffffff'
  on-tertiary: '#313030'
  tertiary-container: '#e5e2e1'
  on-tertiary-container: '#656464'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaea00'
  primary-fixed-dim: '#cdcd00'
  on-primary-fixed: '#1d1d00'
  on-primary-fixed-variant: '#494900'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  headline-xl:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: '900'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 20px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for urgency, reliability, and high glanceability. It targets travelers in fast-paced urban environments who require immediate information clarity. The aesthetic is **High-Contrast / Bold**, utilizing a restricted but powerful color palette to establish a dominant visual hierarchy. 

By stripping away unnecessary ornamentation and focusing on raw typographic weight and chromatic impact, the UI evokes a sense of "transportation utility"—reminiscent of international transit signage. The emotional response is one of confidence and efficiency: the system feels loud enough to be heard in a crowded station but organized enough to handle complex booking flows.

## Colors

The palette is strictly functional. The **Primary Yellow (#FFFF00)** is the "action" color, used exclusively for primary interactions, status highlights, and critical information. **Deep Black (#000000)** serves as the canvas, providing maximum contrast for the yellow elements to "pop." 

A secondary **Dark Grey (#1A1A1A)** is used for container backgrounds to provide subtle depth without breaking the high-contrast aesthetic. **Pure White (#FFFFFF)** is reserved for primary body text and icons to ensure AAA accessibility against dark backgrounds. Functional colors (Success/Error) are dialed to high-saturation neon variants to maintain the energetic tone of the design system.

## Typography

This design system utilizes a dual-font strategy. **Montserrat** is the display face, used for headlines and branding. Its geometric, wide stance provides the "boldness" required for the identity. **Inter** is the workhorse for all UI elements, data points, and body copy, chosen for its exceptional legibility at small sizes and high-density screens.

Headlines should use heavy weights (ExtraBold/Black) to anchor the page. Data points such as bus numbers or prices should utilize `label-bold` with slight letter spacing to mimic industrial ticketing systems.

## Layout & Spacing

The layout follows a **Fixed Grid** model on mobile (4 columns) and a **Fluid Grid** (12 columns) on desktop. The system relies on an 8px base unit. 

Large margins (20px) are used at the screen edges to prevent the high-contrast elements from feeling cramped. Vertical spacing is generous between distinct sections (`stack-lg`) but tight within data groups (`stack-sm`) to create clear "clumping" of related travel information. Card components should use a consistent 16px internal padding to maintain a structured, systematic appearance.

## Elevation & Depth

To maintain the bold, graphic nature of the brand, this design system avoids soft, ambient shadows. Instead, it uses **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Surface):** Pure Black (#000000).
- **Level 1 (Cards/Inputs):** Dark Grey (#1A1A1A).
- **Level 2 (Modals/Popovers):** Dark Grey (#2A2A2A) with a 1px solid Primary Yellow border.

Hierarchy is created through color intensity rather than physical shadow. The most important interactive elements are flat and saturated, while secondary containers are defined by subtle value shifts in the grey scale.

## Shapes

The design system employs **Rounded** corners (0.5rem base) to soften the aggressive high-contrast color scheme. This prevents the UI from feeling too "hostile" or "military." 

Buttons and input fields share the same radius for consistency. Larger containers, like booking cards, use `rounded-lg` (1rem) to create a clear containerized feel. Pill-shapes are used exclusively for status tags (e.g., "On Time," "Delayed") to distinguish them from rectangular action buttons.

## Components

### Buttons
- **Primary:** Background #FFFF00, Text #000000, FontWeight 700. Full width on mobile.
- **Secondary:** Transparent background, 2px border #FFFF00, Text #FFFF00.
- **Ghost:** Text #FFFFFF, no border.

### Input Fields
- **Default:** Background #1A1A1A, 1px border #333333, Text #FFFFFF.
- **Active:** 2px border #FFFF00.
- **Labels:** Use `label-bold` in #FFFF00 for high visibility.

### Cards
Booking cards use a #1A1A1A background. Information like "Departure Time" and "Bus Number" should be in the primary yellow to act as visual anchors during a quick scan.

### Chips/Tags
Used for filters (e.g., "AC", "Sleeper"). When unselected: Border #333333, Text #FFFFFF. When selected: Background #FFFF00, Text #000000.

### Navigation
The bottom navigation bar should be Pure Black with #FFFF00 icons for the active state and #666666 for inactive states. No blur effects; keep it crisp.