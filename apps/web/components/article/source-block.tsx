import React from "react";

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
      <section aria-labelledby="article-sources-heading" className="mt-12 pt-8 border-t border-white/10 [html.light_&]:border-slate-200">
        <h2 id="article-sources-heading" className="text-xl font-bold mb-4 text-white [html.light_&]:text-slate-900">Nguồn đối chiếu</h2>
        <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 [html.light_&]:bg-slate-50 [html.light_&]:border-slate-200 shadow-md">
          <p role="status" className="text-slate-300 [html.light_&]:text-slate-600 text-sm flex items-center gap-2 m-0">
            <span aria-hidden="true">🛡️</span> Bài viết đang trong quá trình cập nhật nguồn đối chiếu.
          </p>
        </div>
      </section>
    );
  }
  
  return (
    <section aria-labelledby="article-sources-heading" className="mt-12 pt-8 border-t border-white/10 [html.light_&]:border-slate-200">
      <div className="flex items-center gap-2.5 mb-6">
        <h2 id="article-sources-heading" className="text-xl font-bold m-0 text-white [html.light_&]:text-slate-900">Nguồn tham khảo</h2>
        <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 [html.light_&]:bg-emerald-50 [html.light_&]:border-emerald-300 [html.light_&]:text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
          {sources.length} nguồn xác thực
        </span>
      </div>
      
      <div className="flex flex-col gap-3">
        {sources.map((source, index) => {
          const metaInfo = [source.creator, source.credit, source.rightsStatus]
            .filter(Boolean)
            .join(" · ");
            
          return (
            <div
              key={index}
              className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 [html.light_&]:bg-slate-50 [html.light_&]:border-slate-200 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-2 hover:border-cyan-500/40 [html.light_&]:hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                <div className="font-semibold text-white [html.light_&]:text-slate-900">
                  {source.originUrl ? (
                    <a
                      href={source.originUrl}
                      rel="noreferrer"
                      target="_blank"
                      className="text-white [html.light_&]:text-slate-900 hover:text-cyan-300 [html.light_&]:hover:text-blue-600 focus-visible:underline outline-none transition-colors"
                    >
                      {source.name} <span className="text-xs text-cyan-400 [html.light_&]:text-blue-600">↗</span>
                    </a>
                  ) : (
                    source.name
                  )}
                </div>
              </div>
              
              {metaInfo && (
                <div className="text-xs text-slate-300 [html.light_&]:text-slate-500 md:text-right pl-9 md:pl-0 font-mono">
                  {metaInfo}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
