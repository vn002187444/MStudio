"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, type HTMLMotionProps } from "motion/react";
import { cn } from "../utils";

interface TiltCardProps extends Omit<HTMLMotionProps<"div">, "scale"> {
  maxAngle?: number;
  scale?: number;
}

export const TiltCard = ({
  className,
  children,
  maxAngle = 6,
  scale = 1.02,
  ...props
}: TiltCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 200, mass: 1 };
  
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateX = useTransform(springY, [-0.5, 0.5], [maxAngle, -maxAngle]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-maxAngle, maxAngle]);

  const glareX = useTransform(springX, [-0.5, 0.5], ["100%", "0%"]);
  const glareY = useTransform(springY, [-0.5, 0.5], ["100%", "0%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
      }}
      whileHover={{ scale }}
      className={cn("relative group rounded-[var(--bento-radius-outer)] transform-gpu", className)}
      {...props}
    >
      {/* Glare effect */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20 rounded-[var(--bento-radius-outer)] overflow-hidden transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: "radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 80%)",
          left: glareX as any,
          top: glareY as any,
          transform: "translate(-50%, -50%)",
          width: "200%",
          height: "200%",
        }}
      />
      {children as any}
    </motion.div>
  );
};
