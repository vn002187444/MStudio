import type { PublishedArticleRecord } from "../../lib/contracts";
import { fetchApi } from "../../lib/api";
import { CompactNewsCard } from "../article/news-card";
import { FollowEntityButton } from "./follow-controls";
import { BentoGrid, BentoCard } from "@mstudio/ui";

export type EntityType = "PERSON" | "ORGANIZATION" | "LOCATION" | "EVENT" | "CONCEPT";

interface EntityData {
  id: string;
  name: string;
  type: EntityType;
  slug: string;
  description?: string;
  avatarUrl?: string;
  articleCount: number;
}

interface ArticlesResponse {
  rows: PublishedArticleRecord[];
  nextCursor?: { createdAt: string; id: string };
}

async function fetchEntityInfo(slug: string): Promise<EntityData | null> {
  // TODO: Gọi API thật `GET /discovery/entities/:slug`
  return {
    id: "e-" + slug,
    name: slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    type: "CONCEPT",
    slug,
    description: `Tổng hợp các bài viết, tin tức và phân tích chuyên sâu liên quan đến ${slug}.`,
    articleCount: Math.floor(Math.random() * 100) + 1,
  };
}

async function fetchEntityArticles(slug: string, limit = 20): Promise<PublishedArticleRecord[]> {
  try {
    // Tạm gọi bài mới nhất thay vì filter thật
    const response = await fetchApi(`/articles?limit=${limit}`, { cache: "no-store" });
    if (!response.ok) return [];
    const payload = (await response.json()) as ArticlesResponse;
    return Array.isArray(payload.rows) ? payload.rows : [];
  } catch {
    return [];
  }
}

export async function EntityTemplate({ slug, entityType }: { slug: string; entityType: EntityType }) {
  const entity = await fetchEntityInfo(slug);
  if (!entity) {
    return (
      <main className="home-main min-h-screen pt-20 pb-24 text-center">
        <h1 className="text-3xl font-bold">Không tìm thấy thông tin</h1>
        <p className="text-gray-500 mt-4">Chủ đề hoặc thực thể này không tồn tại trong hệ thống.</p>
      </main>
    );
  }

  const articles = await fetchEntityArticles(slug, 20);

  return (
    <main className="home-main min-h-screen bg-[var(--solar-light)] pt-8 pb-24" id="main-content">
      <div className="container-content max-w-[var(--container)] mx-auto px-4">
        {/* Entity Header */}
        <header className="mb-12">
          <BentoGrid>
            <BentoCard colSpan={12} className="bg-[var(--void-surface)] text-white p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8 border-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
              
              {/* Avatar / Placeholder */}
              <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-4xl shadow-xl relative z-10">
                {entity.type === "PERSON" ? "👤" : entity.type === "ORGANIZATION" ? "🏢" : "🏷️"}
              </div>

              <div className="flex-1 text-center md:text-left relative z-10 flex flex-col items-center md:items-start h-full justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-white/10 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-blue-300">
                    {entity.type}
                  </span>
                  <span className="text-sm font-medium text-white/60">{entity.articleCount} bài viết</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 drop-shadow-md">
                  {entity.name}
                </h1>
                {entity.description && (
                  <p className="text-lg text-white/80 max-w-2xl leading-relaxed mb-6">
                    {entity.description}
                  </p>
                )}
                <div className="mt-auto">
                  <FollowEntityButton entityId={entity.id} entityName={entity.name} initialState={false} />
                </div>
              </div>
            </BentoCard>
          </BentoGrid>
        </header>

        <BentoGrid>
          {/* Main Column */}
          <BentoCard colSpan={8} className="p-0 border-none bg-transparent">
            <div className="bg-white rounded-[var(--bento-radius-outer)] border border-black/5 p-[var(--bento-padding)] shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-black/5 pb-4">
                <h2 className="text-xl font-bold m-0">Bài viết liên quan</h2>
                <div className="text-sm text-gray-500 font-medium">Sắp xếp: Mới nhất</div>
              </div>

              {articles.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {articles.map((article) => (
                    <CompactNewsCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-12 text-center bg-gray-50 rounded-lg border border-gray-100">
                  Chưa có bài viết nào liên kết với chủ đề này.
                </p>
              )}
            </div>
          </BentoCard>

          {/* Sidebar */}
          <BentoCard colSpan={4} className="p-0 border-none bg-transparent">
            <div className="flex flex-col gap-6">
              <section className="bg-white rounded-[var(--bento-radius-outer)] border border-black/5 p-[var(--bento-padding)] shadow-sm">
                <h3 className="text-base font-bold mb-4">Thông tin thực thể (Knowledge Graph)</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Tên gọi</span>
                    <span className="font-semibold text-right">{entity.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Phân loại</span>
                    <span className="font-semibold text-right">{entity.type}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Lượt đề cập</span>
                    <span className="font-semibold text-right">{entity.articleCount} bài viết</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500 font-medium">Trạng thái</span>
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <span aria-hidden="true">✓</span> Đã xác thực
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </BentoCard>
        </BentoGrid>
      </div>
    </main>
  );
}
