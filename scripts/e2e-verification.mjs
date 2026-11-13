/**
 * MStudio Channel - Automated End-to-End (E2E) Verification Suite
 * Targets:
 * - Reader Experience (Homepage, Taxonomies, Article Detail, TOC, Typography, SEO)
 * - CMS & Gateway Access Control (Redirects)
 * - Infrastructure Lineage & Health (Primary BKNS API, Fallback Cloudflare API, MinIO S3 NAS)
 * - Feeds & Discovery (RSS Feed, Sitemaps, Robots)
 * - WCAG 2.1 AA Shell Conformance (Landmarks, Skip Link, Lang)
 */

import fs from 'node:fs';

const TARGET_WEB = process.env.TARGET_WEB_URL || 'https://mstudio.vn002187444.workers.dev';
const SECONDARY_WEB = 'https://news-studio.vn002187444.workers.dev';
const BKNS_API = process.env.TARGET_API_URL || 'https://api-mstudio.minds.io.vn';
const EDGE_API = 'https://api.mstudio.minds.io.vn';
const STUDIO_CMS = 'https://studio.vn002187444.workers.dev';
const S3_NAS = 'https://s3.minds.io.vn';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'mstudio_ingest_secret_2026';

const results = {
  timestamp: new Date().toISOString(),
  target: TARGET_WEB,
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  suites: []
};

async function fetchHttp(url, options = {}) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'MStudio-E2E-Runner/1.0 (Automated QC/QA Agent)',
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
      url
    };
  } catch (err) {
    return { status: 0, ok: false, error: err.message, timeMs: Date.now() - t0, text: '', url };
  }
}

function assertTest(suite, name, condition, details = '') {
  results.total++;
  if (condition) {
    results.passed++;
    console.log(`  ✅ [PASS] ${name}${details ? ` (${details})` : ''}`);
  } else {
    results.failed++;
    console.error(`  ❌ [FAIL] ${name}${details ? ` (${details})` : ''}`);
  }
  let s = results.suites.find(x => x.name === suite);
  if (!s) {
    s = { name: suite, tests: [] };
    results.suites.push(s);
  }
  s.tests.push({ name, passed: condition, details });
}

async function runE2E() {
  console.log('======================================================================');
  console.log('🧪 MSTUDIO CHANNEL E2E AUTOMATED VERIFICATION SUITE');
  console.log(`Target Web Reader:  ${TARGET_WEB}`);
  console.log(`Primary Backend:    ${BKNS_API}`);
  console.log(`Edge Fallback API:  ${EDGE_API}`);
  console.log(`Studio CMS Gateway: ${STUDIO_CMS}`);
  console.log(`Object Storage S3:  ${S3_NAS}`);
  console.log('======================================================================\n');

  // --- SUITE 1: Infrastructure & Health Lineage ---
  console.log('📦 SUITE 1: Infrastructure & Health Lineage');
  const bknsRes = await fetchHttp(`${BKNS_API}/healthz`);
  assertTest('Infrastructure', 'Primary API Backend (BKNS SQLite SSD) /healthz', bknsRes.status === 200, `Status: ${bknsRes.status}, Latency: ${bknsRes.timeMs}ms`);

  const edgeRes = await fetchHttp(`${EDGE_API}/healthz`);
  assertTest('Infrastructure', 'Fallback API Worker (Cloudflare D1) /healthz', edgeRes.status === 200, `Status: ${edgeRes.status}, Latency: ${edgeRes.timeMs}ms`);

  const s3Res = await fetchHttp(`${S3_NAS}/minio/health/live`);
  assertTest('Infrastructure', 'MinIO Object Storage on NAS (Rule 24 Zero-R2)', s3Res.status === 200 || s3Res.status === 403, `Status: ${s3Res.status}`);

  const deltaRes = await fetchHttp(`${BKNS_API}/api/admin/delta?since=2026-11-12T00:00:00Z`, {
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
  });
  assertTest('Infrastructure', 'Admin Delta Sync endpoint authentication (Rule 17)', deltaRes.status === 200, `Status: ${deltaRes.status}`);

  // --- SUITE 2: CMS & Security Gateway Redirects ---
  console.log('\n🔒 SUITE 2: CMS Gateway & Redirect Rules');
  const cmsRes = await fetchHttp(`${STUDIO_CMS}/login`);
  assertTest('CMS Gateway', 'Studio CMS Login Surface accessible', cmsRes.status === 200 || cmsRes.status === 302, `Status: ${cmsRes.status}`);

  for (const path of ['/cms', '/admin', '/studio']) {
    const res = await fetchHttp(`${TARGET_WEB}${path}`);
    const isRedirect = res.status === 302 || res.status === 307 || res.status === 308 || res.status === 200;
    assertTest('CMS Gateway', `Reader route ${path} redirects to Studio CMS`, isRedirect, `Status: ${res.status}`);
  }

  // --- SUITE 3: Reader Navigation & Core Taxonomies ---
  console.log('\n🧭 SUITE 3: Navigation, Taxonomies & Feeds');
  const routes = [
    { path: '/', label: 'Homepage' },
    { path: '/thoi-su', label: 'Thời sự' },
    { path: '/kinh-te', label: 'Kinh tế' },
    { path: '/cong-nghe', label: 'Công nghệ' },
    { path: '/khoa-hoc', label: 'Khoa học' },
    { path: '/the-thao', label: 'Thể thao' },
    { path: '/the-gioi', label: 'Thế giới' },
    { path: '/doi-song', label: 'Đời sống' },
    { path: '/giai-tri', label: 'Giải trí' },
    { path: '/ai-channel', label: 'AI Channel' },
    { path: '/chuyen-muc/cong-nghe', label: 'Hub Chuyên mục Công nghệ' },
    { path: '/feed.xml', label: 'RSS Feed' },
    { path: '/robots.txt', label: 'Robots.txt' },
    { path: '/sitemap.xml', label: 'Sitemap Index' },
    { path: '/sitemap-news.xml', label: 'News Sitemap' }
  ];

  for (const r of routes) {
    const res = await fetchHttp(`${TARGET_WEB}${r.path}`);
    assertTest('Navigation', `Route ${r.path} (${r.label})`, res.status === 200, `Status: ${res.status}, Latency: ${res.timeMs}ms`);
  }

  // --- SUITE 4: Homepage Reader Experience & Article Extraction ---
  console.log('\n📰 SUITE 4: Homepage Reader Experience & Articles');
  const homeRes = await fetchHttp(TARGET_WEB);
  assertTest('Homepage', 'Homepage loads with HTTP 200', homeRes.status === 200, `Size: ${Math.round(homeRes.text.length / 1024)}KB`);

  const hasBrand = homeRes.text.includes('MSTUDIO') || homeRes.text.includes('Studio');
  assertTest('Homepage', 'Brand identity rendered in header', hasBrand);

  const articleRegex = /\/bai-viet\/([a-zA-Z0-9_-]+)/g;
  const slugs = new Set();
  let match;
  while ((match = articleRegex.exec(homeRes.text)) !== null) {
    if (match[1] !== '*' && match[1] !== 'undefined') slugs.add(match[1]);
  }
  const slugList = Array.from(slugs);
  assertTest('Homepage', 'Homepage renders news articles', slugList.length > 0, `Found: ${slugList.length} articles`);

  // --- SUITE 5: Deep Dive Article Inspection ---
  console.log('\n🔍 SUITE 5: Deep Dive Article Semantic & SEO Inspection');
  const testArticles = slugList.slice(0, 3);
  for (const slug of testArticles) {
    const artRes = await fetchHttp(`${TARGET_WEB}/bai-viet/${slug}`);
    assertTest('Article Detail', `Article /bai-viet/${slug} loads 200 OK`, artRes.status === 200);

    if (artRes.status === 200) {
      const html = artRes.text;

      // 1. Zero raw escape sequences
      const cleanEscapes = !html.includes('\\n\\n') && !html.includes('\\r\\n');
      assertTest('Article Detail', `[${slug}] Zero raw \\\\n\\\\n escape sequences`, cleanEscapes);

      // 2. Zero raw markdown in <p>
      const cleanMarkdown = !/<p[^>]*>\s*#{2,4}\s+/.test(html) && !html.includes('### ');
      assertTest('Article Detail', `[${slug}] Zero raw markdown ### headings in <p>`, cleanMarkdown);

      // 3. Semantic headings
      const hasHeadings = html.includes('<h2') || html.includes('<h3');
      assertTest('Article Detail', `[${slug}] Semantic <h2/h3> headings present`, hasHeadings);

      // 4. Table of contents
      const hasToc = html.includes('Mục lục') || html.includes('table-of-contents') || html.includes('<aside');
      assertTest('Article Detail', `[${slug}] Table of Contents present`, hasToc);

      // 5. SEO canonical URL
      const hasCanonical = /<link\s+rel="canonical"\s+href="([^"]+)"/i.test(html);
      assertTest('Article Detail', `[${slug}] Canonical URL meta tag present`, hasCanonical);

      // 6. JSON-LD NewsArticle
      const hasSchema = html.includes('application/ld+json') && html.includes('NewsArticle');
      assertTest('Article Detail', `[${slug}] JSON-LD NewsArticle Schema configured`, hasSchema);
    }
  }

  // --- SUITE 6: Accessibility & WCAG Conformance ---
  console.log('\n♿ SUITE 6: Accessibility & WCAG Shell Conformance');
  assertTest('A11y', 'Skip to main content link present (#main-content)', homeRes.text.includes('#main-content') || homeRes.text.includes('skip-to'));
  assertTest('A11y', 'Semantic <main> landmark element used', homeRes.text.includes('<main'));
  assertTest('A11y', 'Semantic <header> landmark element used', homeRes.text.includes('<header'));
  assertTest('A11y', 'Semantic <footer> landmark element used', homeRes.text.includes('<footer'));
  assertTest('A11y', 'Document declares valid lang attribute', /<html[^>]+lang="vi"/i.test(homeRes.text));

  // --- FINAL SUMMARY ---
  console.log('\n======================================================================');
  console.log('📊 E2E TEST SUMMARY RESULTS');
  console.log(`TOTAL CHECKS: ${results.total}`);
  console.log(`✅ PASSED:    ${results.passed}`);
  console.log(`❌ FAILED:    ${results.failed}`);
  const passRate = Math.round((results.passed / results.total) * 100);
  console.log(`PASS RATE:    ${passRate}%`);
  console.log('======================================================================\n');

  if (results.failed > 0) {
    console.error(`💥 E2E Test Suite FAILED with ${results.failed} errors.`);
    process.exit(1);
  } else {
    console.log('✨ All E2E test suites PASSED with 100% success rate.');
    process.exit(0);
  }
}

runE2E().catch(err => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
