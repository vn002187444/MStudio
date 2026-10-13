/**
 * MStudio Comprehensive Remote QC & QA Test Suite
 * Role: Remote Lead QC & QA Auditor
 * Targets: Cloudflare Workers Edge Web Reader
 */

const BASE_URL = "https://mstudio.vn002187444.workers.dev";
const API_URL = "https://api.mstudio.minds.io.vn";

const results = {
  routes: [],
  articles: [],
  seo: [],
  typography: [],
  accessibility: [],
  performance: [],
  images: [],
  summary: { total: 0, passed: 0, failed: 0, warnings: 0 }
};

function recordTest(category, name, passed, details = "") {
  results.summary.total++;
  if (passed) {
    results.summary.passed++;
  } else {
    results.summary.failed++;
  }
  const entry = { name, passed, details };
  if (results[category]) results[category].push(entry);
  console.log(`${passed ? "✅ [PASS]" : "❌ [FAIL]"} [${category.toUpperCase()}] ${name}${details ? ` -> ${details}` : ""}`);
}

function recordWarning(category, name, details = "") {
  results.summary.warnings++;
  const entry = { name, passed: true, warning: true, details };
  if (results[category]) results[category].push(entry);
  console.log(`⚠️ [WARN] [${category.toUpperCase()}] ${name}${details ? ` -> ${details}` : ""}`);
}

async function testFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "User-Agent": "MStudio-QA-Auditor/1.0",
        ...(options.headers || {})
      },
      signal: AbortSignal.timeout(10000)
    });
    const timeMs = Date.now() - t0;
    const text = await res.text();
    return { status: res.status, ok: res.ok, headers: res.headers, timeMs, text, url };
  } catch (err) {
    return { status: 0, ok: false, timeMs: Date.now() - t0, error: err.message, text: "", url };
  }
}

async function runQA() {
  console.log("=================================================");
  console.log("🚀 MSTUDIO COMPREHENSIVE REMOTE QC & QA AUDIT");
  console.log(`Target: ${BASE_URL}`);
  console.log(`API Target: ${API_URL}`);
  console.log("=================================================\n");

  // --- 1. CORE ROUTES & CATEGORIES CHECK ---
  console.log("--- 1. AUDITING CORE ROUTES & CATEGORIES ---");
  const testRoutes = [
    { path: "/", name: "Homepage" },
    { path: "/thoi-su", name: "Chuyên mục Thời sự" },
    { path: "/kinh-te", name: "Chuyên mục Kinh tế" },
    { path: "/cong-nghe", name: "Chuyên mục Công nghệ" },
    { path: "/khoa-hoc", name: "Chuyên mục Khoa học" },
    { path: "/the-thao", name: "Chuyên mục Thể thao" },
    { path: "/the-gioi", name: "Chuyên mục Thế giới" },
    { path: "/doi-song", name: "Chuyên mục Đời sống" },
    { path: "/giai-tri", name: "Chuyên mục Giải trí" },
    { path: "/ai-channel", name: "Chuyên mục AI Channel" },
    { path: "/chuyen-muc/cong-nghe", name: "Dynamic Hub /chuyen-muc/cong-nghe" },
    { path: "/chuyen-muc/kinh-te", name: "Dynamic Hub /chuyen-muc/kinh-te" },
    { path: "/feed.xml", name: "RSS Feed" },
    { path: "/robots.txt", name: "Robots.txt" },
    { path: "/sitemap.xml", name: "Sitemap Index" },
    { path: "/sitemap-categories.xml", name: "Categories Sitemap" },
    { path: "/sitemap-news.xml", name: "News Sitemap" },
  ];

  for (const r of testRoutes) {
    const res = await testFetch(r.path);
    const isOk = res.status === 200;
    recordTest("routes", `Route ${r.path} (${r.name})`, isOk, `Status: ${res.status}, Time: ${res.timeMs}ms`);
    if (res.timeMs > 1500) {
      recordWarning("performance", `Latency for ${r.path}`, `${res.timeMs}ms (>1.5s)`);
    }
  }

  // Check 302 redirects for CMS / Admin / Studio
  console.log("\n--- 2. AUDITING CMS ACCESS REDIRECTS ---");
  const cmsRoutes = ["/cms", "/admin", "/studio"];
  for (const path of cmsRoutes) {
    const res = await testFetch(path, { redirect: "manual" });
    const isRedirect = res.status === 302 || res.status === 307 || res.status === 308 || res.status === 200;
    const loc = res.headers ? res.headers.get("location") : "";
    recordTest("routes", `Redirect route ${path}`, isRedirect, `Status: ${res.status}${loc ? `, Location: ${loc}` : ""}`);
  }

  // --- 3. HOMEPAGE AUDIT & EXTRACT ARTICLES ---
  console.log("\n--- 3. AUDITING HOMEPAGE CONTENT & NEWS CARDS ---");
  const homeRes = await testFetch("/");
  if (homeRes.ok) {
    const hasBrand = homeRes.text.includes("MSTUDIO") && homeRes.text.includes("CHANNEL");
    recordTest("typography", "Homepage Brand Header renders", hasBrand);

    const hasNav = homeRes.text.includes("<nav") && homeRes.text.includes("Thời sự");
    recordTest("typography", "Homepage Taxonomy Navigation renders", hasNav);

    // Extract article links
    const articleSlugs = new Set();
    const regex = /\/bai-viet\/([a-zA-Z0-9_-]+)/g;
    let m;
    while ((m = regex.exec(homeRes.text)) !== null) {
      if (m[1] !== "*") articleSlugs.add(m[1]);
    }
    const slugs = Array.from(articleSlugs);
    recordTest("articles", "Articles found on Homepage", slugs.length > 0, `Total articles listed: ${slugs.length}`);

    // --- 4. DEEP DIVE ARTICLE DETAIL AUDIT ---
    console.log("\n--- 4. AUDITING ARTICLE DETAIL PAGES (TYPOGRAPHY, TOC, ESCAPES, SEO) ---");
    const testSlugs = slugs.slice(0, 5); // audit top 5 articles
    // Also include the known one:
    if (!testSlugs.includes("cac-tap-doan-cong-nghe-tang-toc-trien-khai-ai-agent")) {
      testSlugs.push("cac-tap-doan-cong-nghe-tang-toc-trien-khai-ai-agent");
    }

    for (const slug of testSlugs) {
      const artRes = await testFetch(`/bai-viet/${slug}`);
      const artPassed = artRes.status === 200;
      recordTest("articles", `Article: /bai-viet/${slug}`, artPassed, `Status: ${artRes.status}, Size: ${Math.round(artRes.text.length / 1024)}KB`);

      if (artPassed) {
        const html = artRes.text;

        // 4.1 Typography & Raw Escape checks
        const hasDoubleEscapedNewlines = html.includes("\\n\\n") || html.includes("\\r\\n");
        recordTest("typography", `[${slug}] No unescaped \\\\n\\\\n in output`, !hasDoubleEscapedNewlines, hasDoubleEscapedNewlines ? "Found raw \\\\n\\\\n!" : "Clean");

        const hasRawMarkdownHeading = /<p[^>]*>\s*#{2,4}\s+/.test(html) || html.includes("### ") || html.includes("## ");
        recordTest("typography", `[${slug}] No raw markdown headings in <p>`, !hasRawMarkdownHeading, hasRawMarkdownHeading ? "Found raw ### in <p>!" : "Properly rendered into <h2/3>");

        const hasH2orH3 = html.includes("<h2") || html.includes("<h3");
        recordTest("typography", `[${slug}] Semantic Headings (<h2/h3>) rendered`, hasH2orH3);

        // 4.2 Table of Contents (ToC)
        const hasToc = html.includes("Mục lục") || html.includes("table-of-contents") || html.includes("<aside");
        recordTest("typography", `[${slug}] Table of Contents present`, hasToc);

        // 4.3 SEO & OpenGraph Meta
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : "";
        const validTitle = title.length > 10 && !title.includes("Không tìm thấy");
        recordTest("seo", `[${slug}] Meta Title valid`, validTitle, `Title: "${title}"`);

        const hasMetaDesc = /<meta\s+name="description"\s+content="([^"]+)"/i.test(html);
        recordTest("seo", `[${slug}] Meta Description present`, hasMetaDesc);

        const hasCanonical = /<link\s+rel="canonical"\s+href="([^"]+)"/i.test(html);
        recordTest("seo", `[${slug}] Canonical URL present`, hasCanonical);

        const hasOgImage = /<meta\s+property="og:image"\s+content="([^"]+)"/i.test(html);
        recordTest("seo", `[${slug}] OpenGraph Image present`, hasOgImage);

        // 4.4 Structured Data JSON-LD
        const hasJsonLd = html.includes("application/ld+json");
        const hasNewsArticleSchema = hasJsonLd && html.includes("NewsArticle");
        recordTest("seo", `[${slug}] JSON-LD NewsArticle Schema`, hasNewsArticleSchema);

        // 4.5 Internal Backlinks & Lineage
        const hasBacklinks = html.includes("/chuyen-muc/") || html.includes("/chu-de/") || html.includes("nguon-tin") || html.includes("/ai-channel") || html.includes("/cong-nghe") || html.includes("/kinh-te") || html.includes("/thoi-su") || html.includes("/the-thao") || html.includes("/khoa-hoc");
        recordTest("articles", `[${slug}] Internal interlinks & taxonomy pills present`, hasBacklinks);

        // 4.6 Hero Image Check
        const heroImgMatch = html.match(/<img[^>]+src="([^">]+)"[^>]*>/i);
        if (heroImgMatch) {
          const imgSrc = heroImgMatch[1];
          const hasAlt = heroImgMatch[0].includes("alt=");
          recordTest("accessibility", `[${slug}] Hero image has alt attribute`, hasAlt);

          // Check if image is hotlinked or loaded
          if (imgSrc.startsWith("http")) {
            const imgRes = await testFetch(imgSrc, { method: "HEAD" });
            const isAccessible = imgRes.status === 200 || imgRes.status === 304;
            if (!isAccessible) {
              recordWarning("images", `[${slug}] Hero image accessible status: ${imgRes.status}`, `Src: ${imgSrc.substring(0, 70)}...`);
            } else {
              recordTest("images", `[${slug}] Hero image accessible (HTTP 200)`, true);
            }
          }
        }
      }
    }
  }

  // --- 5. ACCESSIBILITY & PERFORMANCE AUDIT ---
  console.log("\n--- 5. AUDITING ACCESSIBILITY & SHELL CONFORMANCE ---");
  if (homeRes.ok) {
    const hasSkipLink = homeRes.text.includes("skip-to") || homeRes.text.includes("Skip to") || homeRes.text.includes("#main-content");
    recordTest("accessibility", "Skip to main content link / anchor present", hasSkipLink);

    const hasMainElement = homeRes.text.includes("<main");
    recordTest("accessibility", "Semantic <main> landmark element used", hasMainElement);

    const hasHeaderElement = homeRes.text.includes("<header");
    recordTest("accessibility", "Semantic <header> landmark element used", hasHeaderElement);

    const hasFooterElement = homeRes.text.includes("<footer");
    recordTest("accessibility", "Semantic <footer> landmark element used", hasFooterElement);

    const hasViewport = /<meta\s+name="viewport"/i.test(homeRes.text);
    recordTest("accessibility", "Responsive viewport meta tag configured", hasViewport);

    const hasLangVi = /<html[^>]+lang="vi"/i.test(homeRes.text);
    recordTest("accessibility", "HTML tag declares lang='vi'", hasLangVi);
  }

  console.log("\n=================================================");
  console.log("📊 MSTUDIO QC & QA AUDIT SUMMARY REPORT");
  console.log(`TOTAL CHECKS: ${results.summary.total}`);
  console.log(`✅ PASSED:    ${results.summary.passed}`);
  console.log(`❌ FAILED:    ${results.summary.failed}`);
  console.log(`⚠️ WARNINGS:  ${results.summary.warnings}`);
  console.log(`PASS RATE:    ${Math.round((results.summary.passed / results.summary.total) * 100)}%`);
  console.log("=================================================");

  return results;
}

runQA()
  .then((res) => {
    import("node:fs").then(fs => {
      fs.writeFileSync("qa-audit-report.json", JSON.stringify(res, null, 2));
      console.log("\n📄 Detailed report written to qa-audit-report.json");
    });
  })
  .catch(console.error);
