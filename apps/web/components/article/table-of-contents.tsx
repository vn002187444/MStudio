/**
 * Table of Contents (proposal §7): trích heading markdown (## / ###)
 * từ body, render sticky bên phải trên desktop. Không có heading thì
 * render nothing — body hiện tại là đoạn văn thuần.
 */
export interface TocHeading {
  level: 2 | 3;
  text: string;
  id: string;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function extractHeadings(body: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const normalized = body
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n");

  for (const line of normalized.split("\n")) {
    const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    const text = match[2].trim();
    if (!text) continue;
    headings.push({
      level: match[1].length === 3 ? 3 : 2,
      text,
      id: slugifyHeading(text) || `heading-${headings.length + 1}`,
    });
  }
  return headings;
}

export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  if (headings.length === 0) return null;
  return (
    <aside aria-label="Mục lục bài viết" className="article-toc">
      <h2 style={{ fontSize: "var(--text-base)" }}>Mục lục</h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ marginLeft: heading.level === 3 ? 16 : 0 }}
          >
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
