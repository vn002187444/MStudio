"use client";

import React, { memo } from "react";
import type { PublishedArticleRecord } from "../../lib/contracts";
import { TiltCard, GlassBadge, AmbientGlow } from "@mstudio/ui";
import {
  CATEGORY_NAMES,
  CATEGORY_FALLBACK_IMAGES,
  formatRelativeTime,
  getFallbackImageUrl,
  getArticleImageUrl,
  stripHtml,
} from "../../lib/format";

export {
  CATEGORY_NAMES,
  CATEGORY_FALLBACK_IMAGES,
  formatRelativeTime,
  getFallbackImageUrl,
  getArticleImageUrl,
  stripHtml,
};

export const LeadStoryCard = memo(function LeadStoryCard({
  article,
  layout = "auto",
  className = "",
}: {
  article: PublishedArticleRecord;
  layout?: "horizontal" | "vertical" | "auto";
  className?: string;
}) {
  const url = `/bai-viet/${article.slug || article.id}`;
  const categoryLabel = (article.categorySlug && CATEGORY_NAMES[article.categorySlug]) || "Tiêu điểm";
  const isVertical = layout === "vertical";

  return (
    <TiltCard
      maxAngle={3}
      scale={1.01}
      className={`w-full h-full bg-slate-900/95 rounded-[var(--bento-radius-outer)] overflow-hidden shadow-2xl flex ${
        isVertical ? "flex-col" : "flex-col md:flex-row"
      } group border border-white/15 ${className}`}
    >
      {/* Visual Side */}
      <div
        className={`relative w-full ${
          isVertical
            ? "h-[240px] sm:h-[300px] lg:h-[320px] aspect-[16/9]"
            : "md:w-[58%] shrink-0 h-[280px] md:h-[480px]"
        } bg-black overflow-hidden`}
      >
        <AmbientGlow
          color="rgba(37,99,235,0.4)"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getArticleImageUrl(article)}
          alt=""
          className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
          fetchPriority="high"
          decoding="async"
          onError={(e) => {
            const fallback = getFallbackImageUrl(article.categorySlug);
            if (e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            }
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          {article.isBreaking && (
            <GlassBadge className="bg-rose-600/90 border-rose-500 text-white font-bold uppercase tracking-wider shadow-lg">
              Tin Nóng
            </GlassBadge>
          )}
          <GlassBadge className="bg-blue-600/90 border-blue-400 text-white font-bold uppercase tracking-wider shadow-lg">
            {categoryLabel}
          </GlassBadge>
        </div>
      </div>

      {/* Content Side */}
      <div
        className={`flex flex-col flex-1 ${
          isVertical ? "p-5 md:p-6" : "p-6 md:p-8 lg:p-10"
        } justify-between bg-gradient-to-br from-slate-900 to-slate-950 text-white relative z-10`}
      >
        <div>
          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-slate-300 mb-3 font-medium">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200">
              <span className="text-cyan-400 font-bold">◎</span>
              {article.sourceCount > 0 ? `${article.sourceCount} nguồn xác thực` : "Kiểm chứng AI"}
            </span>
            <time dateTime={article.updatedAt} className="text-slate-300 font-mono">
              {formatRelativeTime(article.updatedAt)}
            </time>
          </div>

          <h2
            className={`${
              isVertical ? "text-xl sm:text-2xl lg:text-3xl" : "text-2xl md:text-3xl lg:text-4xl"
            } font-black leading-tight mb-3 text-white`}
          >
            <a
              href={url}
              className="text-white hover:text-cyan-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-500 outline-none"
            >
              {stripHtml(article.title)}
            </a>
          </h2>

          {article.summary && (
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-3 font-normal">
              {stripHtml(article.summary)}
            </p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <a
            href={url}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-cyan-500/25 border border-cyan-400/40 focus-visible:ring-2 focus-visible:ring-cyan-400 text-sm"
          >
            <span>Đọc bài sâu</span>
            <span aria-hidden="true">→</span>
          </a>

          {article.isTrending && (
            <span className="flex items-center gap-1.5 text-amber-300 text-xs sm:text-sm font-bold bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full">
              <span>🔥</span> Đang thịnh hành
            </span>
          )}
        </div>
      </div>
    </TiltCard>
  );
});

export const CompactNewsCard = memo(function CompactNewsCard({
  article,
  showThumbnail = true,
}: {
  article: PublishedArticleRecord;
  showThumbnail?: boolean;
}) {
  const url = `/bai-viet/${article.slug || article.id}`;
  const categoryLabel = (article.categorySlug && CATEGORY_NAMES[article.categorySlug]) || "Tin tức";

  return (
    <article className="group flex items-start gap-4 py-4 border-b border-white/10 last:border-b-0 transition-colors hover:bg-white/[0.04] rounded-xl -mx-2 px-2.5">
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2 flex-wrap text-[11px] uppercase tracking-wider font-semibold">
          <a href={`/${article.categorySlug || "thoi-su"}`} className="text-cyan-400 font-bold hover:underline">
            {categoryLabel}
          </a>
          <span className="text-slate-500">•</span>
          <time dateTime={article.updatedAt} className="text-slate-400 font-mono text-[11px]">
            {formatRelativeTime(article.updatedAt)}
          </time>
        </div>

        <h3 className="m-0 text-base font-bold leading-snug text-white group-hover:text-cyan-300 transition-colors">
          <a href={url} className="text-white group-hover:text-cyan-300 transition-colors outline-none focus-visible:underline">
            {stripHtml(article.title)}
          </a>
        </h3>

        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-800/90 text-slate-200 border border-slate-700">
            <span className="font-bold text-cyan-400">◎</span>
            {article.sourceCount > 0 ? `${article.sourceCount} nguồn` : "AI"}
          </span>
          {article.isBreaking && (
            <span className="text-[10px] font-bold uppercase text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-md">
              Tin nóng
            </span>
          )}
        </div>
      </div>

      {showThumbnail && (
        <a href={url} tabIndex={-1} aria-hidden="true" className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 overflow-hidden rounded-xl bg-slate-800 border border-white/10 block group-hover:shadow-lg transition-shadow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getArticleImageUrl(article)}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              const fallback = getFallbackImageUrl(article.categorySlug);
              if (e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              }
            }}
          />
        </a>
      )}
    </article>
  );
});

export const FeaturedCard = memo(function FeaturedCard({ article }: { article: PublishedArticleRecord }) {
  const url = `/bai-viet/${article.slug || article.id}`;
  const categoryLabel = (article.categorySlug && CATEGORY_NAMES[article.categorySlug]) || "Tin tức";

  return (
    <TiltCard maxAngle={4} scale={1.03} className="flex flex-col h-full bg-slate-900/90 rounded-[var(--bento-radius-outer)] border border-white/10 shadow-xl overflow-hidden group">
      <a href={url} tabIndex={-1} aria-hidden="true" className="relative w-full aspect-[16/10] overflow-hidden bg-slate-800 block border-b border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getArticleImageUrl(article)}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          onError={(e) => {
            const fallback = getFallbackImageUrl(article.categorySlug);
            if (e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            }
          }}
        />
        {article.isBreaking && (
          <div className="absolute top-3 left-3">
            <GlassBadge className="bg-rose-600 border-rose-400 text-white font-bold shadow-lg">🚨 Hot</GlassBadge>
          </div>
        )}
      </a>

      <div className="flex flex-col flex-1 p-5 justify-between gap-4 bg-slate-900/90">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/70 px-2.5 py-0.5 rounded-md border border-cyan-500/40">
              {categoryLabel}
            </span>
            {article.sourceCount > 0 && (
              <span className="text-[11px] font-medium text-slate-300 font-mono">{article.sourceCount} nguồn</span>
            )}
          </div>
          <h3 className="m-0 text-base font-bold leading-snug text-white line-clamp-3 group-hover:text-cyan-300 transition-colors">
            <a href={url} className="text-white group-hover:text-cyan-300 outline-none">
              {stripHtml(article.title)}
            </a>
          </h3>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/10 font-medium">
          <time dateTime={article.updatedAt} className="font-mono">{formatRelativeTime(article.updatedAt)}</time>
          {article.isTrending && <span className="text-amber-300 font-bold">🔥 Thịnh hành</span>}
        </div>
      </div>
    </TiltCard>
  );
});

export function getCategoryBadgeClass(slug?: string) {
  return "bg-cyan-950/70 text-cyan-300 border-cyan-500/40";
}
