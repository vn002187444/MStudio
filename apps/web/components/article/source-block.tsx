import { GlassCard } from "@mstudio/ui";

/**
 * Source block (MST-110 Hybrid Glassmorphic) — danh sách nguồn của bài viết.
 */
export interface ArticleSource {
  name: string;
  originUrl?: string;
  creator?: string;
  rightsStatus?: string;
  credit?: string;
}

export function SourceBlock({ sources }: { sources: ArticleSource[] }) {
  if (sources.length === 0) {
    return (
      <section aria-labelledby="article-sources-heading" className="mt-12 pt-8 border-t border-black/10">
        <h2 id="article-sources-heading" className="text-xl font-bold mb-4">Nguồn đối chiếu</h2>
        <GlassCard variant="hybrid" className="p-4 bg-white/60">
          <p role="status" className="text-[var(--gray)] text-sm flex items-center gap-2">
            <span aria-hidden="true">🛡️</span> Bài viết đang trong quá trình cập nhật nguồn đối chiếu.
          </p>
        </GlassCard>
      </section>
    );
  }
  
  return (
    <section aria-labelledby="article-sources-heading" className="mt-12 pt-8 border-t border-black/10">
      <div className="flex items-center gap-2 mb-6">
        <h2 id="article-sources-heading" className="text-xl font-bold m-0">Nguồn tham khảo</h2>
        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
          {sources.length} nguồn xác thực
        </span>
      </div>
      
      <div className="flex flex-col gap-3">
        {sources.map((source, index) => {
          const metaInfo = [source.creator, source.credit, source.rightsStatus]
            .filter(Boolean)
            .join(" · ");
            
          return (
            <GlassCard key={index} variant="hybrid" className="p-4 bg-white/60 flex flex-col md:flex-row md:items-center justify-between gap-2 border-black/5 hover:border-black/20 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                  {index + 1}
                </span>
                <div className="font-semibold text-[var(--ink)]">
                  {source.originUrl ? (
                    <a href={source.originUrl} rel="noreferrer" target="_blank" className="hover:text-blue-600 focus-visible:underline outline-none">
                      {source.name} <span className="text-xs text-gray-400">↗</span>
                    </a>
                  ) : (
                    source.name
                  )}
                </div>
              </div>
              
              {metaInfo && (
                <div className="text-sm text-[var(--gray)] md:text-right pl-9 md:pl-0">
                  {metaInfo}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}
