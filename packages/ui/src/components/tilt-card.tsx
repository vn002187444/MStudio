"use client";

import React, { useRef } from "react";
import { cn } from "../utils";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  maxAngle?: number;
  scale?: number;
}

/**
 * Lightweight GPU-composited 3D tilt card using CSS custom properties.
 * Zero motion/react runtime cost on mobile & initial page hydration.
 */
export const TiltCard = ({
  className,
  children,
  maxAngle = 6,
  scale = 1.02,
  style,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  ...props
}: TiltCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<{ width: number; height: number; left: number; top: number } | null>(null);
  const disabledRef = useRef<boolean | null>(null);

  const isDisabled = () => {
    if (disabledRef.current === null && typeof window !== "undefined") {
      disabledRef.current =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        window.matchMedia("(pointer: coarse)").matches;
    }
    return disabledRef.current ?? false;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseEnter?.(e);
    if (!ref.current || isDisabled()) return;
    const rect = ref.current.getBoundingClientRect();
    rectRef.current = {
      width: rect.width,
      height: rect.height,
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
    };
    ref.current.style.setProperty("--tilt-scale", String(scale));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseMove?.(e);
    const el = ref.current;
    if (!el || isDisabled()) return;

    let rect = rectRef.current;
    if (!rect) {
      const rawRect = el.getBoundingClientRect();
      rect = {
        width: rawRect.width,
        height: rawRect.height,
        left: rawRect.left + window.scrollX,
        top: rawRect.top + window.scrollY,
      };
      rectRef.current = rect;
    }

    if (rect.width <= 0 || rect.height <= 0) return;
    const xPct = (e.pageX - rect.left) / rect.width - 0.5;
    const yPct = (e.pageY - rect.top) / rect.height - 0.5;

    el.style.setProperty("--tilt-rx", `${(-yPct * maxAngle).toFixed(2)}deg`);
    el.style.setProperty("--tilt-ry", `${(xPct * maxAngle).toFixed(2)}deg`);
    el.style.setProperty("--glare-x", `${((0.5 - xPct) * 100).toFixed(1)}%`);
    el.style.setProperty("--glare-y", `${((0.5 - yPct) * 100).toFixed(1)}%`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseLeave?.(e);
    const el = ref.current;
    if (el) {
      el.style.setProperty("--tilt-rx", "0deg");
      el.style.setProperty("--tilt-ry", "0deg");
      el.style.setProperty("--tilt-scale", "1");
    }
    rectRef.current = null;
  };

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform:
          "perspective(1000px) rotateX(var(--tilt-rx, 0deg)) rotateY(var(--tilt-ry, 0deg)) scale(var(--tilt-scale, 1))",
        transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        ...style,
      }}
      className={cn("relative group rounded-[var(--bento-radius-outer)] transform-gpu", className)}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 rounded-[var(--bento-radius-outer)] overflow-hidden transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,255,255,0.18) 0%, transparent 65%)",
        }}
      />
      {children}
    </div>
  );
};
