import type { PublishedArticleRecord } from "@mstudio/contracts";
import { ArticleHero } from "./article-hero";

const CATEGORY_NAMES: Record<string, string> = {
  "thoi-su": "Thời sự",
  "the-gioi": "Thế giới",
  "kinh-doanh": "Kinh doanh",
  "cong-nghe": "Công nghệ",
  "khoa-hoc": "Khoa học",
  "giai-tri": "Giải trí",
  "the-thao": "Thể thao",
  "doi-song": "Đời sống",
  "suc-khoe": "Sức khỏe",
  xe: "Xe",
};

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

/** Lead Story Card (Cột 8 - Main Hero) */
export function LeadStoryCard({ article }: { article: PublishedArticleRecord }) {
  const url = `/bai-viet/${article.slug || article.id}`;
  const categoryLabel = (article.categorySlug && CATEGORY_NAMES[article.categorySlug]) || "Tin tức";

  return (
    <article className="lead-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ position: "relative", borderRadius: "var(--radius-md, 8px)", overflow: "hidden", border: "1px solid var(--border)" }}>
        {article.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.heroImageUrl}
            alt={article.title}
            style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block" }}
          />
        ) : (
          <ArticleHero seed={article.id} />
        )}
        {article.isBreaking ? (
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "var(--breaking-red, #dc2626)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            🚨 Tin nóng
          </span>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a
            href={`/${article.categorySlug || "thoi-su"}`}
            style={{
              color: "var(--accent, #2563eb)",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              textDecoration: "none",
            }}
          >
            {categoryLabel}
          </a>
          <span style={{ color: "var(--gray)", fontSize: "12px" }}>•</span>
          <time dateTime={article.updatedAt} style={{ color: "var(--gray)", fontSize: "12px" }}>
            {formatRelativeTime(article.updatedAt)}
          </time>
        </div>

        <h2 style={{ fontSize: "var(--text-3xl, 28px)", lineHeight: 1.25, margin: 0, fontWeight: 700 }}>
          <a href={url} style={{ textDecoration: "none", color: "inherit" }}>
            {article.title}
          </a>
        </h2>

        {article.summary ? (
          <p
            style={{
              fontSize: "var(--text-base, 16px)",
              color: "var(--ink-700, #374151)",
              lineHeight: 1.6,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {article.summary}
          </p>
        ) : null}

        <div style={{ display: "flex", gap: 12, fontSize: "13px", color: "var(--gray)", marginTop: 4 }}>
          <span>✓ {article.sourceCount > 0 ? `${article.sourceCount} nguồn xác thực` : "Đã kiểm chứng"}</span>
          {article.isTrending ? <span style={{ color: "var(--amber-600, #d97706)" }}>🔥 Đang thịnh hành</span> : null}
        </div>
      </div>
    </article>
  );
}

/** Standard / Compact Card (Tin danh sách / Rail phụ) */
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
    <article
      style={{
        display: "flex",
        gap: 16,
        padding: "12px 0",
        borderBottom: "1px solid var(--border)",
        alignItems: "flex-start",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              color: "var(--accent, #2563eb)",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {categoryLabel}
          </span>
          <span style={{ color: "var(--gray)", fontSize: "11px" }}>•</span>
          <time dateTime={article.updatedAt} style={{ color: "var(--gray)", fontSize: "11px" }}>
            {formatRelativeTime(article.updatedAt)}
          </time>
        </div>

        <h3 style={{ fontSize: "16px", lineHeight: 1.35, margin: 0, fontWeight: 600 }}>
          <a href={url} style={{ textDecoration: "none", color: "inherit" }}>
            {article.title}
          </a>
        </h3>

        <span style={{ fontSize: "12px", color: "var(--gray)", marginTop: 2 }}>
          {article.sourceCount > 0 ? `${article.sourceCount} nguồn` : "Tổng hợp AI"}
        </span>
      </div>

      {showThumbnail ? (
        <div
          style={{
            width: 120,
            height: 80,
            flexShrink: 0,
            borderRadius: 6,
            overflow: "hidden",
            background: "var(--soft, #f3f4f6)",
            border: "1px solid var(--border)",
          }}
        >
          {article.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.heroImageUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)",
              }}
            />
          )}
        </div>
      ) : null}
    </article>
  );
}

/** Featured Card in 4-card horizontal strip */
export function FeaturedCard({ article }: { article: PublishedArticleRecord }) {
  const url = `/bai-viet/${article.slug || article.id}`;
  const categoryLabel = (article.categorySlug && CATEGORY_NAMES[article.categorySlug]) || "Tin tức";

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        background: "var(--white)",
        padding: 12,
        borderRadius: 8,
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ height: 140, borderRadius: 6, overflow: "hidden", background: "var(--soft)" }}>
        {article.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.heroImageUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)" }} />
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            color: "var(--accent, #2563eb)",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {categoryLabel}
        </span>
        <h3
          style={{
            fontSize: "15px",
            lineHeight: 1.35,
            margin: 0,
            fontWeight: 600,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          <a href={url} style={{ textDecoration: "none", color: "inherit" }}>
            {article.title}
          </a>
        </h3>
        <time dateTime={article.updatedAt} style={{ color: "var(--gray)", fontSize: "11px" }}>
          {formatRelativeTime(article.updatedAt)}
        </time>
      </div>
    </article>
  );
}
