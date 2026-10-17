import React from "react";
import { cn } from "../utils";

export interface BrandLogoProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "channel" | "studio" | "mark-only";
  size?: "sm" | "md" | "lg";
  isDark?: boolean;
}

export function BrandLogo({
  variant = "channel",
  size = "md",
  isDark = true,
  className,
  ...props
}: BrandLogoProps) {
  const sizeConfig = {
    sm: { mark: 24, text: "text-sm", sub: "text-[9px]" },
    md: { mark: 32, text: "text-base", sub: "text-[10px]" },
    lg: { mark: 40, text: "text-xl", sub: "text-xs" },
  }[size];

  return (
    <a
      href="/"
      translate="no"
      className={cn(
        "inline-flex items-center gap-3 font-sans no-underline group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 rounded-lg",
        className
      )}
      {...props}
    >
      {/* Futuristic Geometric Glass Monogram M */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105"
        style={{
          width: sizeConfig.mark,
          height: sizeConfig.mark,
          background: "linear-gradient(135deg, rgba(37,99,235,0.85) 0%, rgba(9,9,13,0.95) 100%)",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.4), 0 4px 12px rgba(37,99,235,0.25)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[60%] h-[60%] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
          aria-hidden="true"
        >
          {/* Futuristic Faceted Polygon M */}
          <path
            d="M4 19V5L12 13L20 5V19M8 15L12 11L16 15"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Subtle Ambient Refraction Sheen */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>

      {variant !== "mark-only" && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-black tracking-wider uppercase",
                sizeConfig.text,
                isDark ? "text-white" : "text-[var(--ink)]"
              )}
            >
              MSTUDIO
            </span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded font-bold uppercase tracking-widest",
                sizeConfig.sub,
                variant === "channel"
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/30"
                  : "bg-purple-600/30 text-purple-300 border border-purple-500/30"
              )}
            >
              {variant === "channel" ? "CHANNEL" : "STUDIO"}
            </span>
          </div>
        </div>
      )}
    </a>
  );
}
