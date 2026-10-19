export interface TocHeading {
  level: number;
  text: string;
  id: string;
}

export type TocItem = TocHeading;

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
