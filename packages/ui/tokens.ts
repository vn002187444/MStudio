/**
 * MStudio Channel design tokens.
 * Single source of truth for brand colors, spacing and radii (PLAN.md UX spec).
 * CSS custom properties live in tokens.css — keep both files in sync.
 */
export const tokens = {
  color: {
    black: "#090909",
    ink: "#101114",
    white: "#FFFFFF",
    offWhite: "#F6F6F4",
    soft: "#F6F7F9",
    gray: "#667085",
    border: "#E3E5E8",
    ink700: "#3A3A3A",
    ink800: "#2A2A2A",
    ink900: "#1C1C1C",
    aiBlue: "#2563EB",
    breakingRed: "#D92D20",
    cryptoGreen: "#16A36A",
    entertainmentPurple: "#8B5CF6",
    /* Semantic */
    bg: "#FFFFFF",
    surface: "#F7F8FA",
    textPrimary: "#101114",
    textSecondary: "#5F636B",
    brand: "#155EEF",
    brandHover: "#0B4DD8",
    breaking: "#D92D20",
    success: "#16803A",
    warning: "#B54708",
    /* Hybrid Glassmorphic Zones */
    voidDeep: "#07080B",
    voidSurface: "#0D1117",
    voidSubtle: "#161B22",
    solarLight: "#F8FAFC",
    solarSurface: "#F1F5F9",
    /* Category Optical Auras */
    aura: {
      techPrimary: "#2563EB",
      techSecondary: "#06B6D4",
      businessPrimary: "#059669",
      businessSecondary: "#D97706",
      worldPrimary: "#DC2626",
      worldSecondary: "#475569",
      sciencePrimary: "#8B5CF6",
      scienceSecondary: "#EC4899",
      autoPrimary: "#EA580C",
      autoSecondary: "#334155",
      lifePrimary: "#10B981",
      lifeSecondary: "#F59E0B",
    },
  },
  radius: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    bentoOuter: "24px",
    bentoInner: "8px",
    bentoLgOuter: "28px",
    bentoLgInner: "8px",
    bentoSmOuter: "16px",
    bentoSmInner: "4px",
  },
  motion: {
    durationInstant: "80ms",
    durationFast: "150ms",
    durationBase: "250ms",
    durationSlow: "400ms",
    springApple: "cubic-bezier(0.32, 0.72, 0, 1)",
    easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
    easeStandard: "cubic-bezier(0.2, 0, 0, 1)",
    springBouncy: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
  text: {
    /* Mobile-first values; desktop override at breakpoint */
    display: "40px",
    h1: "32px",
    h2: "26px",
    h3: "21px",
    cardTitle: "17px",
    body: "17px",
    ui: "16px",
    meta: "14px",
    label: "12px",
    /* Legacy aliases */
    xs: "12px",
    sm: "13px",
    base: "16px",
    lg: "18px",
    xl: "20px",
    x2l: "24px",
    x3l: "28px",
    x4l: "32px",
  },
  z: {
    base: 0,
    raised: 10,
    sticky: 50,
    overlay: 100,
    modal: 200,
  },
  grid: {
    container: "1280px",
    gutter: "24px",
    gutterMobile: "16px",
    bentoPadding: "16px",
  },
  mobile: {
    dockHeight: "64px",
    topBarHeight: "56px",
  },
  headerOffset: "56px",
  maxContentWidth: "1280px",
  fontSans:
    '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

export type Tokens = typeof tokens;
