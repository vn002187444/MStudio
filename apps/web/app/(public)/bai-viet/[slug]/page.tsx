import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchApi } from "../../../../lib/api";
import { newsArticleJsonLd, siteOrigin } from "../../../../lib/seo";
import { ArticleHero } from "../../../../components/article/article-hero";
import { CATEGORY_FALLBACK_IMAGES } from "../../../../components/article/news-card";
import { cleanText, BentoGrid, BentoCard, AmbientGlow } from "@mstudio/ui";
import {
  extractHeadings,
  slugifyHeading,
  TableOfContents,
} from "../../../../components/article/table-of-contents";
import { SourceBlock } from "../../../../components/article/source-block";
import { ArticleShareBar } from "../../../../components/article/article-share-bar";
import { BlocksRenderer, headingsFromBlocks } from "../../../../components/article/blocks-renderer";
import { parseArticleBlocksBody } from "../../../../lib/contracts";

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
  "ai-channel": "AI Channel",
};

function getCategoryColor(slug?: string) {
  switch (slug) {
    case "cong-nghe":
    case "ai-channel":
      return { aura: "rgba(6, 182, 212, 0.2)", text: "text-cyan-400", border: "border-cyan-500/30" };
    case "kinh-doanh":
    case "kinh-te":
      return { aura: "rgba(16, 185, 129, 0.2)", text: "text-emerald-400", border: "border-emerald-500/30" };
    case "thoi-su":
    case "the-gioi":
      return { aura: "rgba(245, 158, 11, 0.2)", text: "text-amber-400", border: "border-amber-500/30" };
    case "khoa-hoc":
      return { aura: "rgba(99, 102, 241, 0.2)", text: "text-indigo-400", border: "border-indigo-500/30" };
    case "xe":
      return { aura: "rgba(239, 68, 68, 0.2)", text: "text-red-400", border: "border-red-500/30" };
    default:
      return { aura: "rgba(59, 130, 246, 0.2)", text: "text-blue-400", border: "border-blue-500/30" };
  }
}

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
    return `<a href="${url}" rel="noopener noreferrer nofollow" target="${isExternal ? "_blank" : "_self"}" class="text-blue-400 hover:underline underline-offset-4">${linkText}</a>`;
  });
}

async function fetchArticle(slug: string): Promise<PublishedArticle | undefined> {
  try {
    const response = await fetchApi(`/articles/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`article API ${response.status}`);
    const payload = (await response.json()) as { article: PublishedArticle };
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

function normalizeArticleText(raw: string): string {
  if (!raw) return "";
  let text = raw
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .trim();

  text = text.replace(/(?<!\n)\n(#{2,4}\s+[^\n]+)/g, "\n\n$1");
  text = text.replace(/(#{2,4}\s+[^\n]+)\n(?!\n)/g, "$1\n\n");
  text = text.replace(/(?<!\n)\n([-*]\s+[^\n]+)/g, "\n\n$1");
  return text;
}

function formatInlineMarkdown(text: string): string {
  let out = renderMarkdownLinks(text);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong class='font-bold text-slate-100'>$1</strong>");
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em class='italic text-slate-300'>$1</em>");
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
          className="text-lg md:text-xl font-bold mt-8 mb-3 text-white tracking-tight"
        >
          {headingMatch[2].trim()}
        </h3>
      ) : (
        <h2
          id={headingId}
          key={`h2-${secIdx}`}
          className="text-xl md:text-2xl font-black mt-10 mb-4 pb-2 border-b border-white/10 text-white tracking-tight"
        >
          {headingMatch[2].trim()}
        </h2>
      );
    }

    const lines = trimmed.split("\n");
    const isBulletList = lines.every((line) => /^[-*]\s+/.test(line.trim()));
    if (isBulletList && lines.length > 0) {
      return (
        <ul key={`ul-${secIdx}`} className="my-4 pl-5 space-y-2 leading-relaxed text-slate-300">
          {lines.map((l, lIdx) => {
            const itemText = l.trim().replace(/^[-*]\s+/, "");
            return (
              <li
                key={`li-${secIdx}-${lIdx}`}
                className="list-disc"
                dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }}
              />
            );
          })}
        </ul>
      );
    }

    if (trimmed.startsWith(">")) {
      const quoteText = trimmed.replace(/^>\s*/gm, "");
      return (
        <blockquote
          key={`quote-${secIdx}`}
          className="my-6 rounded-r-2xl border-l-4 border-blue-500 bg-white/5 p-4 text-slate-300 italic leading-relaxed backdrop-blur-sm"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(quoteText) }}
        />
      );
    }

    return (
      <p
        key={`p-${secIdx}`}
        className="my-5 text-base md:text-[17px] leading-relaxed text-slate-200 tracking-normal"
        dangerouslySetInnerHTML={{
          __html: formatInlineMarkdown(trimmed.replace(/\n/g, "<br />")),
        }}
      />
    );
  });

  return (
    <section aria-labelledby="article-body-heading" className="article-body-content">
      <h2 id="article-body-heading" className="sr-only">
        Nội dung bài viết
      </h2>
      {contentElements}
    </section>
  );
}

function ArticleBody({ body }: { body: string }) {
  const cleanBody = normalizeArticleText(body);
  const blocks = parseArticleBlocksBody(cleanBody);
  if (!blocks) return <BodyWithToc body={cleanBody} />;
  return (
    <section aria-labelledby="article-body-heading" className="article-body-content">
      <h2 id="article-body-heading" className="sr-only">
        Nội dung bài viết
      </h2>
      <BlocksRenderer blocks={blocks} />
    </section>
  );
}

function VideoEmbed({ url }: { url: string }) {
  let embedUrl = url;
  const youtubeMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (youtubeMatch && youtubeMatch[1]) {
    embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}`;
  }

  return (
    <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-2xl my-6 border border-white/10 shadow-xl">
      <iframe
        src={embedUrl}
        title="Video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full border-0"
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
  const theme = getCategoryColor(article.categorySlug);

  const cleanBody = normalizeArticleText(article.body);
  const blocks = parseArticleBlocksBody(cleanBody);
  const headings = blocks ? headingsFromBlocks(blocks) : extractHeadings(cleanBody);

  return (
    <main
      className="article-main relative min-h-screen bg-[var(--surface-sunlit,#0b0f19)] text-slate-100 pt-6 pb-28 overflow-hidden"
      id="main-content"
    >
      {/* Category Ambient Glow */}
      <AmbientGlow color={theme.aura} size={500} className="-top-32 -left-24 pointer-events-none opacity-70" />
      <AmbientGlow color={theme.aura} size={380} className="top-1/2 -right-20 pointer-events-none opacity-40" />

      <div className="container-content max-w-[var(--container)] mx-auto px-4 relative z-10">
        <BentoGrid>
          {/* Main Reading Column (8 Columns) */}
          <BentoCard colSpan={8} className="p-0 border-none bg-transparent">
            <article className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
              {/* Category, Badges, Date */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                {article.categorySlug ? (
                  <a
                    href={`/${article.categorySlug}`}
                    className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${theme.border} bg-white/5 ${theme.text} hover:bg-white/10 transition-colors`}
                  >
                    {categoryName}
                  </a>
                ) : (
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Tin tức
                  </span>
                )}

                {article.isBreaking && (
                  <span className="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider animate-pulse">
                    Tin nóng
                  </span>
                )}

                {article.isTrending && (
                  <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                    Thịnh hành
                  </span>
                )}

                <span className="text-xs text-slate-400 ml-auto font-mono">
                  {article.updatedAt.slice(0, 10)}
                  {article.sources && article.sources.length > 0 && ` · ${article.sources.length} nguồn`}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-4xl lg:text-[40px] font-black leading-tight text-white mb-6 tracking-tight">
                {cleanText(article.title)}
              </h1>

              {/* Hero Media */}
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-6">
                {article.videoUrl ? (
                  <VideoEmbed url={article.videoUrl} />
                ) : (
                  <ArticleHero
                    imageUrl={article.heroImageUrl || (CATEGORY_FALLBACK_IMAGES[article.categorySlug || "thoi-su"] ?? CATEGORY_FALLBACK_IMAGES["thoi-su"])}
                    alt={article.title}
                    seed={article.slug || article.id}
                  />
                )}
              </div>

              {/* Fast Executive Summary Box */}
              {article.summary && (
                <section
                  aria-labelledby="article-summary-heading"
                  className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 my-6 backdrop-blur-md"
                >
                  <h2 id="article-summary-heading" className="text-xs font-mono uppercase tracking-wider font-bold text-blue-300 mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    Tóm tắt cốt lõi
                  </h2>
                  <p className="text-sm md:text-base text-slate-200 leading-relaxed m-0">
                    {article.summary}
                  </p>
                </section>
              )}

              {/* Body */}
              <ArticleBody body={article.body} />

              {/* Sources */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <SourceBlock
                  sources={(article.sources ?? []).map((source) => ({
                    name: source.name,
                    originUrl: source.originUrl,
                    rightsStatus: source.rightsStatus,
                  }))}
                />
              </div>

              {/* Back to Home Link */}
              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                <a
                  href="/"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
                >
                  ← Quay lại trang chủ MStudio Channel
                </a>
              </div>
            </article>
          </BentoCard>

          {/* Sticky Sidebar Column (4 Columns) */}
          <BentoCard colSpan={4} className="p-0 border-none bg-transparent">
            <div className="flex flex-col gap-6 sticky top-24">
              {/* Table of Contents HUD */}
              <TableOfContents headings={headings} />

              {/* Social / Reading Utility Box */}
              <ArticleShareBar
                title={article.title}
                url={`${siteOrigin()}/bai-viet/${article.slug || slug}`}
              />

              {/* Recommendations */}
              {related.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-white/10 pb-2">
                    Bài viết liên quan
                  </h3>
                  <div className="flex flex-col gap-3">
                    {related.map((item) => (
                      <a
                        key={item.id}
                        href={`/bai-viet/${item.slug || item.id}`}
                        className="group rounded-xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 hover:border-cyan-500/30 transition-all"
                      >
                        <span className="text-[10px] font-mono uppercase text-cyan-400 block mb-1">
                          {item.reason}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-200 line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </BentoCard>
        </BentoGrid>
      </div>

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
    </main>
  );
}