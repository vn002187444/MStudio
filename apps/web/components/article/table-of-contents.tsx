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
      { rootMargin: "-100px 0px -70% 0px" }
    );

    activeList.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [activeList]);

  if (activeList.length === 0) return null;

  return (
    <nav aria-label="Mục lục bài viết" className="w-full">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Mục lục nội dung
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{activeList.length} mục</span>
        </div>

        <ul className="flex flex-col gap-1.5 text-xs">
          {activeList.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li
                key={item.id}
                style={{ paddingLeft: `${(item.level - 2) * 10}px` }}
              >
                <a
                  href={`#${item.id}`}
                  className={`block rounded-lg px-2.5 py-1.5 transition-all line-clamp-2 ${
                    isActive
                      ? "bg-cyan-500/15 border border-cyan-500/30 font-semibold text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
