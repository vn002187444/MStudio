import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleHero } from "../../../components/article/article-hero";
import { SourceBlock } from "../../../components/article/source-block";

/**
 * Trang bài viết — dữ liệu published từ GET /articles/:id.
 * Slug hiện tại là article id (slug đẹp là follow-up khi có CMS).
 */
interface PublishedArticle {
  id: string;
  storyId: string;
  status: string;
  title: string;
  body: string;
  summary?: string;
  updatedAt: string;
  createdAt: string;
}

function apiBaseUrl(): string {
  return process.env.MSTUDIO_API_URL ?? "http://localhost:8787";
}

async function fetchArticle(
  slug: string,
): Promise<PublishedArticle | undefined> {
  try {
    const response = await fetch(
      `${apiBaseUrl()}/articles/${encodeURIComponent(slug)}`,
      { next: { revalidate: 60 } },
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
  return {
    title: `${article.title} | MStudio Channel`,
    description: article.summary ?? article.title,
  };
}

function renderBody(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
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

  return (
    <main className="article-main" id="main-content">
      <p style={{ color: "var(--gray)", margin: "0 0 4px" }}>Tin tức</p>
      <h1 style={{ fontSize: "var(--text-4xl)", margin: "0 0 8px" }}>
        {article.title}
      </h1>
      {article.summary ? (
        <p style={{ color: "var(--gray)", margin: "0 0 8px" }}>
          {article.summary}
        </p>
      ) : null}
      <p style={{ color: "var(--gray)", margin: "0 0 24px" }}>
        Cập nhật: {article.updatedAt.slice(0, 10)}
      </p>

      <ArticleHero seed={article.id} />

      <section aria-labelledby="article-body-heading">
        <h2 id="article-body-heading">Nội dung</h2>
        {renderBody(article.body).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </section>

      <SourceBlock sources={[]} />

      <p style={{ marginTop: 24 }}>
        <a href="/">← Trang chủ</a>
      </p>
    </main>
  );
}
