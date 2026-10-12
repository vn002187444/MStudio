/**
 * Structured article content blocks (FU-05) — output format của blocks
 * editor trong apps/studio, input của renderer apps/web.
 *
 * Quy tắc:
 * - KHÔNG dùng HTML string: body lưu JSON blocks để render phía web
 *   (Server Components) và migrate an toàn sau này.
 * - Parse strict: một node lạ/malformed là fail cả mảng → caller fallback
 *   về plain text, không bao giờ silent-drop nội dung.
 */

export type ArticleBlockType =
  | "paragraph"
  | "heading"
  | "bulletList"
  | "orderedList"
  | "blockquote"
  | "image";

export type TextMarkType = "bold" | "italic" | "strike" | "code" | "link";

export interface TextMark {
  type: TextMarkType;
  attrs?: {
    href?: string;
    target?: string;
    rel?: string;
  };
}

export interface TextNode {
  type: "text";
  text: string;
  marks?: TextMark[];
}

/** Inline content của paragraph/heading — "\n" là hard break. */
export type InlineContent = TextNode[];

export interface ParagraphBlock {
  type: "paragraph";
  content: InlineContent;
}

export interface HeadingBlock {
  type: "heading";
  attrs: { level: 2 | 3 };
  content: InlineContent;
}

export type ListItemContent = ParagraphBlock | BulletListBlock | OrderedListBlock;

export interface ListItemBlock {
  type: "listItem";
  content: ListItemContent[];
}

export interface BulletListBlock {
  type: "bulletList";
  content: ListItemBlock[];
}

export interface OrderedListBlock {
  type: "orderedList";
  content: ListItemBlock[];
}

export interface BlockquoteBlock {
  type: "blockquote";
  content: ArticleBlock[];
}

export interface ImageBlock {
  type: "image";
  attrs: { src: string; alt?: string; title?: string };
}

export type ArticleBlock =
  | ParagraphBlock
  | HeadingBlock
  | BulletListBlock
  | OrderedListBlock
  | BlockquoteBlock
  | ImageBlock;

/** Giới hạn lồng blockquote/list — tránh payload đệ quy vô tận. */
const MAX_DEPTH = 4;

const MARK_TYPES: readonly string[] = [
  "bold",
  "italic",
  "strike",
  "code",
  "link",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMark(value: unknown): TextMark | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.type !== "string" || !MARK_TYPES.includes(value.type)) {
    return undefined;
  }
  if (value.type !== "link") return { type: value.type as TextMarkType };
  const attrs = value.attrs;
  if (!isRecord(attrs) || typeof attrs.href !== "string") return undefined;
  if (attrs.href.length === 0) return undefined;
  const linkAttrs: NonNullable<TextMark["attrs"]> = { href: attrs.href };
  if (typeof attrs.target === "string") linkAttrs.target = attrs.target;
  if (typeof attrs.rel === "string") linkAttrs.rel = attrs.rel;
  return { type: "link", attrs: linkAttrs };
}

function parseInline(value: unknown): InlineContent | undefined {
  if (!Array.isArray(value)) return undefined;
  const nodes: InlineContent = [];
  for (const item of value) {
    if (!isRecord(item) || item.type !== "text") return undefined;
    if (typeof item.text !== "string" || item.text.length === 0) {
      return undefined;
    }
    let marks: TextMark[] | undefined;
    if (item.marks !== undefined) {
      if (!Array.isArray(item.marks)) return undefined;
      marks = [];
      for (const rawMark of item.marks) {
        const mark = parseMark(rawMark);
        if (!mark) return undefined;
        marks.push(mark);
      }
      if (marks.length === 0) marks = undefined;
    }
    nodes.push(
      marks
        ? { type: "text", text: item.text, marks }
        : { type: "text", text: item.text },
    );
  }
  return nodes;
}

function parseListItems(
  value: unknown,
  depth: number,
): ListItemBlock[] | undefined {
  if (!Array.isArray(value)) return undefined;
  if (depth > MAX_DEPTH) return undefined;
  const items: ListItemBlock[] = [];
  for (const raw of value) {
    if (!isRecord(raw) || raw.type !== "listItem") return undefined;
    if (!Array.isArray(raw.content) || raw.content.length === 0) {
      return undefined;
    }
    const content: ListItemContent[] = [];
    for (const child of raw.content) {
      if (!isRecord(child)) return undefined;
      if (child.type === "paragraph") {
        const parsed = parseBlock(child, depth);
        if (!parsed || parsed.type !== "paragraph") return undefined;
        content.push(parsed);
        continue;
      }
      if (child.type === "bulletList" || child.type === "orderedList") {
        const parsed = parseBlock(child, depth + 1);
        if (
          !parsed ||
          (parsed.type !== "bulletList" && parsed.type !== "orderedList")
        ) {
          return undefined;
        }
        content.push(parsed);
        continue;
      }
      return undefined;
    }
    items.push({ type: "listItem", content });
  }
  return items;
}

function parseBlock(raw: unknown, depth: number): ArticleBlock | undefined {
  if (!isRecord(raw)) return undefined;
  switch (raw.type) {
    case "paragraph": {
      const content = parseInline(raw.content);
      if (!content) return undefined;
      return { type: "paragraph", content };
    }
    case "heading": {
      if (!isRecord(raw.attrs)) return undefined;
      if (raw.attrs.level !== 2 && raw.attrs.level !== 3) return undefined;
      const content = parseInline(raw.content);
      if (!content) return undefined;
      return { type: "heading", attrs: { level: raw.attrs.level }, content };
    }
    case "bulletList":
    case "orderedList": {
      const items = parseListItems(raw.content, depth);
      if (!items) return undefined;
      return raw.type === "bulletList"
        ? { type: "bulletList", content: items }
        : { type: "orderedList", content: items };
    }
    case "blockquote": {
      if (depth >= MAX_DEPTH) return undefined;
      const content = parseBlocks(raw.content, depth + 1);
      if (!content) return undefined;
      return { type: "blockquote", content };
    }
    case "image": {
      if (!isRecord(raw.attrs)) return undefined;
      const { src, alt, title } = raw.attrs;
      if (typeof src !== "string" || src.length === 0) return undefined;
      const attrs: ImageBlock["attrs"] = { src };
      if (typeof alt === "string" && alt.length > 0) attrs.alt = alt;
      if (typeof title === "string" && title.length > 0) attrs.title = title;
      return { type: "image", attrs };
    }
    default:
      return undefined;
  }
}

function parseBlocks(value: unknown, depth: number): ArticleBlock[] | undefined {
  if (!Array.isArray(value)) return undefined;
  if (depth > MAX_DEPTH) return undefined;
  const blocks: ArticleBlock[] = [];
  for (const raw of value) {
    const block = parseBlock(raw, depth);
    if (!block) return undefined;
    blocks.push(block);
  }
  return blocks;
}

/**
 * Validate unknown value (thường là JSON.parse) thành ArticleBlock[].
 * Trả về undefined khi payload không phải blocks hợp lệ — caller fallback
 * sang render plain text.
 */
export function parseArticleBlocks(value: unknown): ArticleBlock[] | undefined {
  return parseBlocks(value, 0);
}

/**
 * Parse body string của article: JSON blocks → ArticleBlock[],
 * còn lại (plain text / HTML cũ) → undefined.
 */
export function parseArticleBlocksBody(body: string): ArticleBlock[] | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return undefined;
  }
  return parseArticleBlocks(parsed);
}

export function serializeArticleBlocks(blocks: ArticleBlock[]): string {
  return JSON.stringify(blocks);
}
