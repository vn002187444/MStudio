"use client";

import React from "react";
import { cn } from "../utils";

export type GlassVariant = "light" | "dark" | "hybrid";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  glow?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "hybrid", glow = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-[var(--bento-radius-outer)] overflow-hidden",
          "backdrop-blur-[20px] backdrop-saturate-[180%]",
          "border border-white/10",
          {
            "bg-[var(--solar-surface)]/80 text-[var(--ink)]": variant === "light",
            "bg-[var(--void-surface)]/80 text-[var(--solar-light)] border-white/5": variant === "dark",
            "bg-gradient-to-br from-white/5 to-white/0 text-[var(--ink)] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.2),_0_20px_40px_-15px_rgba(0,0,0,0.3)]": variant === "hybrid",
          },
          className
        )}
        {...props}
      >
        {glow && (
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-white/0 to-white/10 opacity-50 pointer-events-none" />
        )}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "light", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-[var(--radius-lg)] overflow-hidden p-6",
          "backdrop-blur-[16px] backdrop-saturate-[150%]",
          "border border-white/20 shadow-sm",
          {
            "bg-white/60 text-[var(--ink)]": variant === "light",
            "bg-black/60 text-white border-white/10": variant === "dark",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassPanel.displayName = "GlassPanel";

export const GlassBadge = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
          "backdrop-blur-md bg-white/20 border border-white/30 text-[var(--ink)] shadow-sm",
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
GlassBadge.displayName = "GlassBadge";
