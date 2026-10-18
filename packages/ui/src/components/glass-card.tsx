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
            "bg-slate-900/70 text-slate-100 border-white/10": variant === "light",
            "bg-[#07080B]/90 text-slate-100 border-white/10 shadow-2xl": variant === "dark",
            "bg-gradient-to-br from-white/10 to-white/5 text-slate-100 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.2),_0_20px_40px_-15px_rgba(0,0,0,0.5)]": variant === "hybrid",
          },
          className
        )}
        {...props}
      >
        {glow && (
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-blue-500/10 opacity-60 pointer-events-none" />
        )}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "dark", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-[var(--radius-lg)] overflow-hidden p-6",
          "backdrop-blur-[16px] backdrop-saturate-[150%]",
          "border border-white/10 shadow-xl",
          {
            "bg-slate-900/80 text-slate-100 border-white/10": variant === "light" || variant === "dark",
            "bg-gradient-to-br from-white/10 to-white/5 text-slate-100 border-white/10": variant === "hybrid",
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
          "backdrop-blur-md bg-white/10 border border-white/20 text-white shadow-sm",
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
