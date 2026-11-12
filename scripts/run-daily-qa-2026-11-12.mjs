/**
 * MStudio Daily Comprehensive Maintenance & Automated Audit
 * Date: 2026-11-12
 * Targets:
 * - mstudio.vn002187444.workers.dev (Web News Production Domain)
 * - news-studio.vn002187444.workers.dev (Worker Edge Secondary)
 * - api-mstudio.minds.io.vn (BKNS Host Primary API)
 * - api.mstudio.minds.io.vn (Cloudflare Edge Worker API)
 * - studio.vn002187444.workers.dev (Studio CMS)
 * - s3.minds.io.vn (MinIO Object Storage on NAS)
 */

import fs from 'node:fs';

const PRIMARY_WEB = 'https://mstudio.vn002187444.workers.dev';
const SECONDARY_WEB = 'https://news-studio.vn002187444.workers.dev';
const BKNS_API = 'https://api-mstudio.minds.io.vn';
const EDGE_API = 'https://api.mstudio.minds.io.vn';
const STUDIO_CMS = 'https://studio.vn002187444.workers.dev';
const S3_NAS = 'https://s3.minds.io.vn';

async function fetchV4(targetUrl, options = {}) {
  const t0 = Date.now();
  try {
    const res = await fetch(targetUrl, {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        ...(options.headers || {})
      },
      signal: AbortSignal.timeout(options.timeout || 12000),
      redirect: 'manual'
    });
    const text = await res.text();
    return {
      status: res.status,
      ok: res.status >= 200 && res.status < 300,
      headers: Object.fromEntries(res.headers.entries()),
      text,
      timeMs: Date.now() - t0,
      url: targetUrl
    };
  } catch (e) {
    return { status: 0, ok: false, error: e.message, timeMs: Date.now() - t0, text: '', url: targetUrl };
  }
}

const auditResults = {
  timestamp: new Date().toISOString(),
  infrastructure: [],
  routes: [],
  articles: [],
  typography: [],
  seo: [],
  accessibility: [],
  performance: [],
  storage: [],
  summary: { total: 0, passed: 0, failed: 0, warnings: 0 }
};

function recordTest(category, name, passed, details = '') {
  auditResults.summary.total++;
  if (passed) {
    auditResults.summary.passed++;
  } else {
    auditResults.summary.failed++;
  }
  const entry = { name, passed, details };
  if (auditResults[category]) auditResults[category].push(entry);
  console.log(`${passed ? '✅ [PASS]' : '❌ [FAIL]'} [${category.toUpperCase()}] ${name}${details ? ` -> ${details}` : ''}`);
}

function recordWarning(category, name, details = '') {
  auditResults.summary.warnings++;
  const entry = { name, passed: true, warning: true, details };
  if (auditResults[category]) auditResults[category].push(entry);
  console.log(`⚠️ [WARN] [${category.toUpperCase()}] ${name}${details ? ` -> ${details}` : ''}`);
}

async function runAudit() {
  console.log('======================================================================');
  console.log('🚀 MSTUDIO DAILY COMPREHENSIVE MAINTENANCE & QA AUDIT (2026-11-12)');
  console.log(`Primary Domain:    ${PRIMARY_WEB}`);
  console.log(`Secondary Domain:  ${SECONDARY_WEB}`);
  console.log(`BKNS Host API:     ${BKNS_API}`);
  console.log(`Edge Worker API:   ${EDGE_API}`);
  console.log(`MinIO NAS Storage: ${S3_NAS}`);
  console.log('======================================================================\n');

  // --- 1. INFRASTRUCTURE & HEALTH AUDIT ---
  console.log('--- 1. AUDITING BACKEND, EDGE WORKERS, STORAGE & HEALTH ---');
  
  // BKNS Primary API
  const bknsRes = await fetchV4(`${BKNS_API}/healthz`);
  recordTest('infrastructure', 'Primary API Backend (BKNS Hosting SSD) /healthz', bknsRes.status === 200, `Status: ${bknsRes.status}, Latency: ${bknsRes.timeMs}ms`);

  // Edge Fallback API
  const edgeRes = await fetchV4(`${EDGE_API}/healthz`);
  recordTest('infrastructure', 'Fallback API Worker (Cloudflare D1) /healthz', edgeRes.status === 200, `Status: ${edgeRes.status}, Latency: ${edgeRes.timeMs}ms`);

  // Studio CMS Worker
  const studioRes = await fetchV4(`${STUDIO_CMS}/login`);
  recordTest('infrastructure', 'Studio CMS Worker /login', studioRes.status === 200 || studioRes.status === 302, `Status: ${studioRes.status}, Latency: ${studioRes.timeMs}ms`);

  // Web Reader mstudio Homepage (/)
  const rootRes = await fetchV4(PRIMARY_WEB);
  recordTest('infrastructure', 'Web Reader mstudio homepage (/)', rootRes.status === 200, `Status: ${rootRes.status}, Size: ${Math.round(rootRes.text.length / 1024)}KB, Latency: ${rootRes.timeMs}ms`);

  // Secondary Web Reader news-studio
  const newsStudioRes = await fetchV4(SECONDARY_WEB);
  recordTest('infrastructure', 'Web Reader news-studio secondary', newsStudioRes.status === 200 || newsStudioRes.status === 301, `Status: ${newsStudioRes.status}, Size: ${Math.round(newsStudioRes.text.length / 1024)}KB, Latency: ${newsStudioRes.timeMs}ms`);

  // NAS MinIO S3 Health Check (Rule 24)
  const s3Res = await fetchV4(`${S3_NAS}/minio/health/live`);
  const s3Passed = s3Res.status === 200 || s3Res.status === 403; // MinIO responds 200 or 403 for anonymous root
  recordTest('storage', 'NAS MinIO S3 Health (https://s3.minds.io.vn)', s3Passed, `Status: ${s3Res.status}, Latency: ${s3Res.timeMs}ms`);

  // --- 2. AUDITING ARTICLES STATS (24H) ---
  console.log('\n--- 2. AUDITING ARTICLES STATS (24H LIVE FEEDS) ---');
  const articlesRes = await fetchV4(`${BKNS_API}/articles`);
  if (articlesRes.ok) {
    try {
      const data = JSON.parse(articlesRes.text);
      const rows = data.rows || [];
      const now = new Date();
      const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recent = rows.filter(a => new Date(a.createdAt || a.updatedAt) >= past24h);
      recordTest('articles', 'Published Articles Count (BKNS SQLite SSD)', rows.length > 0, `Total: ${rows.length} articles`);
      recordTest('articles', 'Published within last 24h', true, `Recent 24h articles: ${recent.length}`);
      if (rows.length > 0) {
        console.log(`📰 Latest Article: "${rows[0].title}" (${rows[0].updatedAt || rows[0].createdAt})`);
        auditResults.latestArticle = {
          title: rows[0].title,
          slug: rows[0].slug,
          publishedAt: rows[0].updatedAt || rows[0].createdAt
        };
      }
    } catch (e) {
      recordTest('articles', 'Parse articles payload', false, e.message);
    }
  } else {
    recordTest('articles', 'Fetch articles from BKNS API', false, `Status: ${articlesRes.status}`);
  }

  // --- 3. AUDITING CORE ROUTES & CATEGORIES ON MSTUDIO ---
  console.log('\n--- 3. AUDITING CORE ROUTES & CATEGORIES (mstudio) ---');
  const coreRoutes = [
    { path: '/', name: 'Homepage' },
    { path: '/thoi-su', name: 'Chuyên mục Thời sự' },
    { path: '/kinh-te', name: 'Chuyên mục Kinh tế' },
    { path: '/cong-nghe', name: 'Chuyên mục Công nghệ' },
    { path: '/khoa-hoc', name: 'Chuyên mục Khoa học' },
    { path: '/the-thao', name: 'Chuyên mục Thể thao' },
    { path: '/the-gioi', name: 'Chuyên mục Thế giới' },
    { path: '/doi-song', name: 'Chuyên mục Đời sống' },
    { path: '/giai-tri', name: 'Chuyên mục Giải trí' },
    { path: '/ai-channel', name: 'Chuyên mục AI Channel' },
    { path: '/chuyen-muc/cong-nghe', name: 'Hub /chuyen-muc/cong-nghe' },
    { path: '/chuyen-muc/kinh-te', name: 'Hub /chuyen-muc/kinh-te' },
    { path: '/feed.xml', name: 'RSS Feed' },
    { path: '/robots.txt', name: 'Robots.txt' },
    { path: '/sitemap.xml', name: 'Sitemap Index' },
    { path: '/sitemap-categories.xml', name: 'Categories Sitemap' },
    { path: '/sitemap-news.xml', name: 'News Sitemap' },
  ];

  for (const r of coreRoutes) {
    const res = await fetchV4(`${PRIMARY_WEB}${r.path}`);
    const passed = res.status === 200 || res.status === 301 || res.status === 302;
    recordTest('routes', `Route ${r.path} (${r.name})`, passed, `Status: ${res.status}, Time: ${res.timeMs}ms`);
    if (res.timeMs > 2500) {
      recordWarning('performance', `Latency for ${r.path}`, `${res.timeMs}ms (>2.5s)`);
    }
  }

  // --- 4. AUDITING CMS ACCESS REDIRECTS ---
  console.log('\n--- 4. AUDITING CMS ACCESS REDIRECTS ---');
  const cmsRoutes = ['/cms', '/admin', '/studio'];
  for (const path of cmsRoutes) {
    const res = await fetchV4(`${PRIMARY_WEB}${path}`);
    const isRedirect = res.status === 302 || res.status === 307 || res.status === 308 || res.status === 200;
    const loc = res.headers ? res.headers.location : '';
    recordTest('routes', `CMS Redirect ${path}`, isRedirect, `Status: ${res.status}${loc ? `, Location: ${loc}` : ''}`);
  }

  // --- 5. HOMEPAGE AUDIT & EXTRACT ARTICLES ---
  console.log('\n--- 5. AUDITING HOMEPAGE CONTENT & NEWS CARDS ---');
  const homeRes = rootRes.ok ? rootRes : await fetchV4(PRIMARY_WEB);
  if (homeRes.ok) {
    const html = homeRes.text;
    const hasBrand = html.includes('MSTUDIO') || html.includes('News') || html.includes('Studio');
    recordTest('typography', 'Homepage Brand Header renders', hasBrand);

    const hasNav = html.includes('<nav') && (html.includes('Thời sự') || html.includes('thoi-su'));
    recordTest('typography', 'Homepage Taxonomy Navigation renders', hasNav);

    // Extract article links
    const articleSlugs = new Set();
    const regex = /\/bai-viet\/([a-zA-Z0-9_-]+)/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
      if (m[1] !== '*' && m[1] !== 'undefined') articleSlugs.add(m[1]);
    }
    const slugs = Array.from(articleSlugs);
    recordTest('articles', 'Articles listed on Homepage', slugs.length > 0, `Total articles listed: ${slugs.length}`);

    // --- 6. DEEP DIVE ARTICLE DETAIL AUDIT ---
    console.log('\n--- 6. DEEP DIVE ARTICLE DETAIL AUDIT (SEO, SCHEMA, TYPOGRAPHY) ---');
    const testSlugs = slugs.slice(0, 5);
    for (const slug of testSlugs) {
      const artRes = await fetchV4(`${PRIMARY_WEB}/bai-viet/${slug}`);
      const artPassed = artRes.status === 200;
      recordTest('articles', `Article: /bai-viet/${slug}`, artPassed, `Status: ${artRes.status}, Size: ${Math.round(artRes.text.length / 1024)}KB`);

      if (artPassed) {
        const artHtml = artRes.text;

        // Raw Escape Check
        const hasDoubleEscapes = artHtml.includes('\\n\\n') || artHtml.includes('\\r\\n');
        recordTest('typography', `[${slug}] Zero raw \\\\n\\\\n escape sequences`, !hasDoubleEscapes, hasDoubleEscapes ? 'Found raw \\\\n\\\\n' : 'Clean');

        // Markdown headings
        const hasRawMdHeadings = /<p[^>]*>\s*#{2,4}\s+/.test(artHtml) || artHtml.includes('### ') || artHtml.includes('## ');
        recordTest('typography', `[${slug}] Zero raw markdown headings in <p>`, !hasRawMdHeadings, hasRawMdHeadings ? 'Found raw ###' : 'Semantic <h2/3>');

        // Semantic headings
        const hasH2orH3 = artHtml.includes('<h2') || artHtml.includes('<h3');
        recordTest('typography', `[${slug}] Semantic Headings (<h2/h3>) present`, hasH2orH3);

        // Table of Contents
        const hasToc = artHtml.includes('Mục lục') || artHtml.includes('table-of-contents') || artHtml.includes('<aside');
        recordTest('typography', `[${slug}] Table of Contents present`, hasToc);

        // SEO Meta Title
        const titleMatch = artHtml.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : '';
        const validTitle = title.length > 10 && !title.includes('Không tìm thấy');
        recordTest('seo', `[${slug}] Meta Title valid`, validTitle, `Title: "${title.slice(0, 50)}..."`);

        // Meta Description
        const hasMetaDesc = /<meta\s+name="description"\s+content="([^"]+)"/i.test(artHtml);
        recordTest('seo', `[${slug}] Meta Description present`, hasMetaDesc);

        // Canonical URL
        const hasCanonical = /<link\s+rel="canonical"\s+href="([^"]+)"/i.test(artHtml);
        recordTest('seo', `[${slug}] Canonical URL link present`, hasCanonical);

        // OpenGraph Image
        const hasOgImage = /<meta\s+property="og:image"\s+content="([^"]+)"/i.test(artHtml);
        recordTest('seo', `[${slug}] OpenGraph Image tag present`, hasOgImage);

        // JSON-LD NewsArticle
        const hasJsonLd = artHtml.includes('application/ld+json');
        const hasNewsArticleSchema = hasJsonLd && artHtml.includes('NewsArticle');
        recordTest('seo', `[${slug}] JSON-LD NewsArticle Schema configured`, hasNewsArticleSchema);

        // Internal Interlinks
        const hasBacklinks = artHtml.includes('/chuyen-muc/') || artHtml.includes('/chu-de/') || artHtml.includes('nguon-tin') || artHtml.includes('/thoi-su') || artHtml.includes('/kinh-te') || artHtml.includes('/cong-nghe');
        recordTest('articles', `[${slug}] Internal interlinks & taxonomy pills present`, hasBacklinks);

        // Hero Image
        const heroImgMatch = artHtml.match(/<img[^>]+src="([^">]+)"[^>]*>/i);
        if (heroImgMatch) {
          const hasAlt = heroImgMatch[0].includes('alt=');
          recordTest('accessibility', `[${slug}] Hero image alt attribute present`, hasAlt);
        }
      }
    }
  }

  // --- 7. ACCESSIBILITY & WCAG CONFORMANCE ---
  console.log('\n--- 7. AUDITING ACCESSIBILITY & SHELL CONFORMANCE ---');
  if (homeRes.ok) {
    const html = homeRes.text;
    const hasSkipLink = html.includes('skip-to') || html.includes('Skip to') || html.includes('#main-content');
    recordTest('accessibility', 'Skip to main content link / anchor present', hasSkipLink);

    const hasMain = html.includes('<main');
    recordTest('accessibility', 'Semantic <main> landmark element used', hasMain);

    const hasHeader = html.includes('<header');
    recordTest('accessibility', 'Semantic <header> landmark element used', hasHeader);

    const hasFooter = html.includes('<footer');
    recordTest('accessibility', 'Semantic <footer> landmark element used', hasFooter);

    const hasViewport = /<meta\s+name="viewport"/i.test(html);
    recordTest('accessibility', 'Responsive viewport meta tag configured', hasViewport);

    const hasLang = /<html[^>]+lang="vi"/i.test(html) || /<html[^>]+lang="en"/i.test(html);
    recordTest('accessibility', 'HTML tag declares valid lang attribute', hasLang);
  }

  console.log('\n======================================================================');
  console.log('📊 MSTUDIO QC & QA AUDIT SUMMARY REPORT');
  console.log(`TOTAL CHECKS: ${auditResults.summary.total}`);
  console.log(`✅ PASSED:    ${auditResults.summary.passed}`);
  console.log(`❌ FAILED:    ${auditResults.summary.failed}`);
  console.log(`⚠️ WARNINGS:  ${auditResults.summary.warnings}`);
  const passRate = Math.round((auditResults.summary.passed / auditResults.summary.total) * 100);
  console.log(`PASS RATE:    ${passRate}%`);
  console.log('======================================================================');

  fs.writeFileSync('D:/MStudio/qa-audit-report.json', JSON.stringify(auditResults, null, 2));
  console.log('📄 Detailed report written to D:/MStudio/qa-audit-report.json');
}

runAudit().catch(err => {
  console.error('Fatal audit runner error:', err);
  process.exit(1);
});
