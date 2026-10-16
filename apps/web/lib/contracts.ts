/**
 * Self-contained contracts and block parser for apps/web.
 * Cho phép Cloudflare Pages / Workers build hoàn toàn độc lập mà không
 * bị lỗi path traversal ngoài thư mục apps/web.
 */

export type ArticleStatus =
  | "drafted"
  | "ai_qa"
  | "human_review"
  | "auto_eligible"
  | "hold"
  | "scheduled"
  | "published"
  | "updated"
  | "corrected"
  | "retracted";

export interface PublishedArticleRecord {
  id: string;
  storyId: string;
  status: ArticleStatus;
  title: string;
  body: string;
  summary?: string;
  publishedRevisionId: string;
  slug?: string;
  categorySlug?: string;
  heroImageUrl?: string;
  videoUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  keywords?: string;
  sourceCount: number;
  qualityScore?: number;
  isBreaking: boolean;
  isTrending: boolean;
  updatedAt: string;
  createdAt: string;
}

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
  attrs: {
    src: string;
    alt?: string;
    title?: string;
  };
}

export type ArticleBlock =
  | ParagraphBlock
  | HeadingBlock
  | BulletListBlock
  | OrderedListBlock
  | BlockquoteBlock
  | ImageBlock;

const MAX_DEPTH = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTextNode(raw: unknown): TextNode | undefined {
  if (!isRecord(raw) || raw.type !== "text" || typeof raw.text !== "string") {
    return undefined;
  }
  return { type: "text", text: raw.text };
}

function parseInlineContent(raw: unknown): InlineContent | undefined {
  if (!Array.isArray(raw)) return undefined;
  const nodes: TextNode[] = [];
  for (const item of raw) {
    const node = parseTextNode(item);
    if (!node) return undefined;
    nodes.push(node);
  }
  return nodes;
}

function parseBlock(raw: unknown, depth: number): ArticleBlock | undefined {
  if (!isRecord(raw) || typeof raw.type !== "string") return undefined;
  switch (raw.type) {
    case "paragraph": {
      const content = parseInlineContent(raw.content);
      if (!content) return undefined;
      return { type: "paragraph", content };
    }
    case "heading": {
      const attrs = isRecord(raw.attrs) ? raw.attrs : {};
      const level = attrs.level === 3 ? 3 : 2;
      const content = parseInlineContent(raw.content);
      if (!content) return undefined;
      return { type: "heading", attrs: { level }, content };
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
      return {
        type: "image",
        attrs: {
          src,
          alt: typeof alt === "string" ? alt : undefined,
          title: typeof title === "string" ? title : undefined,
        },
      };
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

export function parseArticleBlocksBody(body: string): ArticleBlock[] | undefined {
  try {
    const parsed = JSON.parse(body);
    return parseBlocks(parsed, 0);
  } catch {
    return undefined;
  }
}
