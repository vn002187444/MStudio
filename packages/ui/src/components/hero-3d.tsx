"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "../utils";

export const Hero3D = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    let particles: { x: number; y: number; baseX: number; baseY: number; size: number }[] = [];
    let spacing = 40;

    const initParticles = () => {
      spacing = width < 768 ? 60 : 40;
      particles = [];
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          particles.push({
            x,
            y,
            baseX: x,
            baseY: y,
            size: Math.random() * 1.5 + 0.5,
          });
        }
      }
    };

    initParticles();

    let mouseX = width / 2;
    let mouseY = height / 2;
    let isIntersecting = true;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver((entries) => {
      isIntersecting = entries[0].isIntersecting;
    });
    intersectionObserver.observe(container);

    let animationFrameId: number;
    let time = 0;


    let isLight =
      typeof document !== "undefined" &&
      (document.documentElement.classList.contains("light") ||
        document.documentElement.getAttribute("data-theme") === "light");

    const themeObserver = new MutationObserver(() => {
      isLight =
        document.documentElement.classList.contains("light") ||
        document.documentElement.getAttribute("data-theme") === "light";
    });

    if (typeof document !== "undefined") {
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });
    }

    const draw = () => {

      if (!isIntersecting) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      time += 0.01;



      // Clear background according to active theme
      ctx.fillStyle = isLight ? "#F1F5F9" : "#09090D";
      ctx.fillRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;

      // Horizontal lines
      ctx.beginPath();
      for (let y = 0; y < height; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Vertical lines
      ctx.beginPath();
      for (let x = 0; x < width; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.stroke();

      particles.forEach((p) => {
        const dx = mouseX - p.baseX;
        const dy = mouseY - p.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Wave effect
        const wave = Math.sin(p.baseX * 0.01 + time) * Math.cos(p.baseY * 0.01 + time) * 10;

        // Mouse repulsion
        const force = Math.max(0, 150 - distance) / 150;
        const pushX = dx * force * 0.1;
        const pushY = dy * force * 0.1;

        p.x = p.baseX - pushX;
        p.y = p.baseY - pushY + wave;

        // Draw particle with theme-aware accent
        ctx.fillStyle = isLight
          ? `rgba(37, 99, 235, ${Math.max(0.15, 0.85 - distance / 350)})`
          : `rgba(6, 182, 212, ${Math.max(0.1, 1 - distance / 300)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };


    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (typeof requestIdleCallback !== "undefined") {
      idleId = requestIdleCallback(() => {
        animationFrameId = requestAnimationFrame(draw);
      });
    } else {
      timeoutId = setTimeout(() => {
        animationFrameId = requestAnimationFrame(draw);
      }, 0);
    }


    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (idleId !== undefined && typeof cancelIdleCallback !== "undefined") cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden bg-[var(--void-deep)] transition-colors duration-500", className)}
    >
      {/* Fallback CSS gradient when JS not running or reduced motion */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#09090D] via-[#0D1117] to-[#1a1a2e] [html.light_&]:from-[#F1F5F9] [html.light_&]:via-[#E2E8F0] [html.light_&]:to-[#CBD5E1]" />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 block pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};
