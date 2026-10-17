"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "../utils";

export const AmbientGlow = ({
  className,
  color = "rgba(37,99,235,0.15)", // Default AI Blue glow
  size = "500px",
}: {
  className?: string;
  color?: string;
  size?: string;
}) => {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        }}
      />
    </div>
  );
};

export const SpotlightGlow = ({
  className,
  color = "rgba(255,255,255,0.08)",
}: {
  className?: string;
  color?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      container.style.setProperty("--mouse-x", `${x}px`);
      container.style.setProperty("--mouse-y", `${y}px`);
    };

    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none absolute inset-0 z-10 overflow-hidden transition-opacity duration-300 opacity-0 group-hover:opacity-100",
        className
      )}
      style={{
        background: `radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), ${color}, transparent 40%)`,
      }}
      aria-hidden="true"
    />
  );
};
