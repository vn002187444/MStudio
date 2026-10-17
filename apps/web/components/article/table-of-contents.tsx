"use client";

import React, { useEffect, useState } from "react";
import { GlassCard } from "@mstudio/ui";

export interface TocHeading {
  level: number;
  text: string;
  id: string;
}

export type TocItem = TocHeading;

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function extractHeadings(body: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const normalized = body
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n");

  for (const line of normalized.split("\n")) {
    const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    const text = match[2].trim();
    if (!text) continue;
    headings.push({
      level: match[1].length === 3 ? 3 : 2,
      text,
      id: slugifyHeading(text) || `heading-${headings.length + 1}`,
    });
  }
  return headings;
}

export function TableOfContents({
  headings,
  items,
}: {
  headings?: TocHeading[];
  items?: TocHeading[];
}) {
  const activeList = items || headings || [];
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (activeList.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    activeList.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [activeList]);

  if (activeList.length === 0) return null;

  return (
    <nav aria-label="Mục lục bài viết" className="hidden lg:block sticky top-[96px] w-[260px] float-right ml-8 mb-8 z-[var(--z-sticky)]">
      <GlassCard variant="hybrid" className="p-5 shadow-xl border-black/5 bg-white/60">
        <h4 className="text-[13px] font-bold uppercase tracking-widest text-[var(--gray)] mb-4 pb-2 border-b border-black/5">
          Mục lục
        </h4>
        <ul className="flex flex-col gap-2.5 text-[14px]">
          {activeList.map((item) => (
            <li
              key={item.id}
              style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
            >
              <a
                href={`#${item.id}`}
                className={`block transition-colors duration-200 line-clamp-2 ${
                  activeId === item.id
                    ? "text-[var(--brand)] font-bold"
                    : "text-[var(--ink-700)] hover:text-[var(--ink)]"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </GlassCard>
    </nav>
  );
}
