"use client";

import React, { useEffect, useState } from "react";
import { type TocHeading, type TocItem, slugifyHeading, extractHeadings } from "./toc-utils";

export type { TocHeading, TocItem };
export { slugifyHeading, extractHeadings };

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
      <div className="rounded-3xl border border-white/10 bg-slate-900/90 [html.light_&]:bg-white/95 [html.light_&]:border-slate-200/80 [html.light_&]:shadow-lg p-5 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 [html.light_&]:border-slate-200">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 [html.light_&]:bg-cyan-600" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 [html.light_&]:text-cyan-700">
              Mục lục nội dung
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-300 [html.light_&]:text-slate-500 font-medium">{activeList.length} mục</span>
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
                  className={`block rounded-xl px-3 py-2 transition-all line-clamp-2 ${
                    isActive
                      ? "bg-cyan-950/80 border border-cyan-500/50 font-bold text-cyan-200 shadow-md shadow-cyan-950/50 [html.light_&]:bg-cyan-50 [html.light_&]:border-cyan-300 [html.light_&]:text-cyan-800 [html.light_&]:shadow-sm"
                      : "text-slate-200 hover:bg-slate-800 hover:text-white [html.light_&]:text-slate-700 [html.light_&]:hover:bg-slate-100 [html.light_&]:hover:text-slate-900 font-medium"
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
