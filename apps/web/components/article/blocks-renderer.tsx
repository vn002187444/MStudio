/**
 * Blocks renderer (MST-110 Hybrid Glassmorphic) — render ArticleBlock[] (packages/contracts)
 * sang HTML semantic phía Server Component. Không bao giờ paste HTML string:
 * link/ ảnh chỉ nhận http(s) hoặc root-relative, phần tử lạ bị bỏ qua.
 */
import { Fragment, type ReactNode } from "react";
import type {
  ArticleBlock,
  InlineContent,
  TextMark,
} from "../../../../packages/contracts/src/blocks.ts";
import {
  slugifyHeading,
  type TocHeading,
} from "./table-of-contents";

/** Chỉ cho qua http(s) tuyệt đối hoặc path bắt đầu bằng "/". */
function safeUrl(raw: string): string | undefined {
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function splitText(text: string, baseKey: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const parts = text.split("\n");
  parts.forEach((part, index) => {
    if (index > 0) nodes.push(<br key={`${baseKey}-br-${index}`} />);
    if (part.length > 0) nodes.push(part);
  });
  return nodes;
}

function wrapMark(child: ReactNode, mark: TextMark, key: string): ReactNode {
  switch (mark.type) {
    case "bold":
      return <strong key={key} className="font-bold text-[var(--ink)]">{child}</strong>;
    case "italic":
      return <em key={key} className="italic">{child}</em>;
    case "strike":
      return <s key={key} className="line-through opacity-70">{child}</s>;
    case "code":
      return <code key={key} className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-gray-200">{child}</code>;
    case "link": {
      const href = mark.attrs?.href ? safeUrl(mark.attrs.href) : undefined;
      if (!href) return child;
      const target = mark.attrs?.target === "_blank" ? "_blank" : undefined;
      return (
        <a
          href={href}
          key={key}
          rel={mark.attrs?.rel ?? (target ? "noopener noreferrer nofollow" : undefined)}
          target={target}
          className="text-blue-600 underline underline-offset-4 hover:text-blue-800 transition-colors"
        >
          {child}
        </a>
      );
    }
    default:
      return child;
  }
}

function renderInline(content: InlineContent, keyPrefix: string): ReactNode[] {
  return content.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    const text = splitText(node.text, key);
    let marked: ReactNode = <>{text}</>;
    (node.marks ?? []).forEach((mark, markIndex) => {
      marked = wrapMark(marked, mark, `${key}-m${markIndex}`);
    });
    return <Fragment key={key}>{marked}</Fragment>;
  });
}

function inlineText(content: InlineContent): string {
  return content.map((node) => node.text).join("");
}

function BlockView({
  block,
  keyPrefix,
  headingIds,
  cursor,
}: {
  block: ArticleBlock;
  keyPrefix: string;
  /** Id theo đúng thứ tự walk của headingsFromBlocks — ToC khớp anchor. */
  headingIds: string[];
  cursor: { index: number };
}): ReactNode {
  switch (block.type) {
    case "paragraph":
      return <p className="text-lg leading-relaxed text-[var(--ink-700)] mb-6">{renderInline(block.content, keyPrefix)}</p>;
    case "heading": {
      const headingId = headingIds[cursor.index];
      cursor.index += 1;
      const content = renderInline(block.content, keyPrefix);
      return block.attrs.level === 3 ? (
        <h3 id={headingId} className="text-2xl font-bold mt-10 mb-4 text-[var(--ink)] scroll-mt-24 tracking-tight">
          {content}
        </h3>
      ) : (
        <h2 id={headingId} className="text-3xl font-bold mt-12 mb-6 text-[var(--ink)] border-b border-black/10 pb-2 scroll-mt-24 tracking-tight">
          {content}
        </h2>
      );
    }
    case "bulletList":
      return (
        <ul className="list-disc list-outside ml-6 mb-8 text-lg leading-relaxed text-[var(--ink-700)] space-y-2">
          {block.content.map((item, index) => (
            <li key={`${keyPrefix}-${index}`} className="pl-2 marker:text-blue-500">
              {item.content.map((child, childIndex) => (
                <BlockView
                  block={child}
                  cursor={cursor}
                  headingIds={headingIds}
                  key={`${keyPrefix}-${index}-${childIndex}`}
                  keyPrefix={`${keyPrefix}-${index}-${childIndex}`}
                />
              ))}
            </li>
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol className="list-decimal list-outside ml-6 mb-8 text-lg leading-relaxed text-[var(--ink-700)] space-y-2 font-medium">
          {block.content.map((item, index) => (
            <li key={`${keyPrefix}-${index}`} className="pl-2 marker:text-blue-600">
              {item.content.map((child, childIndex) => (
                <BlockView
                  block={child}
                  cursor={cursor}
                  headingIds={headingIds}
                  key={`${keyPrefix}-${index}-${childIndex}`}
                  keyPrefix={`${keyPrefix}-${index}-${childIndex}`}
                />
              ))}
            </li>
          ))}
        </ol>
      );
    case "blockquote":
      return (
        <blockquote className="my-8 relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full" />
          <div className="bg-[var(--soft)] border border-black/5 rounded-r-[var(--bento-radius-inner)] rounded-l-none pl-6 pr-4 py-4 text-xl font-medium italic text-[var(--ink)] shadow-sm">
            {block.content.map((child, index) => (
              <BlockView
                block={child}
                cursor={cursor}
                headingIds={headingIds}
                key={`${keyPrefix}-${index}`}
                keyPrefix={`${keyPrefix}-${index}`}
              />
            ))}
          </div>
        </blockquote>
      );
    case "image": {
      const src = safeUrl(block.attrs.src);
      if (!src) return null;
      return (
        <figure className="my-10 rounded-[var(--bento-radius-outer)] overflow-hidden bg-gray-100 border border-black/5 shadow-md group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={block.attrs.alt ?? ""} loading="lazy" src={src} className="w-full h-auto object-cover block" />
          {block.attrs.alt ? (
            <figcaption className="p-3 text-center text-sm text-gray-500 bg-white border-t border-black/5">
              {block.attrs.alt}
            </figcaption>
          ) : null}
        </figure>
      );
    }
  }
}

/** Gom heading (h2/h3) từ blocks để nuôi TableOfContents. */
export function headingsFromBlocks(blocks: ArticleBlock[]): TocHeading[] {
  const headings: TocHeading[] = [];
  const usedIds = new Set<string>();

  function walk(items: ArticleBlock[]): void {
    for (const block of items) {
      if (block.type === "blockquote") {
        walk(block.content);
        continue;
      }
      if (block.type === "heading") {
        const text = inlineText(block.content).trim();
        if (!text) continue;
        const base = slugifyHeading(text) || `heading-${headings.length + 1}`;
        let id = base;
        let suffix = 2;
        while (usedIds.has(id)) {
          id = `${base}-${suffix}`;
          suffix += 1;
        }
        usedIds.add(id);
        headings.push({ level: block.attrs.level, text, id });
      }
    }
  }

  walk(blocks);
  return headings;
}

export function BlocksRenderer({ blocks }: { blocks: ArticleBlock[] }) {
  const headingIds = headingsFromBlocks(blocks).map((heading) => heading.id);
  const cursor = { index: 0 };
  return (
    <div className="article-blocks max-w-none">
      {blocks.map((block, index) => (
        <BlockView
          block={block}
          cursor={cursor}
          headingIds={headingIds}
          key={`block-${index}`}
          keyPrefix={`b${index}`}
        />
      ))}
    </div>
  );
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
