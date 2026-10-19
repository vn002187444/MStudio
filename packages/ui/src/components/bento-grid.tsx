"use client";

import React from "react";
import { cn } from "../utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6 2xl:gap-8 max-w-[var(--container)] mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({
  className,
  children,
  colSpan = 1,
  rowSpan = 1,
}: {
  className?: string;
  children?: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4 | 6 | 8 | 12;
  rowSpan?: 1 | 2;
}) => {
  const colSpanClasses: Record<number, string> = {
    1: "bento-col-1 bento-col-md-1 lg:col-span-1 md:col-span-1 col-span-1",
    2: "bento-col-2 bento-col-md-2 lg:col-span-2 md:col-span-2 col-span-1",
    3: "bento-col-3 bento-col-md-3 lg:col-span-3 md:col-span-3 col-span-1",
    4: "bento-col-4 bento-col-md-4 lg:col-span-4 md:col-span-4 col-span-1",
    6: "bento-col-6 bento-col-md-6 lg:col-span-6 md:col-span-6 col-span-1",
    8: "bento-col-8 bento-col-md-6 lg:col-span-8 md:col-span-6 col-span-1",
    12: "bento-col-12 bento-col-md-6 lg:col-span-12 md:col-span-6 col-span-1",
  };

  const rowSpanClasses: Record<number, string> = {
    1: "row-span-1",
    2: "row-span-2",
  };

  return (
    <div
      className={cn(
        "relative rounded-[var(--bento-radius-outer)] p-[var(--bento-padding)]",
        "bg-[var(--bg)] border border-[var(--border)]",
        colSpanClasses[colSpan],
        rowSpanClasses[rowSpan],
        className
      )}
    >
      <div className="relative z-10 w-full h-full rounded-[var(--bento-radius-inner)] overflow-hidden">
        {children}
      </div>
    </div>
  );
};
