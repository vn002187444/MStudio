/**
 * MStudio Channel design tokens.
 * Single source of truth for brand colors, spacing and radii.
 * CSS custom properties live in tokens.css — keep both files in sync.
 */
export const tokens = {
  color: {
    black: "#07080B",
    ink: "#F8FAFC",
    white: "#FFFFFF",
    offWhite: "#0D1117",
    soft: "#161B22",
    gray: "#94A3B8",
    border: "rgba(255, 255, 255, 0.12)",
    ink700: "#CBD5E1",
    ink800: "#334155",
    ink900: "#1E293B",
    aiBlue: "#06B6D4",
    breakingRed: "#F43F5E",
    cryptoGreen: "#10B981",
    entertainmentPurple: "#A855F7",
    /* Semantic */
    bg: "#07080B",
    surface: "#0D1117",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    brand: "#2563EB",
    brandHover: "#3B82F6",
    breaking: "#F43F5E",
    success: "#10B981",
    warning: "#F59E0B",
    /* Hybrid Glassmorphic Zones */
    voidDeep: "#07080B",
    voidSurface: "#0D1117",
    voidSubtle: "#161B22",
    solarLight: "#F8FAFC",
    solarSurface: "#1E293B",
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
  spacing: {
    mobileDockHeight: "64px",
    mobileTopBarHeight: "56px",
    bentoPadding: "16px",
  },
} as const;
