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
  maxContentWidth: "1280px",
  fontSans:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

export type Tokens = typeof tokens;
