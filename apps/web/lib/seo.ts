/**
 * Re-export SEO builders từ packages/seo (source of truth — contracts-first).
 * Apps/web đang build bằng npm (CI `npm ci`), không link được workspace:*
 * nên import relative; packages/seo chỉ có type-import contracts nên vite
 * build sạch. Khi web chuyển hẳn pnpm, đổi sang "@mstudio/seo".
 */
export {
  buildNewsSitemap,
  buildSitemap,
  isWithinNewsWindow,
  NEWS_WINDOW_MS,
} from "../../../packages/seo/src/sitemap.ts";
export {
  buildLlmsTxt,
  buildLlmsFullTxt,
} from "../../../packages/seo/src/llms.ts";
export type {
  SitemapEntry,
  NewsSitemapEntry,
  LlmsCategoryEntry,
  LlmsArticleEntry,
  LlmsTxtOptions,
} from "../../../packages/contracts/src/seo.ts";
export { newsArticleJsonLd } from "./seo/json-ld.ts";

/**
 * Origin canonical production (KHÔNG dùng workers.dev — workers.dev là
 * origin kỹ thuật, canonical/domain thật là custom domain).
 */
export function siteOrigin(): string {
  return (
    process.env.SITE_URL ?? "https://mstudio.minds.io.vn"
  ).replace(/\/$/, "");
}
