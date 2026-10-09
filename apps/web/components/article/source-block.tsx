/**
 * Source block (MST-042) — danh sách nguồn của bài viết.
 * Fields theo PLAN Media policy: origin, creator, rights, credit.
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
      <section aria-labelledby="article-sources-heading">
        <h2 id="article-sources-heading">Nguồn</h2>
        <p role="status" style={{ color: "var(--gray)" }}>
          Bài viết xuất bản luôn kèm nguồn đối chiếu được (MST-041).
        </p>
      </section>
    );
  }
  return (
    <section aria-labelledby="article-sources-heading">
      <h2 id="article-sources-heading">Nguồn ({sources.length})</h2>
      <ul className="source-list">
        {sources.map((source) => (
          <li key={source.name}>
            {source.originUrl ? (
              <a href={source.originUrl} rel="noreferrer" target="_blank">
                {source.name}
              </a>
            ) : (
              source.name
            )}
            {[source.creator, source.credit, source.rightsStatus]
              .filter(Boolean)
              .join(" · ")}
          </li>
        ))}
      </ul>
    </section>
  );
}
