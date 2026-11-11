"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "../utils";

export const Hero3D = ({ className }: { className?: string }) => {
  const [active, setActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Defer canvas activation so initial paint (FCP, LCP) and hydration are 100% unblocked
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches) return;

    let timer: ReturnType<typeof setTimeout>;
    if (typeof requestIdleCallback !== "undefined") {
      const idle = requestIdleCallback(() => setActive(true), { timeout: 2000 });
      return () => cancelIdleCallback(idle);
    } else {
      timer = setTimeout(() => setActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    let particles: { x: number; y: number; baseX: number; baseY: number; phaseX: number; phaseY: number; size: number }[] = [];
    let spacing = 40;

    const initParticles = () => {
      particles = [];
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          particles.push({
            x,
            y,
            baseX: x,
            baseY: y,
            phaseX: x * 0.01,
            phaseY: y * 0.01,
            size: Math.random() * 1.5 + 0.5,
          });
        }
      }
    };

    initParticles();

    let mouseX = width / 2;
    let mouseY = height / 2;
    let isIntersecting = true;
    let cachedX = 0;
    let cachedY = 0;

    const updateRect = () => {
      const rect = canvas.getBoundingClientRect();
      cachedX = rect.left + window.scrollX;
      cachedY = rect.top + window.scrollY;
    };

    updateRect();

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.pageX - cachedX;
      mouseY = e.pageY - cachedY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles();
      updateRect();
    });
    resizeObserver.observe(container);

    let animationFrameId: number;
    let time = 0;
    let isDrawing = false;

    const intersectionObserver = new IntersectionObserver((entries) => {
      isIntersecting = entries[0].isIntersecting;
      if (isIntersecting && !isDrawing) {
        isDrawing = true;
        animationFrameId = requestAnimationFrame(draw);
      } else if (!isIntersecting) {
        isDrawing = false;
      }
    });
    intersectionObserver.observe(container);

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
        isDrawing = false;
        return;
      }
      isDrawing = true;
      time += 0.01;

      ctx.fillStyle = isLight ? "#F1F5F9" : "#09090D";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 0; y < height; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      for (let x = 0; x < width; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.stroke();

      const baseAlpha = isLight ? 0.15 : 0.1;
      const batches: Record<number, typeof particles> = { 0: [] };
      for (let i = 2; i <= 9; i++) batches[i] = [];

      particles.forEach((p) => {
        const dx = mouseX - p.baseX;
        const dy = mouseY - p.baseY;
        const distSq = dx * dx + dy * dy;
        const wave = Math.sin(p.phaseX + time) * Math.cos(p.phaseY + time) * 10;

        if (distSq > 90000) {
          p.x = p.baseX;
          p.y = p.baseY + wave;
          batches[0].push(p);
        } else {
          const force = Math.max(0, 1 - distSq / 22500); // 150 * 150 = 22500
          p.x = p.baseX - dx * force * 0.1;
          p.y = p.baseY - dy * force * 0.1 + wave;

          // 350 * 350 = 122500, 300 * 300 = 90000
          const rawAlpha = isLight ? Math.max(baseAlpha, 0.85 - (distSq / 122500)) : Math.max(baseAlpha, 1 - (distSq / 90000));
          const activeAlphaIndex = Math.min(9, Math.max(2, Math.round(rawAlpha * 10)));
          batches[activeAlphaIndex].push(p);
        }
      });

      ctx.fillStyle = isLight ? `rgba(37, 99, 235, ${baseAlpha})` : `rgba(6, 182, 212, ${baseAlpha})`;
      ctx.beginPath();
      batches[0].forEach(p => {
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      });
      ctx.fill();

      for (let i = 2; i <= 9; i++) {
        if (batches[i].length === 0) continue;
        const alpha = i / 10;
        ctx.fillStyle = isLight ? `rgba(37, 99, 235, ${alpha})` : `rgba(6, 182, 212, ${alpha})`;
        ctx.beginPath();
        batches[i].forEach(p => {
          ctx.moveTo(p.x, p.y);
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        });
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden bg-[var(--void-deep)] transition-colors duration-500", className)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#09090D] via-[#0D1117] to-[#1a1a2e] [html.light_&]:from-[#F1F5F9] [html.light_&]:via-[#E2E8F0] [html.light_&]:to-[#CBD5E1]" />
      {active && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 block pointer-events-none transition-opacity duration-1000 opacity-100"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
