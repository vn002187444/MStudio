import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiBaseUrl } from "../../../../lib/api";
import { newsArticleJsonLd, siteOrigin } from "../../../../lib/seo";
import { ArticleHero } from "../../../../components/article/article-hero";
import {
  extractHeadings,
  TableOfContents,
} from "../../../../components/article/table-of-contents";
import { SourceBlock } from "../../../../components/article/source-block";
import { BlocksRenderer, headingsFromBlocks } from "../../../../components/article/blocks-renderer";
import { parseArticleBlocksBody } from "../../../../../../packages/contracts/src/blocks.ts";

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
    const response = await fetch(
      `${apiBaseUrl()}/articles/${encodeURIComponent(slug)}`,
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

async function fetchRelatedCandidates(articleId: string) {
  try {
    const response = await fetch(
      `${apiBaseUrl()}/recommendations?articleId=${encodeURIComponent(articleId)}&limit=4`,
      { cache: "no-store" },
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      candidates: Array<{ articleId: string; reason: string }>;
    };
    return Array.isArray(payload.candidates) ? payload.candidates : [];
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

function renderBody(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function BodyWithToc({ body }: { body: string }) {
  const headings = extractHeadings(body);
  let headingCursor = 0;
  const blocks = renderBody(body).map((paragraph, index) => {
    const headingMatch = /^(#{2,3})\s+(.+)$/.exec(paragraph.trim());
    if (headingMatch) {
      const heading = headings[headingCursor];
      headingCursor += 1;
      if (!heading) return null;
      return heading.level === 3 ? (
        <h3 id={heading.id} key={index}>
          {heading.text}
        </h3>
      ) : (
        <h2 id={heading.id} key={index}>
          {heading.text}
        </h2>
      );
    }
    return <p key={index} dangerouslySetInnerHTML={{ __html: renderMarkdownLinks(paragraph) }} />;
  });
  return (
    <>
      <TableOfContents headings={headings} />
      <section aria-labelledby="article-body-heading">
        <h2 id="article-body-heading">Nội dung</h2>
        {blocks}
      </section>
    </>
  );
}

function ArticleBody({ body }: { body: string }) {
  const blocks = parseArticleBlocksBody(body);
  if (!blocks) return <BodyWithToc body={body} />;
  const headings = headingsFromBlocks(blocks);
  return (
    <>
      <TableOfContents headings={headings} />
      <section aria-labelledby="article-body-heading">
        <h2 id="article-body-heading">Nội dung</h2>
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

  const related = await fetchRelatedCandidates(article.id);
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

      {/* Hero Media: Video / Real Image / Deterministic Canvas */}
      {article.videoUrl ? (
        <VideoEmbed url={article.videoUrl} />
      ) : article.heroImageUrl ? (
        <div style={{ margin: "0 0 24px", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.heroImageUrl}
            alt={article.title}
            style={{ width: "100%", maxHeight: 480, objectFit: "cover", display: "block" }}
          />
        </div>
      ) : (
        <ArticleHero seed={article.id} />
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
          <h2 id="related-heading" style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 16px" }}>
            Bài viết liên quan
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {related.map((item) => (
              <li key={item.articleId} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ color: "var(--accent, #2563eb)" }}>•</span>
                <a
                  href={`/bai-viet/${item.articleId}`}
                  style={{ textDecoration: "none", color: "inherit", fontWeight: 500 }}
                >
                  Xem bài viết liên quan #{item.articleId.slice(0, 8)}
                </a>
                <span style={{ fontSize: "12px", color: "var(--gray)" }}>({item.reason})</span>
              </li>
            ))}
          </ul>
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