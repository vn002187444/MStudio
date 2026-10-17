import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiBaseUrl, fetchApi } from "../../../../lib/api";
import { newsArticleJsonLd, siteOrigin } from "../../../../lib/seo";
import { ArticleHero } from "../../../../components/article/article-hero";
import {
  extractHeadings,
  slugifyHeading,
  TableOfContents,
} from "../../../../components/article/table-of-contents";
import { SourceBlock } from "../../../../components/article/source-block";
import { BlocksRenderer, headingsFromBlocks } from "../../../../components/article/blocks-renderer";

import { parseArticleBlocksBody } from "../../../../lib/contracts";

/**
 * Bài viết là runtime-only: không prerender/ISR cache tại edge vì
 * 404 lúc build từng bị bake thành HTML 200 (vinext cache quirk).
 * CDN vẫn cache theo Cache-Control của worker nếu cần.
 */
export const dynamic = "force-dynamic";

interface PublishedArticle {
  id: string;
  storyId: string;
  status: string;
  title: string;
  body: string;
  summary?: string;
  slug?: string;
  categorySlug?: string;
  heroImageUrl?: string;
  videoUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  keywords?: string;
  isBreaking?: boolean;
  isTrending?: boolean;
  updatedAt: string;
  createdAt: string;
  sources?: Array<{
    name: string;
    originUrl: string;
    rightsStatus: string;
    role: string;
  }>;
}

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

/** Render markdown link `[text](url)` thành `<a>` an toàn (chỉ http/https/root-relative). */
function safeUrl(raw: string): string | undefined {
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function renderMarkdownLinks(text: string): string {
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  return text.replace(markdownLinkRegex, (match, linkText, linkUrl) => {
    const url = safeUrl(linkUrl);
    if (!url) return match;
    const isExternal = url.startsWith("http://") || url.startsWith("https://");
    return `<a href="${url}" rel="noopener noreferrer nofollow" target="${isExternal ? "_blank" : "_self"}">${linkText}</a>`;
  });
}

async function fetchArticle(
  slug: string,
): Promise<PublishedArticle | undefined> {
  try {
    const response = await fetchApi(
      `/articles/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`article API ${response.status}`);
    const payload = (await response.json()) as {
      article: PublishedArticle;
    };
    return payload.article;
  } catch {
    return undefined;
  }
}

async function fetchRelatedArticles(articleId: string, currentCategory?: string) {
  try {
    const response = await fetchApi(
      `/recommendations?articleId=${encodeURIComponent(articleId)}&limit=4`,
      { cache: "no-store" },
    );
    let candidates: Array<{ articleId: string; reason: string }> = [];
    if (response.ok) {
      const payload = (await response.json()) as {
        candidates: Array<{ articleId: string; reason: string }>;
      };
      if (Array.isArray(payload.candidates)) {
        candidates = payload.candidates;
      }
    }

    const fetched = await Promise.all(
      candidates.map(async (c) => {
        const art = await fetchArticle(c.articleId);
        return art ? { ...art, reason: c.reason } : null;
      }),
    );
    const valid = fetched.filter((item): item is PublishedArticle & { reason: string } => Boolean(item));
    if (valid.length > 0) return valid;

    // Fallback: nếu chưa có recommendations, lấy 3 bài mới nhất khác bài hiện tại
    const fallbackRes = await fetchApi(`/articles?limit=4`, { cache: "no-store" });
    if (fallbackRes.ok) {
      const data = (await fallbackRes.json()) as { rows?: PublishedArticle[] };
      if (Array.isArray(data.rows)) {
        return data.rows
          .filter((a) => a.id !== articleId)
          .slice(0, 3)
          .map((a) => ({ ...a, reason: "Tin nổi bật khác" }));
      }
    }
    return [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const article = await fetchArticle(slug);
  if (!article) {
    return { title: "Không tìm thấy | MStudio Channel", robots: { index: false, follow: false } };
  }

  const title = article.metaTitle || `${article.title} | MStudio Channel`;
  const description = article.metaDescription || article.summary || article.title;
  const canonical = article.canonicalUrl || `${siteOrigin()}/bai-viet/${article.slug || slug}`;
  const imageUrl = article.ogImageUrl || article.heroImageUrl;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

/** Làm sạch và unescape các ký tự thô từ AI / database, đảm bảo markdown heading & list phân tách chuẩn */
function normalizeArticleText(raw: string): string {
  if (!raw) return "";
  let text = raw
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .trim();

  // Đảm bảo heading ## hoặc ### luôn đứng trên dòng độc lập và cách đoạn trên/dưới
  text = text.replace(/(?<!\n)\n(#{2,4}\s+[^\n]+)/g, "\n\n$1");
  text = text.replace(/(#{2,4}\s+[^\n]+)\n(?!\n)/g, "$1\n\n");

  // Đảm bảo khối danh sách bullet (- item) tách khỏi heading hoặc đoạn văn
  text = text.replace(/(?<!\n)\n([-*]\s+[^\n]+)/g, "\n\n$1");

  return text;
}

/** Chuyển đổi inline markdown: links [text](url), bold **text**, italic *text* */
function formatInlineMarkdown(text: string): string {
  let out = renderMarkdownLinks(text);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  return out;
}

function BodyWithToc({ body }: { body: string }) {
  const cleanBody = normalizeArticleText(body);
  const headings = extractHeadings(cleanBody);
  const rawSections = cleanBody.split(/\n{2,}/);
  let headingCursor = 0;

  const contentElements = rawSections.map((section, secIdx) => {
    const trimmed = section.trim();
    if (!trimmed) return null;

    // Check if section is a Heading (## or ###)
    const headingMatch = /^(#{2,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      const heading = headings[headingCursor];
      headingCursor += 1;
      const headingId = heading?.id || slugifyHeading(headingMatch[2]) || `h-${secIdx}`;
      const level = headingMatch[1].length;

      return level === 3 ? (
        <h3
          id={headingId}
          key={`h3-${secIdx}`}
          style={{
            fontSize: "var(--text-xl, 20px)",
            fontWeight: 700,
            marginTop: 32,
            marginBottom: 12,
            color: "var(--ink, #0f172a)",
          }}
        >
          {headingMatch[2].trim()}
        </h3>
      ) : (
        <h2
          id={headingId}
          key={`h2-${secIdx}`}
          style={{
            fontSize: "var(--text-2xl, 24px)",
            fontWeight: 800,
            marginTop: 40,
            marginBottom: 16,
            color: "var(--ink, #0f172a)",
            borderBottom: "1px solid var(--border, #e2e8f0)",
            paddingBottom: 8,
          }}
        >
          {headingMatch[2].trim()}
        </h2>
      );
    }

    // Check if section contains list items (lines starting with - or *)
    const lines = trimmed.split("\n");
    const isBulletList = lines.every((line) => /^[-*]\s+/.test(line.trim()));
    if (isBulletList && lines.length > 0) {
      return (
        <ul
          key={`ul-${secIdx}`}
          style={{
            margin: "16px 0",
            paddingLeft: 24,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            lineHeight: 1.75,
            color: "var(--ink-secondary, #334155)",
          }}
        >
          {lines.map((l, lIdx) => {
            const itemText = l.trim().replace(/^[-*]\s+/, "");
            return (
              <li
                key={`li-${secIdx}-${lIdx}`}
                dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }}
              />
            );
          })}
        </ul>
      );
    }

    // Check if section is a blockquote (> ...)
    if (trimmed.startsWith(">")) {
      const quoteText = trimmed.replace(/^>\s*/gm, "");
      return (
        <blockquote
          key={`quote-${secIdx}`}
          style={{
            margin: "24px 0",
            padding: "16px 20px",
            background: "var(--bg-subtle, #f8fafc)",
            borderLeft: "4px solid var(--accent, #2563eb)",
            borderRadius: "0 8px 8px 0",
            fontStyle: "italic",
            lineHeight: 1.7,
            color: "var(--ink-secondary, #334155)",
          }}
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(quoteText) }}
        />
      );
    }

    // Standard paragraph with clean line-break handling
    return (
      <p
        key={`p-${secIdx}`}
        style={{
          margin: "18px 0",
          lineHeight: 1.85,
          fontSize: "17px",
          color: "var(--ink-body, #1e293b)",
          letterSpacing: "-0.01em",
        }}
        dangerouslySetInnerHTML={{
          __html: formatInlineMarkdown(trimmed.replace(/\n/g, "<br />")),
        }}
      />
    );
  });

  return (
    <>
      <TableOfContents headings={headings} />
      <section aria-labelledby="article-body-heading" className="article-body-content">
        <h2 id="article-body-heading" className="sr-only" style={{ display: "none" }}>
          Nội dung bài viết
        </h2>
        {contentElements}
      </section>
    </>
  );
}

function ArticleBody({ body }: { body: string }) {
  const cleanBody = normalizeArticleText(body);
  const blocks = parseArticleBlocksBody(cleanBody);
  if (!blocks) return <BodyWithToc body={cleanBody} />;
  const headings = headingsFromBlocks(blocks);
  return (
    <>
      <TableOfContents headings={headings} />
      <section aria-labelledby="article-body-heading" className="article-body-content">
        <h2 id="article-body-heading" className="sr-only" style={{ display: "none" }}>
          Nội dung bài viết
        </h2>
        <BlocksRenderer blocks={blocks} />
      </section>
    </>
  );
}

function VideoEmbed({ url }: { url: string }) {
  let embedUrl = url;
  const youtubeMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (youtubeMatch && youtubeMatch[1]) {
    embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}`;
  }

  return (
    <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 8, margin: "20px 0" }}>
      <iframe
        src={embedUrl}
        title="Video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
      />
    </div>
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);
  const article = await fetchArticle(slug);
  if (!article) {
    notFound();
  }

  const related = await fetchRelatedArticles(article.id, article.categorySlug);
  const categoryName = (article.categorySlug && CATEGORY_NAMES[article.categorySlug]) || "Tin tức";

  return (
    <main className="article-main" id="main-content" style={{ maxWidth: 840, margin: "0 auto", padding: "24px 16px 64px" }}>
      {/* Category & Badge Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 12px" }}>
        {article.categorySlug ? (
          <a
            href={`/${article.categorySlug}`}
            style={{
              fontSize: "var(--text-xs, 12px)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--accent, #2563eb)",
              textDecoration: "none",
            }}
          >
            {categoryName}
          </a>
        ) : (
          <span style={{ fontSize: "var(--text-xs, 12px)", fontWeight: 700, color: "var(--gray)" }}>
            Tin tức
          </span>
        )}

        {article.isBreaking ? (
          <span
            style={{
              background: "var(--breaking-red, #dc2626)",
              color: "#fff",
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Tin nóng
          </span>
        ) : null}

        {article.isTrending ? (
          <span
            style={{
              background: "var(--amber-600, #d97706)",
              color: "#fff",
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Thịnh hành
          </span>
        ) : null}
      </div>

      <h1 style={{ fontSize: "var(--text-4xl, 36px)", lineHeight: 1.25, fontWeight: 800, margin: "0 0 16px" }}>
        {article.title}
      </h1>

      <p style={{ color: "var(--gray)", fontSize: "var(--text-sm, 14px)", margin: "0 0 24px" }}>
        Xuất bản: {article.updatedAt.slice(0, 10)}
        {article.sources && article.sources.length > 0
          ? ` · ${article.sources.length} nguồn đối chiếu`
          : ""}
      </p>

      {/* Hero Media: Video / Real Image / Category Editorial Image */}
      {article.videoUrl ? (
        <VideoEmbed url={article.videoUrl} />
      ) : (
        <ArticleHero
          imageUrl={article.heroImageUrl || (CATEGORY_FALLBACK_IMAGES[article.categorySlug || "cong-nghe"] ?? CATEGORY_FALLBACK_IMAGES["cong-nghe"])}
          alt={article.title}
          seed={article.slug || article.id}
        />
      )}

      {article.summary ? (
        <section
          aria-labelledby="article-summary-heading"
          className="article-summary"
          style={{
            background: "var(--bg-subtle, #f8fafc)",
            borderLeft: "4px solid var(--accent, #2563eb)",
            padding: "16px 20px",
            borderRadius: "0 8px 8px 0",
            margin: "24px 0",
          }}
        >
          <h2 id="article-summary-heading" style={{ fontSize: "var(--text-base)", margin: "0 0 8px", fontWeight: 700 }}>
            Tóm tắt nhanh
          </h2>
          <p style={{ margin: 0, lineHeight: 1.6 }}>{article.summary}</p>
        </section>
      ) : null}

      <ArticleBody body={article.body} />

      <SourceBlock
        sources={(article.sources ?? []).map((source) => ({
          name: source.name,
          originUrl: source.originUrl,
          rightsStatus: source.rightsStatus,
        }))}
      />

      {/* Section: Bài viết liên quan (Recommendations) */}
      {related.length > 0 ? (
        <section
          aria-labelledby="related-heading"
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <h2 id="related-heading" style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "var(--ink)" }}>
              Bài viết liên quan
            </h2>
            <span style={{ fontSize: "12px", color: "var(--gray)" }}>
              Gợi ý theo ngữ cảnh đọc
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {related.map((item) => {
              const itemCat = (item.categorySlug && CATEGORY_NAMES[item.categorySlug]) || item.categorySlug || "Tin tức";
              return (
                <a
                  key={item.id}
                  href={`/bai-viet/${item.slug || item.id}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    background: "var(--soft, #f8fafc)",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "border-color 0.15s ease, background 0.15s ease",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--accent, #2563eb)",
                        }}
                      >
                        {itemCat}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--gray)",
                          background: "var(--white)",
                          padding: "2px 8px",
                          borderRadius: "99px",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {item.reason}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        lineHeight: 1.4,
                        margin: "0 0 8px",
                        color: "var(--ink)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p
                        style={{
                          fontSize: "13px",
                          color: "var(--gray)",
                          lineHeight: 1.5,
                          margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.summary}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      marginTop: "12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--accent, #2563eb)",
                    }}
                  >
                    Đọc tiếp →
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            newsArticleJsonLd(
              {
                title: article.title,
                summary: article.summary,
                publishedAt: article.updatedAt,
                author: article.sources?.[0]?.name,
                slug: article.slug || slug,
                mainImage: article.heroImageUrl || article.sources?.[0]?.originUrl,
              },
              siteOrigin()
            )
          ).replace(/</g, "\\u003c"),
        }}
      />

      <p style={{ marginTop: 32 }}>
        <a href="/" style={{ textDecoration: "none", color: "var(--accent, #2563eb)", fontWeight: 600 }}>
          ← Quay lại trang chủ MStudio Channel
        </a>
      </p>
    </main>
  );
}