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
    border: "#E3E3E3",
    ink700: "#3A3A3A",
    ink800: "#2A2A2A",
    ink900: "#1C1C1C",
    aiBlue: "#2563EB",
    breakingRed: "#D92D20",
    cryptoGreen: "#16A36A",
    entertainmentPurple: "#8B5CF6",
  },
  radius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
  },
  motion: {
    durationFast: "120ms",
    durationBase: "200ms",
    durationSlow: "320ms",
    easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
    easeStandard: "cubic-bezier(0.2, 0, 0, 1)",
  },
  text: {
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
  headerOffset: "88px",
  maxContentWidth: "1280px",
  fontSans:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

export type Tokens = typeof tokens;
