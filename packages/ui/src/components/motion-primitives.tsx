"use client";

import React from "react";
import { cn } from "../utils";

export { SpringButton } from "./spring-button";

export const StaggerContainer = ({
  children,
  className,
  delay: _delay = 0,
  staggerChildren: _staggerChildren = 0.1,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { delay?: number; staggerChildren?: number }) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

export const FadeSlide = ({
  children,
  className,
  y: _y = 20,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { y?: number }) => {
  return (
    <div className={cn("transition-opacity duration-300 ease-out", className)} {...props}>
      {children}
    </div>
  );
};
