import React from "react";
import { cn } from "../utils";

export interface BrandLogoProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "channel" | "studio" | "mark-only";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isDark?: boolean;
}

/**
 * Pure SVG Sapphire Faceted Monogram M
 * Can be rendered anywhere independently (Headers, Footers, Favicons, OG images).
 */
export function BrandMonogram({
  size = 32,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-hidden="true"
      {...props}
    >
      <defs>
        {/* Outer Sapphire Glass Rounded Squircle Gradient */}
        <linearGradient id="m-squircle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0B132B" />
        </linearGradient>

        {/* Facet Left Shading */}
        <linearGradient id="facet-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.7" />
        </linearGradient>

        {/* Facet Center Diamond */}
        <linearGradient id="facet-center" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.8" />
        </linearGradient>

        {/* Facet Right Shading */}
        <linearGradient id="facet-right" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.9" />
        </linearGradient>

        {/* Specular Edge Filter */}
        <filter id="sapphire-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Squircle Chassis with Specular Rim */}
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="24"
        fill="url(#m-squircle-grad)"
        stroke="rgba(255, 255, 255, 0.28)"
        strokeWidth="2"
      />

      {/* Internal Inner Light Ring */}
      <rect
        x="8"
        y="8"
        width="84"
        height="84"
        rx="22"
        fill="none"
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth="1"
      />

      {/* Geometric Faceted Monogram M */}
      <g filter="url(#sapphire-glow)">
        {/* Left Wing Facet */}
        <path
          d="M24 74 V30 L40 46 V74 Z"
          fill="url(#facet-left)"
        />
        {/* Center Inverted Diamond Facet */}
        <path
          d="M40 46 L50 36 L60 46 L50 62 Z"
          fill="url(#facet-center)"
        />
        {/* Right Wing Facet */}
        <path
          d="M76 74 V30 L60 46 V74 Z"
          fill="url(#facet-right)"
        />
        {/* Precision Core Line */}
        <path
          d="M24 74 L24 28 L50 56 L76 28 L76 74"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function BrandLogo({
  variant = "channel",
  size = "md",
  isDark = true,
  className,
  ...props
}: BrandLogoProps) {
  const sizeConfig = {
    xs: { mark: 22, text: "text-xs", sub: "text-[8px]" },
    sm: { mark: 26, text: "text-sm", sub: "text-[9px]" },
    md: { mark: 32, text: "text-base", sub: "text-[10px]" },
    lg: { mark: 38, text: "text-lg", sub: "text-xs" },
    xl: { mark: 48, text: "text-2xl", sub: "text-sm" },
  }[size];

  return (
    <a
      href="/"
      translate="no"
      className={cn(
        "inline-flex items-center gap-2.5 font-sans no-underline group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 rounded-lg",
        className
      )}
      {...props}
    >
      {/* Sapphire Faceted Glass Monogram M with Ambient Glow */}
      <div className="relative shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:rotate-1">
        <div className="absolute inset-0 rounded-2xl bg-blue-500/25 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <BrandMonogram size={sizeConfig.mark} />
      </div>

      {variant !== "mark-only" && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-black tracking-wider uppercase drop-shadow-sm",
                sizeConfig.text,
                isDark ? "text-white [html.light_&]:text-slate-900" : "text-[var(--ink,#101114)]"
              )}

            >
              MSTUDIO
            </span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded font-bold uppercase tracking-widest backdrop-blur-sm transition-colors",
                sizeConfig.sub,
                variant === "channel"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-400/30 group-hover:bg-blue-500/30"
                  : "bg-purple-500/20 text-purple-300 border border-purple-400/30 group-hover:bg-purple-500/30"
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
