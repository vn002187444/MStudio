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
} from "../../lib/contracts";
import {
  slugifyHeading,
  type TocHeading,
} from "./toc-utils";

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
      return <strong key={key} className="font-bold text-white [html.light_&]:text-slate-900">{child}</strong>;
    case "italic":
      return <em key={key} className="italic text-slate-200 [html.light_&]:text-slate-700">{child}</em>;
    case "strike":
      return <s key={key} className="line-through text-slate-400 [html.light_&]:text-slate-500">{child}</s>;
    case "code":
      return (
        <code
          key={key}
          className="bg-slate-800 [html.light_&]:bg-slate-200 text-cyan-300 [html.light_&]:text-cyan-800 px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-slate-700 [html.light_&]:border-slate-300"
        >
          {child}
        </code>
      );
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
          className="text-cyan-400 [html.light_&]:text-blue-600 underline underline-offset-4 hover:text-cyan-300 [html.light_&]:hover:text-blue-700 transition-colors"
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
  headingIds: string[];
  cursor: { index: number };
}): ReactNode {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-base md:text-[17px] leading-relaxed text-slate-200 [html.light_&]:text-slate-800 mb-6 font-normal">
          {renderInline(block.content, keyPrefix)}
        </p>
      );
    case "heading": {
      const headingId = headingIds[cursor.index];
      cursor.index += 1;
      const content = renderInline(block.content, keyPrefix);
      return block.attrs.level === 3 ? (
        <h3
          id={headingId}
          className="text-xl md:text-2xl font-bold mt-10 mb-4 text-white [html.light_&]:text-slate-900 scroll-mt-24 tracking-tight"
        >
          {content}
        </h3>
      ) : (
        <h2
          id={headingId}
          className="text-2xl md:text-3xl font-black mt-12 mb-6 text-white [html.light_&]:text-slate-900 border-b border-white/10 [html.light_&]:border-slate-200 pb-2 scroll-mt-24 tracking-tight"
        >
          {content}
        </h2>
      );
    }
    case "bulletList":
      return (
        <ul className="list-disc list-outside ml-6 mb-8 text-base md:text-[17px] leading-relaxed text-slate-200 [html.light_&]:text-slate-700 space-y-2">
          {block.content.map((item, index) => (
            <li key={`${keyPrefix}-${index}`} className="pl-2 marker:text-cyan-400 [html.light_&]:marker:text-blue-600">
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
        <ol className="list-decimal list-outside ml-6 mb-8 text-base md:text-[17px] leading-relaxed text-slate-200 [html.light_&]:text-slate-700 space-y-2 font-medium">
          {block.content.map((item, index) => (
            <li key={`${keyPrefix}-${index}`} className="pl-2 marker:text-cyan-400 [html.light_&]:marker:text-blue-600">
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
          <div className="bg-slate-800/80 [html.light_&]:bg-slate-100/90 border border-white/10 [html.light_&]:border-slate-200 rounded-r-2xl rounded-l-none pl-6 pr-4 py-4 text-lg md:text-xl font-medium italic text-slate-200 [html.light_&]:text-slate-800 shadow-sm backdrop-blur-md">
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
        <figure className="my-10 rounded-2xl overflow-hidden bg-slate-900 [html.light_&]:bg-slate-100 border border-white/10 [html.light_&]:border-slate-200 shadow-xl group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={block.attrs.alt ?? ""} loading="lazy" src={src} className="w-full h-auto object-cover block" />
          {block.attrs.alt ? (
            <figcaption className="p-3 text-center text-xs md:text-sm text-slate-400 [html.light_&]:text-slate-600 bg-slate-950/80 [html.light_&]:bg-slate-50 border-t border-white/10 [html.light_&]:border-slate-200">
              {block.attrs.alt}
            </figcaption>
          ) : null}
        </figure>
      );
    }
  }
}

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
