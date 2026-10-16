import type { PublishedArticleRecord } from "@mstudio/contracts";

export const CATEGORY_NAMES: Record<string, string> = {
  "thoi-su": "Thời sự",
  "the-gioi": "Thế giới",
  "kinh-doanh": "Kinh doanh",
  "cong-nghe": "Công nghệ",
  "khoa-hoc": "Khoa học",
  "giai-tri": "Giải trí",
  "the-thao": "Thể thao",
  "doi-song": "Đời sống",
  "suc-khoe": "Sức khỏe",
  "ai-channel": "AI Channel",
  xe: "Xe",
};

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  "cong-nghe": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  "ai-channel": "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80",
  "kinh-doanh": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
  "the-gioi": "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80",
  "doi-song": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
  "giai-tri": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
  "khoa-hoc": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  "thoi-su": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
  "the-thao": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
  "suc-khoe": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80",
  xe: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
};

export function getArticleImageUrl(article: PublishedArticleRecord): string {
  if (article.heroImageUrl && article.heroImageUrl.trim() !== "") {
    return article.heroImageUrl;
  }
  const category = article.categorySlug || "cong-nghe";
  return CATEGORY_FALLBACK_IMAGES[category] ?? CATEGORY_FALLBACK_IMAGES["cong-nghe"];
}

export function formatRelativeTime(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return iso.slice(0, 10);
  } catch {
    return iso.slice(0, 10);
  }
}

/** Strip raw HTML tags and entities from external feed titles/summaries */
export function stripHtml(text?: string): string {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Color-coded category badge styling following design tokens */
export function getCategoryBadgeClass(categorySlug?: string): string {
  switch (categorySlug) {
    case "thoi-su":
      return "bg-red-50 text-[var(--breaking-red,#D92D20)] border-red-200/80";
    case "kinh-doanh":
      return "bg-emerald-50 text-[var(--crypto-green,#16A36A)] border-emerald-200/80";
    case "cong-nghe":
      return "bg-blue-50 text-[var(--ai-blue,#2563EB)] border-blue-200/80";
    case "ai-channel":
      return "bg-indigo-50 text-indigo-700 border-indigo-200/80";
    case "khoa-hoc":
      return "bg-teal-50 text-teal-700 border-teal-200/80";
    case "giai-tri":
      return "bg-purple-50 text-[var(--entertainment-purple,#8B5CF6)] border-purple-200/80";
    case "the-thao":
      return "bg-orange-50 text-orange-700 border-orange-200/80";
    case "doi-song":
      return "bg-amber-50 text-amber-700 border-amber-200/80";
    case "suc-khoe":
      return "bg-green-50 text-emerald-700 border-emerald-200/80";
    case "the-gioi":
      return "bg-slate-100 text-slate-700 border-slate-200/80";
    case "xe":
      return "bg-zinc-100 text-zinc-700 border-zinc-200/80";
    default:
      return "bg-blue-50 text-[var(--brand,#155EEF)] border-blue-200/80";
  }
}

/**
 * Lead Story Card (Cột 8 - Main Hero)
 * FU-21 Editorial News Components — MST-012 Editorial Shell
 */
export function LeadStoryCard({ article }: { article: PublishedArticleRecord }) {
  const url = `/bai-viet/${article.slug || article.id}`;
  const categoryLabel = (article.categorySlug && CATEGORY_NAMES[article.categorySlug]) || "Tin tức";
  const imageUrl = getArticleImageUrl(article);

  return (
    <article className="lead-card card-hover press-scale group flex flex-col gap-5 rounded-[var(--radius-lg,16px)] border border-[var(--border,#E3E5E8)] bg-white p-4 sm:p-6 shadow-xs transition-all">
      {/* Thumbnail with overlay gradient and hover zoom */}
      <div className="relative overflow-hidden rounded-[var(--radius-md,10px)] border border-[var(--border,#E3E5E8)] bg-[var(--soft,#F6F7F9)]">
        <a href={url} tabIndex={-1} aria-hidden="true" className="block relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={article.title}
            referrerPolicy="no-referrer"
            loading="eager"
            decoding="async"
            className="w-full aspect-video object-cover block thumb-scale"
          />
          {/* Overlay gradient on image for text and badge readability */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent"
            aria-hidden="true"
          />
        </a>

        {/* Breaking Badge */}
        {article.isBreaking ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-sm,6px)] bg-[var(--breaking-red,#D92D20)] text-white text-[12px] font-bold uppercase tracking-wider shadow-sm z-10">
            <span aria-hidden="true">🚨</span> Tin nóng
          </span>
        ) : null}
      </div>

      {/* Content Section */}
      <div className="flex flex-col gap-3.5">
        {/* Category Pill & Source Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`/${article.categorySlug || "thoi-su"}`}
            className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider bg-[var(--brand,#155EEF)] text-white hover:bg-[var(--brand-hover,#0B4DD8)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ai-blue,#2563EB)]"
          >
            {categoryLabel}
          </a>

          {/* Source badge: ◎ Tổng hợp từ X nguồn tin · thời gian (pill style) */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-[var(--soft,#F6F7F9)] text-[var(--gray,#667085)] border border-[var(--border,#E3E5E8)]">
            <span className="text-[var(--ink,#101114)] font-bold" aria-hidden="true">◎</span>
            <span>
              {article.sourceCount > 0
                ? `Tổng hợp từ ${article.sourceCount} nguồn tin`
                : "Tổng hợp từ đa nguồn tin"}
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.updatedAt}>{formatRelativeTime(article.updatedAt)}</time>
          </span>

          {article.isTrending ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <span aria-hidden="true">🔥</span> Thịnh hành
            </span>
          ) : null}
        </div>

        {/* Headline */}
        <h2 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[32px] font-bold leading-[1.25] text-[var(--ink,#101114)] m-0">
          <a
            href={url}
            className="hover:text-[var(--brand,#155EEF)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ai-blue,#2563EB)]"
          >
            {stripHtml(article.title)}
          </a>
        </h2>

        {/* Summary */}
        {article.summary ? (
          <p className="text-[15px] sm:text-[16px] text-[var(--ink-700,#3A3A3A)] leading-relaxed m-0 line-clamp-3">
            {stripHtml(article.summary)}
          </p>
        ) : null}

        {/* Footer Actions: CTA button & Trust Verification */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border,#E3E5E8)]">
          <a
            href={url}
            style={{ color: "#ffffff", backgroundColor: "#090909" }}
            className="press-scale inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-[var(--radius-sm,6px)] bg-[var(--black,#090909)] hover:bg-[var(--ink-700,#3A3A3A)] !text-white text-[14px] font-semibold transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ai-blue,#2563EB)]"
          >
            <span style={{ color: "#ffffff" }}>Xem chi tiết</span>
            <span aria-hidden="true" style={{ color: "#ffffff" }}>→</span>
          </a>

          <div className="flex items-center gap-3 text-[13px] text-[var(--gray,#667085)]">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
              <span>{article.sourceCount > 0 ? `${article.sourceCount} nguồn xác thực` : "Đã kiểm chứng"}</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Standard / Compact Card (Tin danh sách / Rail phụ)
 * FU-21 Editorial News Components
 */
export function CompactNewsCard({
  article,
  showThumbnail = true,
}: {
  article: PublishedArticleRecord;
  showThumbnail?: boolean;
}) {
  const url = `/bai-viet/${article.slug || article.id}`;
  const categoryLabel = (article.categorySlug && CATEGORY_NAMES[article.categorySlug]) || "Tin tức";

  return (
    <article className="group card-hover flex items-start gap-3 sm:gap-4 py-3.5 border-b border-black/[0.06] last:border-b-0 transition-colors">
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        {/* Meta Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/${article.categorySlug || "thoi-su"}`}
            className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand,#155EEF)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ai-blue,#2563EB)]"
          >
            {categoryLabel}
          </a>
          <span className="text-[var(--gray,#667085)] text-[11px]" aria-hidden="true">•</span>
          <time dateTime={article.updatedAt} className="text-[var(--gray,#667085)] text-[11px]">
            {formatRelativeTime(article.updatedAt)}
          </time>
        </div>

        {/* Title */}
        <h3 className="m-0 text-[15px] sm:text-[16px] font-semibold leading-[1.35] text-[var(--ink,#101114)]">
          <a
            href={url}
            className="hover:text-[var(--brand,#155EEF)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ai-blue,#2563EB)]"
          >
            {stripHtml(article.title)}
          </a>
        </h3>

        {/* Source count in small pill style */}
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--soft,#F6F7F9)] text-[var(--gray,#667085)] border border-[var(--border,#E3E5E8)]">
            <span className="text-[var(--ink,#101114)] font-bold text-[10px]" aria-hidden="true">◎</span>
            <span>{article.sourceCount > 0 ? `${article.sourceCount} nguồn` : "Tổng hợp AI"}</span>
          </span>
          {article.isBreaking ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-[var(--breaking-red,#D92D20)]">
              Tin nóng
            </span>
          ) : null}
        </div>
      </div>

      {/* Thumbnail */}
      {showThumbnail ? (
        <a
          href={url}
          tabIndex={-1}
          aria-hidden="true"
          className="relative w-[110px] sm:w-[120px] h-[76px] sm:h-[80px] shrink-0 overflow-hidden rounded-[var(--radius-md,10px)] border border-[var(--border,#E3E5E8)] bg-[var(--soft,#F6F7F9)] block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getArticleImageUrl(article)}
            alt=""
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover block thumb-scale"
          />
        </a>
      ) : null}
    </article>
  );
}

/**
 * Featured Card in 4-card horizontal strip
 * FU-21 Editorial News Components
 */
export function FeaturedCard({ article }: { article: PublishedArticleRecord }) {
  const url = `/bai-viet/${article.slug || article.id}`;
  const categoryLabel = (article.categorySlug && CATEGORY_NAMES[article.categorySlug]) || "Tin tức";

  return (
    <article className="featured-card card-hover press-scale group flex flex-col h-full bg-white p-3 rounded-[var(--radius-md,10px)] border border-[var(--border,#E3E5E8)] transition-all">
      {/* Thumbnail with consistent aspect ratio */}
      <a
        href={url}
        tabIndex={-1}
        aria-hidden="true"
        className="relative w-full aspect-[16/10] overflow-hidden rounded-[var(--radius-sm,6px)] bg-[var(--soft,#F6F7F9)] border border-[var(--border,#E3E5E8)] block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getArticleImageUrl(article)}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover block thumb-scale"
        />
        {article.isBreaking ? (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--breaking-red,#D92D20)] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm z-10">
            <span aria-hidden="true">🚨</span> Hot
          </span>
        ) : null}
      </a>

      {/* Card Content & Meta */}
      <div className="flex flex-col flex-1 justify-between gap-3 mt-3">
        <div className="flex flex-col gap-2">
          {/* Color-coded category pill and source count */}
          <div className="flex items-center justify-between gap-2">
            <a
              href={`/${article.categorySlug || "thoi-su"}`}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-colors ${getCategoryBadgeClass(article.categorySlug)}`}
            >
              {categoryLabel}
            </a>
            {article.sourceCount > 0 ? (
              <span className="text-[11px] text-[var(--gray,#667085)] font-medium">
                {article.sourceCount} nguồn
              </span>
            ) : null}
          </div>

          {/* Title */}
          <h3 className="m-0 text-[15px] font-semibold leading-[1.35] text-[var(--ink,#101114)] line-clamp-2">
            <a
              href={url}
              className="hover:text-[var(--brand,#155EEF)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ai-blue,#2563EB)]"
            >
              {article.title}
            </a>
          </h3>
        </div>

        {/* Footer info: relative time & trending */}
        <div className="flex items-center justify-between text-[11px] text-[var(--gray,#667085)] pt-2 border-t border-[var(--border,#E3E5E8)]/60">
          <time dateTime={article.updatedAt}>{formatRelativeTime(article.updatedAt)}</time>
          {article.isTrending ? (
            <span className="text-amber-600 font-medium flex items-center gap-1">
              <span aria-hidden="true">🔥</span> Thịnh hành
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
