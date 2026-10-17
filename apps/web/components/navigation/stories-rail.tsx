"use client";

import React from "react";
import type { PublishedArticleRecord } from "../../lib/contracts";
import { cleanText } from "@mstudio/ui";

export interface StoriesRailProps {
  articles: PublishedArticleRecord[];
  className?: string;
}

export function StoriesRail({ articles, className = "" }: StoriesRailProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <section
      aria-label="Tin nhanh 24h"
      className={`w-full overflow-x-auto no-scrollbar py-3 px-4 ${className}`}
    >
      <div className="flex items-center gap-4 min-w-max">
        {articles.slice(0, 10).map((art, idx) => {
          const isHot = art.isBreaking || idx === 0;
          return (
            <a
              key={art.id}
              href={`/bai-viet/${art.slug || art.id}`}
              className="group flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <div
                className={`relative flex h-16 w-16 items-center justify-center rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105 group-active:scale-95 ${
                  isHot
                    ? "bg-gradient-to-tr from-rose-500 via-amber-400 to-cyan-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                    : "bg-gradient-to-tr from-blue-500 to-cyan-400"
                }`}
              >
                <div className="h-full w-full overflow-hidden rounded-full border-2 border-slate-950 bg-slate-800">
                  {art.heroImageUrl ? (
                    <img
                      src={art.heroImageUrl}
                      alt={art.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-xs font-bold text-cyan-400">
                      M
                    </div>
                  )}
                </div>
                {isHot && (
                  <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white ring-2 ring-slate-950">
                    !
                  </span>
                )}
              </div>
              <span className="w-16 truncate text-center font-medium text-[11px] text-slate-300 group-hover:text-white transition-colors">
                {cleanText(art.title)}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
