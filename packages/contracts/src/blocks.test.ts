import assert from "node:assert/strict";
import { test } from "node:test";
import type { ArticleBlock } from "./blocks.ts";
import {
  parseArticleBlocks,
  parseArticleBlocksBody,
  serializeArticleBlocks,
} from "./blocks.ts";

const sample: ArticleBlock[] = [
  { type: "paragraph", content: [{ type: "text", text: "Mở đầu bài viết." }] },
  {
    type: "heading",
    attrs: { level: 2 },
    content: [
      { type: "text", text: "Tiêu đề ", marks: [{ type: "bold" }] },
      { type: "text", text: "mục" },
    ],
  },
  {
    type: "bulletList",
    content: [
      {
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Một" }] }],
      },
    ],
  },
  {
    type: "orderedList",
    content: [
      {
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text: "A" }] }],
      },
      {
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text: "B" }] }],
      },
    ],
  },
  {
    type: "blockquote",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Trích dẫn." }] },
    ],
  },
  {
    type: "paragraph",
    content: [
      {
        type: "text",
        text: "liên kết",
        marks: [{ type: "link", attrs: { href: "https://example.com" } }],
      },
    ],
  },
  {
    type: "image",
    attrs: { src: "https://example.com/a.jpg", alt: "Ảnh minh họa" },
  },
];

test("serialize → parse round-trip giữ nguyên blocks", () => {
  const parsed = parseArticleBlocksBody(serializeArticleBlocks(sample));
  assert.ok(parsed);
  assert.deepEqual(parsed, sample);
});

test("plain text body không phải blocks → undefined (fallback render)", () => {
  assert.equal(parseArticleBlocksBody("Đoạn văn thuần, không phải JSON."), undefined);
  assert.equal(parseArticleBlocksBody("# Heading markdown"), undefined);
  assert.equal(parseArticleBlocksBody(""), undefined);
});

test("reject unknown block type thay vì silent-drop", () => {
  const value = [
    { type: "paragraph", content: [{ type: "text", text: "ok" }] },
    { type: "video", attrs: { src: "https://example.com/v.mp4" } },
  ];
  assert.equal(parseArticleBlocks(value), undefined);
});

test("heading chỉ nhận level 2 | 3", () => {
  assert.ok(
    parseArticleBlocks([
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "H3" }] },
    ]),
  );
  assert.equal(
    parseArticleBlocks([
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "H1" }] },
    ]),
    undefined,
  );
});

test("link mark thiếu href → reject", () => {
  assert.equal(
    parseArticleBlocks([
      { type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link" }] }] },
    ]),
    undefined,
  );
});

test("text node rỗng hoặc marks lạ → reject", () => {
  assert.equal(
    parseArticleBlocks([{ type: "paragraph", content: [{ type: "text", text: "" }] }]),
    undefined,
  );
  assert.equal(
    parseArticleBlocks([
      { type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "blink" }] }] },
    ]),
    undefined,
  );
});

test("image thiếu src → reject", () => {
  assert.equal(parseArticleBlocks([{ type: "image", attrs: { alt: "no src" } }]), undefined);
});

test("blockquote lồng quá sâu → reject (depth guard)", () => {
  const nested: unknown = { type: "paragraph", content: [{ type: "text", text: "dau" }] };
  let wrapper: unknown = nested;
  for (let i = 0; i < 6; i += 1) {
    wrapper = { type: "blockquote", content: [wrapper] };
  }
  assert.equal(parseArticleBlocks([wrapper]), undefined);
});

test("mảng blocks rỗng hợp lệ", () => {
  assert.deepEqual(parseArticleBlocks([]), []);
});
