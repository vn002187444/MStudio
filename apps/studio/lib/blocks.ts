/**
 * Bridge Tiptap doc JSON ↔ ArticleBlock[] (FU-05, contracts-first).
 * Tiptap JSON là trạng thái biên tập; ArticleBlock[] là format xuất bản —
 * converter nằm ở đây (studio-owned), schema sống trong packages/contracts.
 */
import type {
  ArticleBlock,
  BulletListBlock,
  InlineContent,
  ListItemBlock,
  ListItemContent,
  OrderedListBlock,
  TextMark,
  TextMarkType,
} from "../../../packages/contracts/src/blocks.ts";

export interface TiptapMarkJson {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNodeJson {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNodeJson[];
  marks?: TiptapMarkJson[];
  text?: string;
}

const MARK_MAP: Record<string, TextMarkType> = {
  bold: "bold",
  italic: "italic",
  strike: "strike",
  code: "code",
  link: "link",
};

const HARD_BREAK_TEXT = "\n";

function convertMarks(marks: TiptapMarkJson[] | undefined): TextMark[] | undefined {
  if (!marks || marks.length === 0) return undefined;
  const converted: TextMark[] = [];
  for (const mark of marks) {
    const type = MARK_MAP[mark.type];
    if (!type) continue;
    if (type === "link") {
      const href = mark.attrs?.href;
      if (typeof href !== "string" || href.length === 0) continue;
      const attrs: NonNullable<TextMark["attrs"]> = { href };
      if (typeof mark.attrs?.target === "string") attrs.target = mark.attrs.target;
      if (typeof mark.attrs?.rel === "string") attrs.rel = mark.attrs.rel;
      converted.push({ type: "link", attrs });
      continue;
    }
    converted.push({ type });
  }
  return converted.length > 0 ? converted : undefined;
}

function convertInline(content: TiptapNodeJson[] | undefined): InlineContent {
  if (!content) return [];
  const nodes: InlineContent = [];
  for (const node of content) {
    if (node.type === "hardBreak") {
      nodes.push({ type: "text", text: HARD_BREAK_TEXT });
      continue;
    }
    if (node.type !== "text" || typeof node.text !== "string" || node.text.length === 0) {
      continue;
    }
    const marks = convertMarks(node.marks);
    nodes.push(marks ? { type: "text", text: node.text, marks } : { type: "text", text: node.text });
  }
  return nodes;
}

function convertListItem(node: TiptapNodeJson): ListItemBlock | undefined {
  if (node.type !== "listItem" || !node.content || node.content.length === 0) {
    return undefined;
  }
  const content: ListItemContent[] = [];
  for (const child of node.content) {
    if (child.type === "paragraph") {
      content.push({ type: "paragraph", content: convertInline(child.content) });
      continue;
    }
    const list = convertList(child);
    if (list) content.push(list);
  }
  if (content.length === 0) return undefined;
  return { type: "listItem", content };
}

function convertList(
  node: TiptapNodeJson,
): BulletListBlock | OrderedListBlock | undefined {
  if (node.type !== "bulletList" && node.type !== "orderedList") return undefined;
  const items: ListItemBlock[] = [];
  for (const child of node.content ?? []) {
    const item = convertListItem(child);
    if (item) items.push(item);
  }
  if (items.length === 0) return undefined;
  return node.type === "bulletList"
    ? { type: "bulletList", content: items }
    : { type: "orderedList", content: items };
}

function convertBlock(node: TiptapNodeJson): ArticleBlock | undefined {
  switch (node.type) {
    case "paragraph":
      return { type: "paragraph", content: convertInline(node.content) };
    case "heading": {
      const level = node.attrs?.level;
      if (level !== 2 && level !== 3) return undefined;
      return { type: "heading", attrs: { level }, content: convertInline(node.content) };
    }
    case "bulletList":
    case "orderedList":
      return convertList(node);
    case "blockquote": {
      const content: ArticleBlock[] = [];
      for (const child of node.content ?? []) {
        const block = convertBlock(child);
        if (block) content.push(block);
      }
      if (content.length === 0) return undefined;
      return { type: "blockquote", content };
    }
    case "image": {
      const src = node.attrs?.src;
      if (typeof src !== "string" || src.length === 0) return undefined;
      const attrs: Extract<ArticleBlock, { type: "image" }>["attrs"] = { src };
      if (typeof node.attrs?.alt === "string" && node.attrs.alt.length > 0) {
        attrs.alt = node.attrs.alt;
      }
      if (typeof node.attrs?.title === "string" && node.attrs.title.length > 0) {
        attrs.title = node.attrs.title;
      }
      return { type: "image", attrs };
    }
    default:
      return undefined;
  }
}

/** Tiptap `editor.getJSON()` → ArticleBlock[] (node lạ bị bỏ qua). */
export function tiptapDocToBlocks(doc: TiptapNodeJson): ArticleBlock[] {
  if (doc.type !== "doc") return [];
  const blocks: ArticleBlock[] = [];
  for (const node of doc.content ?? []) {
    const block = convertBlock(node);
    if (block) blocks.push(block);
  }
  return blocks;
}

function inlineToTiptap(content: InlineContent): TiptapNodeJson[] {
  const nodes: TiptapNodeJson[] = [];
  for (const node of content) {
    const marks = node.marks?.map((mark) =>
      mark.attrs ? { type: mark.type, attrs: mark.attrs } : { type: mark.type },
    );
    const parts = node.text.split(HARD_BREAK_TEXT);
    parts.forEach((part, index) => {
      if (index > 0) nodes.push({ type: "hardBreak" });
      if (part.length === 0) return;
      nodes.push(
        marks && marks.length > 0
          ? { type: "text", text: part, marks }
          : { type: "text", text: part },
      );
    });
  }
  return nodes;
}

function blockToTiptap(block: ArticleBlock): TiptapNodeJson {
  switch (block.type) {
    case "paragraph":
      return { type: "paragraph", content: inlineToTiptap(block.content) };
    case "heading":
      return {
        type: "heading",
        attrs: { level: block.attrs.level },
        content: inlineToTiptap(block.content),
      };
    case "bulletList":
    case "orderedList":
      return {
        type: block.type,
        content: block.content.map((item) => ({
          type: "listItem",
          content: item.content.map((child) => blockToTiptap(child)),
        })),
      };
    case "blockquote":
      return {
        type: "blockquote",
        content: block.content.map((child) => blockToTiptap(child)),
      };
    case "image":
      return {
        type: "image",
        attrs: block.attrs,
      };
  }
}

/** ArticleBlock[] → Tiptap `content` (dùng seed editor khi mở draft cũ). */
export function blocksToTiptapDoc(blocks: ArticleBlock[]): TiptapNodeJson {
  return {
    type: "doc",
    content:
      blocks.length > 0
        ? blocks.map((block) => blockToTiptap(block))
        : [{ type: "paragraph", content: [] }],
  };
}
