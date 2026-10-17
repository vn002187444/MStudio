import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { PublishedArticleRecord } from "../../lib/contracts";
import { TiltCard, GlassBadge, AmbientGlow, cleanText } from "@mstudio/ui";

export const CATEGORY_NAMES: Record<string, string> = {
  "thoi-su": "Thời sự",
  "the-gioi": "Thế giới",
  "kinh-doanh": "Kinh doanh",
  "kinh-te": "Kinh tế",
  "cong-nghe": "Công nghệ",
  "khoa-hoc": "Khoa học",
  "giai-tri": "Giải trí",
  "the-thao": "Thể thao",
  "phap-luat": "Pháp luật",
  "giao-duc": "Giáo dục",
  "suc-khoe": "Sức khỏe",
  "doi-song": "Đời sống",
  "du-lich": "Du lịch",
  xe: "Xe",
  "bat-dong-san": "Bất động sản",
};

export function formatRelativeTime(dateString: string) {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  } catch {
    return dateString;
  }
}

function stripHtml(html: string) {
  return cleanText(html);
}

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  "thoi-su": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
  "the-gioi": "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80",
  "kinh-doanh": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
  "kinh-te": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
  "cong-nghe": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  "ai-channel": "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
  "khoa-hoc": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  "kham-pha": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  "giai-tri": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
  "the-thao": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
  "giao-duc": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  "suc-khoe": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80",
  "doi-song": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
  xe: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
};

export function getArticleImageUrl(article: PublishedArticleRecord): string {
  if (article.heroImageUrl && article.heroImageUrl.trim() !== "") {
    return article.heroImageUrl;
  }
  const category = article.categorySlug || "cong-nghe";
  return CATEGORY_FALLBACK_IMAGES[category] ?? CATEGORY_FALLBACK_IMAGES["cong-nghe"];
}

export function LeadStoryCard({ article }: { article: PublishedArticleRecord }) {
  const url = `/bai-viet/${article.slug || article.id}`;
  const categoryLabel = (article.categorySlug && CATEGORY_NAMES[article.categorySlug]) || "Tiêu điểm";

  return (
    <TiltCard maxAngle={3} scale={1.01} className="w-full h-full bg-[var(--void-surface)] rounded-[var(--bento-radius-outer)] overflow-hidden shadow-2xl flex flex-col md:flex-row group border border-white/10">
      {/* Visual Side */}
      <div className="relative w-full md:w-[60%] shrink-0 h-[280px] md:h-[480px] bg-black overflow-hidden">
        <AmbientGlow color="rgba(37,99,235,0.4)" className="opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getArticleImageUrl(article)}
          alt=""
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
          fetchPriority="high"
        />
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          {article.isBreaking && (
            <GlassBadge className="bg-red-600/80 border-red-500/50 text-white font-bold uppercase tracking-wider">
              Tin Nóng
            </GlassBadge>
          )}
          <GlassBadge className="bg-blue-600/80 border-blue-500/50 text-white font-bold uppercase tracking-wider">
            {categoryLabel}
          </GlassBadge>
        </div>
      </div>

      {/* Content Side */}
      <div className="flex flex-col flex-1 p-6 md:p-8 lg:p-10 justify-between bg-gradient-to-br from-white/5 to-transparent backdrop-blur-md text-white relative z-10">
        <div>
          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-white/60 mb-4 font-medium">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/10 border border-white/10">
              <span className="text-white">◎</span>
              {article.sourceCount > 0 ? `${article.sourceCount} nguồn xác thực` : "Kiểm chứng AI"}
            </span>
            <time dateTime={article.updatedAt}>{formatRelativeTime(article.updatedAt)}</time>
          </div>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4 drop-shadow-lg">
            <a href={url} className="hover:text-blue-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 outline-none">
              {stripHtml(article.title)}
            </a>
          </h2>

          {article.summary && (
            <p className="text-white/70 text-base md:text-lg leading-relaxed line-clamp-3">
              {stripHtml(article.summary)}
            </p>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
          <a
            href={url}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Đọc bài sâu <span>→</span>
          </a>
          
          {article.isTrending && (
            <span className="flex items-center gap-1.5 text-amber-400 text-sm font-semibold">
              <span>🔥</span> Đang thịnh hành
            </span>
          )}
        </div>
      </div>
    </TiltCard>
  );
}

export function CompactNewsCard({ article, showThumbnail = true }: { article: PublishedArticleRecord; showThumbnail?: boolean }) {
  const url = `/bai-viet/${article.slug || article.id}`;
  const categoryLabel = (article.categorySlug && CATEGORY_NAMES[article.categorySlug]) || "Tin tức";

  return (
    <article className="group flex items-start gap-4 py-4 border-b border-black/[0.05] last:border-b-0 transition-colors hover:bg-black/[0.02] rounded-lg -mx-2 px-2">
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2 flex-wrap text-[11px] uppercase tracking-wider font-semibold">
          <a href={`/${article.categorySlug || "thoi-su"}`} className="text-blue-600 hover:underline">
            {categoryLabel}
          </a>
          <span className="text-gray-400">•</span>
          <time dateTime={article.updatedAt} className="text-gray-500">
            {formatRelativeTime(article.updatedAt)}
          </time>
        </div>

        <h3 className="m-0 text-base font-semibold leading-snug text-[var(--ink)]">
          <a href={url} className="hover:text-blue-600 transition-colors outline-none focus-visible:underline">
            {stripHtml(article.title)}
          </a>
        </h3>

        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
            <span className="font-bold">◎</span>
            {article.sourceCount > 0 ? `${article.sourceCount} nguồn` : "AI"}
          </span>
          {article.isBreaking && (
            <span className="text-[10px] font-bold uppercase text-red-600">Tin nóng</span>
          )}
        </div>
      </div>

      {showThumbnail && (
        <a href={url} tabIndex={-1} aria-hidden="true" className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-gray-100 border border-black/[0.05] block group-hover:shadow-md transition-shadow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getArticleImageUrl(article)}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </a>
      )}
    </article>
  );
}

export function FeaturedCard({ article }: { article: PublishedArticleRecord }) {
  const url = `/bai-viet/${article.slug || article.id}`;
  const categoryLabel = (article.categorySlug && CATEGORY_NAMES[article.categorySlug]) || "Tin tức";

  return (
    <TiltCard maxAngle={4} scale={1.03} className="flex flex-col h-full bg-white rounded-[var(--bento-radius-outer)] border border-black/[0.08] shadow-sm overflow-hidden group">
      <a href={url} tabIndex={-1} aria-hidden="true" className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100 block border-b border-black/[0.05]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getArticleImageUrl(article)}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {article.isBreaking && (
          <div className="absolute top-3 left-3">
            <GlassBadge className="bg-red-600/90 border-red-500 text-white font-bold">🚨 Hot</GlassBadge>
          </div>
        )}
      </a>

      <div className="flex flex-col flex-1 p-5 justify-between gap-4">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {categoryLabel}
            </span>
            {article.sourceCount > 0 && (
              <span className="text-[11px] font-medium text-gray-500">{article.sourceCount} nguồn</span>
            )}
          </div>
          <h3 className="m-0 text-base font-bold leading-snug text-[var(--ink)] line-clamp-3 group-hover:text-blue-600 transition-colors">
            <a href={url} className="outline-none">
              {stripHtml(article.title)}
            </a>
          </h3>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-3 border-t border-gray-100 font-medium">
          <time dateTime={article.updatedAt}>{formatRelativeTime(article.updatedAt)}</time>
          {article.isTrending && <span className="text-amber-600">🔥 Thịnh hành</span>}
        </div>
      </div>
    </TiltCard>
  );
}
export function getCategoryBadgeClass(slug?: string) {
  return "bg-blue-50 text-blue-600 border-blue-100";
}
