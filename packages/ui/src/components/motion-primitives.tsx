"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "../utils";

export const StaggerContainer = ({
  children,
  className,
  delay = 0,
  staggerChildren = 0.1,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; staggerChildren?: number }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren,
            delayChildren: delay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const FadeSlide = ({
  children,
  className,
  y = 20,
  ...props
}: HTMLMotionProps<"div"> & { y?: number }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            damping: 20,
            stiffness: 100,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const SpringButton = React.forwardRef<
  HTMLButtonElement,
  HTMLMotionProps<"button"> & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const isReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <motion.button
      ref={ref}
      whileHover={isReducedMotion ? {} : { scale: 1.02 }}
      whileTap={isReducedMotion ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
});
SpringButton.displayName = "SpringButton";
