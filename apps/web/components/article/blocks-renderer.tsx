/**
 * Blocks renderer (FU-05) — render ArticleBlock[] (packages/contracts)
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
      return <strong key={key}>{child}</strong>;
    case "italic":
      return <em key={key}>{child}</em>;
    case "strike":
      return <s key={key}>{child}</s>;
    case "code":
      return <code key={key}>{child}</code>;
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
      return <p>{renderInline(block.content, keyPrefix)}</p>;
    case "heading": {
      const headingId = headingIds[cursor.index];
      cursor.index += 1;
      const content = renderInline(block.content, keyPrefix);
      return block.attrs.level === 3 ? (
        <h3 id={headingId}>{content}</h3>
      ) : (
        <h2 id={headingId}>{content}</h2>
      );
    }
    case "bulletList":
      return (
        <ul>
          {block.content.map((item, index) => (
            <li key={`${keyPrefix}-${index}`}>
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
        <ol>
          {block.content.map((item, index) => (
            <li key={`${keyPrefix}-${index}`}>
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
        <blockquote>
          {block.content.map((child, index) => (
            <BlockView
              block={child}
              cursor={cursor}
              headingIds={headingIds}
              key={`${keyPrefix}-${index}`}
              keyPrefix={`${keyPrefix}-${index}`}
            />
          ))}
        </blockquote>
      );
    case "image": {
      const src = safeUrl(block.attrs.src);
      if (!src) return null;
      return (
        <figure>
          <img alt={block.attrs.alt ?? ""} loading="lazy" src={src} />
          {block.attrs.alt ? <figcaption>{block.attrs.alt}</figcaption> : null}
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
    <div className="article-blocks">
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
