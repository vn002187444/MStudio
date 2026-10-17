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
    const spacing = 40;
    
    const initParticles = () => {
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

    const draw = () => {
      if (!isIntersecting) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      time += 0.01;
      
      // Clear with dark void background
      ctx.fillStyle = "#09090D";
      ctx.fillRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
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

        // Draw particle
        ctx.fillStyle = `rgba(37, 99, 235, ${Math.max(0.1, 1 - distance / 300)})`; // AI Blue
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden bg-[var(--void-deep)]", className)}
    >
      {/* Fallback CSS gradient when JS not running or reduced motion */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#09090D] via-[#0D1117] to-[#1a1a2e]" />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 block pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};
