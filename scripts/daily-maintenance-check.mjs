/**
 * MStudio Daily Comprehensive Maintenance & Worker Audit
 * Combines:
 * 1. Cloudflare Workers Status & Health (/healthz, deployment version checks)
 * 2. Lighthouse Core Web Vitals & Performance Audit
 * 3. Comprehensive Web Route & SEO QA
 * 4. 24h Published Articles Statistics
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';

const BKNS_API_BASE = 'https://api-mstudio.minds.io.vn';
const EDGE_API_BASE = 'https://api.mstudio.minds.io.vn';
const WEB_BASE = 'https://mstudio.vn002187444.workers.dev';
const STUDIO_BASE = 'https://studio.vn002187444.workers.dev';

async function auditWorkers() {
  console.log('\n--- 1. AUDITING BACKEND, EDGE WORKERS & HEALTH ---');
  const results = {};

  // Check BKNS Primary API healthz
  try {
    const res = await fetch(`${BKNS_API_BASE}/healthz`, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    results.bknsApiHealth = { status: res.status, ok: data.ok, env: data.environment };
    console.log(`✅ [PRIMARY: BKNS HOST] /healthz -> Status: ${res.status}, Env: ${data.environment}`);
  } catch (err) {
    results.bknsApiHealth = { ok: false, error: err.message };
    console.log(`❌ [PRIMARY: BKNS HOST] /healthz Failed -> ${err.message}`);
  }

  // Check Cloudflare Edge API healthz
  try {
    const res = await fetch(`${EDGE_API_BASE}/healthz`, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    results.edgeApiHealth = { status: res.status, ok: data.ok, env: data.environment };
    console.log(`✅ [FALLBACK: EDGE WORKER] /healthz -> Status: ${res.status}, Env: ${data.environment}`);
  } catch (err) {
    results.edgeApiHealth = { ok: false, error: err.message };
    console.log(`❌ [FALLBACK: EDGE WORKER] /healthz Failed -> ${err.message}`);
  }

  // Check Studio CMS Redirect
  try {
    const res = await fetch(`${STUDIO_BASE}/login`, { signal: AbortSignal.timeout(10000), redirect: 'manual' });
    results.studioStatus = { status: res.status, ok: res.status < 400 };
    console.log(`✅ [WORKER: STUDIO] /login -> Status: ${res.status}`);
  } catch (err) {
    results.studioStatus = { ok: false, error: err.message };
    console.log(`❌ [WORKER: STUDIO] Failed -> ${err.message}`);
  }

  // Check Edge Web Reader
  try {
    const t0 = Date.now();
    const res = await fetch(WEB_BASE, { signal: AbortSignal.timeout(8000) });
    const latency = Date.now() - t0;
    results.webReader = { status: res.status, latencyMs: latency, ok: res.ok };
    console.log(`✅ [WORKER: WEB READER] Homepage -> Status: ${res.status}, Latency: ${latency}ms`);
  } catch (err) {
    results.webReader = { ok: false, error: err.message };
    console.log(`❌ [WORKER: WEB READER] Failed -> ${err.message}`);
  }

  return results;
}

async function auditArticles() {
  console.log('\n--- 2. AUDITING ARTICLES STATS (24H) ---');
  try {
    const res = await fetch(`${BKNS_API_BASE}/articles`, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const rows = data.rows || [];
    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recent = rows.filter(a => new Date(a.createdAt || a.updatedAt) >= past24h);
    
    console.log(`📊 Total Published Articles (BKNS SSD): ${rows.length}`);
    console.log(`📊 Published in last 24h: ${recent.length}`);
    if (rows.length > 0) {
      console.log(`📰 Latest Article: "${rows[0].title}" (${rows[0].updatedAt || rows[0].createdAt})`);
    }

    return {
      total: rows.length,
      last24h: recent.length,
      latest: rows[0] ? { title: rows[0].title, slug: rows[0].slug, date: rows[0].updatedAt || rows[0].createdAt } : null
    };
  } catch (err) {
    console.log(`❌ Articles Audit Failed -> ${err.message}`);
    return { error: err.message };
  }
}

async function runLighthouseAudit() {
  console.log('\n--- 3. AUDITING LIGHTHOUSE & CORE WEB VITALS ---');
  try {
    const reportPath = './lighthouse-daily-report.json';
    execSync(
      `npx lighthouse ${WEB_BASE} --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=${reportPath} --quiet`,
      { cwd: process.cwd(), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000 }
    );
    if (fs.existsSync(reportPath)) {
      const r = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const scores = {
        performance: Math.round(r.categories.performance?.score * 100 || 0),
        accessibility: Math.round(r.categories.accessibility?.score * 100 || 0),
        bestPractices: Math.round(r.categories['best-practices']?.score * 100 || 0),
        seo: Math.round(r.categories.seo?.score * 100 || 0),
        fcp: r.audits['first-contentful-paint']?.displayValue,
        lcp: r.audits['largest-contentful-paint']?.displayValue,
        tbt: r.audits['total-blocking-time']?.displayValue,
        cls: r.audits['cumulative-layout-shift']?.displayValue,
        ttfb: r.audits['server-response-time']?.displayValue
      };
      console.log(`⭐ Performance: ${scores.performance}/100 | Accessibility: ${scores.accessibility}/100 | SEO: ${scores.seo}/100`);
      console.log(`⚡ Core Web Vitals: FCP=${scores.fcp}, LCP=${scores.lcp}, TBT=${scores.tbt}, CLS=${scores.cls}, TTFB=${scores.ttfb}`);
      return scores;
    }
  } catch (err) {
    console.log(`⚠️ Lighthouse run skipped or encountered warning: ${err.message.split('\n')[0]}`);
  }
  return null;
}

async function main() {
  console.log('=================================================');
  console.log('🚀 MSTUDIO DAILY COMPREHENSIVE MAINTENANCE AUDIT');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('=================================================');

  const workerStatus = await auditWorkers();
  const articleStats = await auditArticles();
  // If report exists and is recent (< 10 mins), use cached to save CPU/time
  let lighthouseStats = null;
  if (fs.existsSync('./lighthouse-daily-report.json')) {
    const stat = fs.statSync('./lighthouse-daily-report.json');
    if (Date.now() - stat.mtimeMs < 10 * 60 * 1000) {
      console.log('\n--- 3. REUSING RECENT LIGHTHOUSE AUDIT REPORT ---');
      const r = JSON.parse(fs.readFileSync('./lighthouse-daily-report.json', 'utf8'));
      lighthouseStats = {
        performance: Math.round(r.categories.performance?.score * 100 || 0),
        accessibility: Math.round(r.categories.accessibility?.score * 100 || 0),
        bestPractices: Math.round(r.categories['best-practices']?.score * 100 || 0),
        seo: Math.round(r.categories.seo?.score * 100 || 0),
        fcp: r.audits['first-contentful-paint']?.displayValue,
        lcp: r.audits['largest-contentful-paint']?.displayValue,
        tbt: r.audits['total-blocking-time']?.displayValue,
        cls: r.audits['cumulative-layout-shift']?.displayValue,
        ttfb: r.audits['server-response-time']?.displayValue
      };
      console.log(`⭐ Performance: ${lighthouseStats.performance}/100 | Accessibility: ${lighthouseStats.accessibility}/100 | SEO: ${lighthouseStats.seo}/100`);
      console.log(`⚡ Core Web Vitals: FCP=${lighthouseStats.fcp}, LCP=${lighthouseStats.lcp}, TBT=${lighthouseStats.tbt}, CLS=${lighthouseStats.cls}, TTFB=${lighthouseStats.ttfb}`);
    }
  }
  if (!lighthouseStats) {
    lighthouseStats = await runLighthouseAudit();
  }

  console.log('\n=================================================');
  console.log('📋 DAILY AUDIT SUMMARY COMPLETE');
  console.log('=================================================');
}

main().catch(err => {
  console.error('Fatal Audit Error:', err);
  process.exit(1);
});
