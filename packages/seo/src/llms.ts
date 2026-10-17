import type {
  LlmsArticleEntry,
  LlmsCategoryEntry,
  LlmsTxtOptions,
} from "@mstudio/contracts";

const DEFAULT_TITLE = "MStudio Channel";
const DEFAULT_DESCRIPTION =
  "Nền tảng báo chí & tin tức số evidence-first, chuyên sâu về Công nghệ, AI, Kinh doanh và Đời sống số với cam kết minh bạch bằng chứng, kiểm chứng đa nguồn và bảo vệ sự thật.";

function cleanOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

function cleanMarkdownLine(text: string): string {
  return text.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Standard category description fallback when not provided.
 */
function getCategoryDescription(slug: string, label: string): string {
  const map: Record<string, string> = {
    "moi-nhat": "Dòng sự kiện và tin tức mới nhất được cập nhật liên tục 24/7",
    "dang-nong": "Tiêu điểm thời sự và các chủ đề nóng đang được quan tâm",
    "danh-cho-ban": "Tuyển chọn tin tức phù hợp theo thị hiếu độc giả",
    "ai-channel": "Trí tuệ nhân tạo, LLM, Agents, Robotics và chuyển đổi số",
    "cong-nghe": "Xu hướng công nghệ, thiết bị, phần mềm và bảo mật thông tin",
    "kinh-doanh": "Kinh tế vĩ mô, thị trường tài chính, đầu tư và khởi nghiệp",
    "thoi-su": "Thời sự trong nước và quốc tế, chính sách và sự kiện xã hội",
    "the-thao": "Bóng đá, thể thao trong nước và quốc tế, nhận định thể thao",
    "giai-tri": "Văn hóa, nghệ thuật, điện ảnh, âm nhạc và phong cách sống",
    "suc-khoe": "Y học, sức khỏe thể chất, tâm lý và lời khuyên y tế",
    "giao-duc": "Giáo dục, đào tạo, tuyển sinh và kỹ năng nghề nghiệp",
    "xe": "Thị trường ô tô, xe điện, công nghệ xe và xu hướng di chuyển",
    "doi-song": "Xã hội, gia đình, tiêu dùng và phong cách sống hiện đại",
    "kham-pha": "Khoa học, vũ trụ, môi trường và những phát hiện mới",
    "goc-toi": "Phóng sự điều tra, góc khuất xã hội và cảnh báo an toàn",
  };
  return map[slug] ?? `Chuyên mục ${label}`;
}

/**
 * Sinh nội dung llms.txt tiêu chuẩn theo quy chuẩn https://llmstxt.org
 */
export function buildLlmsTxt(options: LlmsTxtOptions): string {
  const origin = cleanOrigin(options.siteOrigin);
  const title = options.siteTitle || DEFAULT_TITLE;
  const description = cleanMarkdownLine(options.siteDescription || DEFAULT_DESCRIPTION);

  const lines: string[] = [
    `# ${title}`,
    "",
    `> ${description}`,
    "",
    "## Sections",
    "",
  ];

  if (options.categories && options.categories.length > 0) {
    for (const cat of options.categories) {
      const desc = cat.description
        ? cleanMarkdownLine(cat.description)
        : getCategoryDescription(cat.slug, cat.name);
      lines.push(`- [${cat.name}](${origin}/${cat.slug}/): ${desc}`);
    }
  } else {
    lines.push(`- [Trang chủ](${origin}/): Trang chủ tin tức tổng hợp`);
  }

  lines.push("");
  lines.push("## Latest Articles");
  lines.push("");

  if (options.articles && options.articles.length > 0) {
    for (const art of options.articles) {
      const slugOrId = art.slug || art.id;
      const url = `${origin}/bai-viet/${slugOrId}`;
      const titleClean = cleanMarkdownLine(art.title);
      const summaryClean = art.summary
        ? cleanMarkdownLine(art.summary)
        : "Chi tiết bài viết và bằng chứng kiểm chứng tại liên kết.";
      lines.push(`- [${titleClean}](${url}): ${summaryClean}`);
    }
  } else {
    lines.push(`- [Tin tức mới nhất](${origin}/moi-nhat/): Danh sách bài viết được cập nhật liên tục.`);
  }

  lines.push("");
  lines.push("## Optional");
  lines.push("");
  lines.push(`- [Full LLMs Index](${origin}/llms-full.txt): Toàn văn tóm tắt chi tiết và danh mục mở rộng cho AI/LLMs`);
  lines.push(`- [RSS Feed](${origin}/feed.xml): Kênh tin tức RSS chuẩn 2.0 cập nhật thời gian thực`);
  lines.push(`- [Google News Sitemap](${origin}/sitemap-news.xml): Sitemap tin tức trong 48 giờ dành cho AI và công cụ tìm kiếm`);
  lines.push(`- [Main XML Sitemap](${origin}/sitemap.xml): Toàn bộ sơ đồ website`);

  if (options.optionalLinks && options.optionalLinks.length > 0) {
    for (const opt of options.optionalLinks) {
      const desc = opt.description ? `: ${cleanMarkdownLine(opt.description)}` : "";
      lines.push(`- [${opt.title}](${opt.url})${desc}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * Sinh nội dung llms-full.txt chi tiết (toàn văn tóm tắt, ngày đăng, chuyên mục)
 */
export function buildLlmsFullTxt(options: LlmsTxtOptions): string {
  const origin = cleanOrigin(options.siteOrigin);
  const title = options.siteTitle || DEFAULT_TITLE;
  const description = cleanMarkdownLine(options.siteDescription || DEFAULT_DESCRIPTION);

  const lines: string[] = [
    `# ${title} — Full Knowledge Index`,
    "",
    `> ${description}`,
    "",
    "## Metadata",
    "",
    `- Website: ${origin}`,
    `- Index Type: Full LLM Context and Feed Index`,
    `- Updated: ${new Date().toISOString()}`,
    `- Standard: https://llmstxt.org`,
    "",
    "## Categories & Topics",
    "",
  ];

  if (options.categories && options.categories.length > 0) {
    for (const cat of options.categories) {
      const desc = cat.description
        ? cleanMarkdownLine(cat.description)
        : getCategoryDescription(cat.slug, cat.name);
      lines.push(`### ${cat.name}`);
      lines.push(`- URL: ${origin}/${cat.slug}/`);
      lines.push(`- Mô tả: ${desc}`);
      lines.push("");
    }
  }

  lines.push("## Published Articles");
  lines.push("");

  if (options.articles && options.articles.length > 0) {
    for (const art of options.articles) {
      const slugOrId = art.slug || art.id;
      const url = `${origin}/bai-viet/${slugOrId}`;
      const titleClean = cleanMarkdownLine(art.title);
      const summaryClean = art.summary ? cleanMarkdownLine(art.summary) : "";

      lines.push(`### ${titleClean}`);
      lines.push(`- Link: ${url}`);
      if (art.categorySlug) {
        lines.push(`- Category: ${art.categorySlug}`);
      }
      if (art.updatedAt) {
        lines.push(`- Date: ${art.updatedAt}`);
      }
      if (summaryClean) {
        lines.push(`- Summary: ${summaryClean}`);
      }
      lines.push("");
    }
  } else {
    lines.push(`Danh sách bài viết đang được cập nhật.`);
    lines.push("");
  }

  lines.push("## Machine Discovery Feeds");
  lines.push("");
  lines.push(`- [Standard llms.txt](${origin}/llms.txt)`);
  lines.push(`- [RSS 2.0 Feed](${origin}/feed.xml)`);
  lines.push(`- [Google News Sitemap](${origin}/sitemap-news.xml)`);
  lines.push(`- [XML Sitemap](${origin}/sitemap.xml)`);
  lines.push("");

  return lines.join("\n");
}
