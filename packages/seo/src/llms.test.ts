import assert from "node:assert/strict";
import { test } from "node:test";
import { buildLlmsFullTxt, buildLlmsTxt } from "./llms.ts";

test("buildLlmsTxt produces standard llms.txt markdown", () => {
  const result = buildLlmsTxt({
    siteOrigin: "https://mstudio.minds.io.vn",
    siteTitle: "MStudio Channel",
    categories: [
      { slug: "ai-channel", name: "AI Channel", description: "Trí tuệ nhân tạo và LLMs" },
      { slug: "cong-nghe", name: "Công nghệ" },
    ],
    articles: [
      {
        id: "art-1",
        slug: "ai-breakthrough-2026",
        title: "Đột phá mới trong mô hình AI 2026",
        summary: "Các mô hình ngôn ngữ lớn đạt cột mốc mới về khả năng suy luận logic.",
        categorySlug: "ai-channel",
        updatedAt: "2026-10-17T12:00:00Z",
      },
    ],
  });

  assert.match(result, /^# MStudio Channel/);
  assert.match(result, /> Nền tảng báo chí/);
  assert.match(result, /## Sections/);
  assert.match(result, /- \[AI Channel\]\(https:\/\/mstudio\.minds\.io\.vn\/ai-channel\/\): Trí tuệ nhân tạo và LLMs/);
  assert.match(result, /- \[Công nghệ\]\(https:\/\/mstudio\.minds\.io\.vn\/cong-nghe\/\):/);
  assert.match(result, /## Latest Articles/);
  assert.match(result, /- \[Đột phá mới trong mô hình AI 2026\]\(https:\/\/mstudio\.minds\.io\.vn\/bai-viet\/ai-breakthrough-2026\): Các mô hình ngôn ngữ lớn/);
  assert.match(result, /## Optional/);
  assert.match(result, /https:\/\/mstudio\.minds\.io\.vn\/llms-full\.txt/);
  assert.match(result, /https:\/\/mstudio\.minds\.io\.vn\/feed\.xml/);
});

test("buildLlmsTxt handles empty lists gracefully", () => {
  const result = buildLlmsTxt({
    siteOrigin: "https://mstudio.minds.io.vn/",
  });

  assert.match(result, /^# MStudio Channel/);
  assert.match(result, /## Sections/);
  assert.match(result, /## Latest Articles/);
  assert.match(result, /## Optional/);
});

test("buildLlmsFullTxt outputs detailed knowledge index", () => {
  const result = buildLlmsFullTxt({
    siteOrigin: "https://mstudio.minds.io.vn",
    categories: [
      { slug: "ai-channel", name: "AI Channel", description: "Trí tuệ nhân tạo" },
    ],
    articles: [
      {
        id: "art-1",
        slug: "test-slug",
        title: "Test Title",
        summary: "Test summary description.",
        categorySlug: "ai-channel",
        updatedAt: "2026-10-17T10:00:00Z",
      },
    ],
  });

  assert.match(result, /^# MStudio Channel — Full Knowledge Index/);
  assert.match(result, /## Metadata/);
  assert.match(result, /## Categories & Topics/);
  assert.match(result, /### AI Channel/);
  assert.match(result, /## Published Articles/);
  assert.match(result, /### Test Title/);
  assert.match(result, /- Link: https:\/\/mstudio\.minds\.io\.vn\/bai-viet\/test-slug/);
  assert.match(result, /- Category: ai-channel/);
  assert.match(result, /## Machine Discovery Feeds/);
});
