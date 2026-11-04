/**
 * MStudio Daily BKNS -> Cloudflare D1 Delta Synchronizer
 * Syncs newly ingested articles, stories, and revisions from BKNS host to Cloudflare D1.
 * Runs once a day via GitHub Actions or on-demand via CLI.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Helper to escape SQL single quotes
function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

function getCfToken() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  // Local wrangler token fallback
  const wranglerPath = path.join(os.homedir(), 'AppData', 'Roaming', 'xdg.config', '.wrangler', 'config', 'default.toml');
  if (fs.existsSync(wranglerPath)) {
    const content = fs.readFileSync(wranglerPath, 'utf-8');
    const match = /oauth_token\s*=\s*"([^"]+)"/.exec(content);
    if (match) return match[1];
  }
  return null;
}

const CF_TOKEN = getCfToken();
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '9db1a9ece3ede791fd3cfb5d13bd6765';
const CF_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '6cef0de8-cd16-4494-a809-d1d177be002e';
const BKNS_API_URL = process.env.BKNS_API_URL || 'https://api-mstudio.minds.io.vn';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'mstudio_ingest_secret_2026';

if (!CF_TOKEN) {
  console.error('[Sync Error] Missing CLOUDFLARE_API_TOKEN. Please set it in env.');
  process.exit(1);
}

async function queryD1(sql) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 API HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(`D1 Execution Error: ${JSON.stringify(data.errors)}`);
  }
  return data.result;
}

export async function runD1Sync() {
  console.log(`[D1 Sync] Starting Daily Backup Sync at ${new Date().toISOString()}`);

  // 1. Check current state in Cloudflare D1
  const d1Stats = await queryD1('SELECT MAX(created_at) as max_date, COUNT(*) as total FROM articles');
  const d1MaxDate = d1Stats[0]?.results[0]?.max_date || '1970-01-01T00:00:00.000Z';
  const d1Total = d1Stats[0]?.results[0]?.total || 0;

  console.log(`[D1 Sync] Current D1 articles: ${d1Total} (Latest created_at: ${d1MaxDate})`);

  // 2. Fetch delta from BKNS API
  const deltaUrl = `${BKNS_API_URL}/api/admin/delta?since=${encodeURIComponent(d1MaxDate)}&limit=500&token=${encodeURIComponent(ADMIN_TOKEN)}`;
  console.log(`[D1 Sync] Fetching delta from BKNS: ${deltaUrl.replace(ADMIN_TOKEN, '***')}`);

  let delta;
  try {
    const res = await fetch(deltaUrl, {
      headers: { 'User-Agent': 'MStudio-D1-Sync/1.0' }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from BKNS API: ${await res.text()}`);
    }
    delta = await res.json();
  } catch (err) {
    // If BKNS API hasn't deployed the /api/admin/delta endpoint yet, fallback to reading local SQLite if available
    console.warn(`[D1 Sync] Remote delta failed (${err.message}), checking local SQLite fallback...`);
    const localDbPath = path.resolve('deploy', 'bkns-api', 'data', 'mstudio.db');
    if (fs.existsSync(localDbPath)) {
      const { DatabaseSync } = await import('node:sqlite');
      const db = new DatabaseSync(localDbPath);
      const articles = db.prepare('SELECT * FROM articles WHERE created_at > ? ORDER BY created_at ASC LIMIT 500').all(d1MaxDate);
      const storyIds = [...new Set(articles.map(a => a.story_id).filter(Boolean))];
      const articleIds = articles.map(a => a.id);

      let stories = [];
      if (storyIds.length > 0) {
        const ph = storyIds.map(() => '?').join(',');
        stories = db.prepare(`SELECT * FROM stories WHERE id IN (${ph})`).all(...storyIds);
      }
      let revisions = [];
      if (articleIds.length > 0) {
        const ph = articleIds.map(() => '?').join(',');
        revisions = db.prepare(`SELECT * FROM article_revisions WHERE article_id IN (${ph})`).all(...articleIds);
      }
      delta = { ok: true, count: articles.length, articles, stories, revisions };
      console.log(`[D1 Sync] Loaded ${articles.length} delta articles from local SQLite.`);
    } else {
      throw err;
    }
  }

  const { articles = [], stories = [], revisions = [] } = delta;

  if (articles.length === 0) {
    console.log('[D1 Sync] D1 is already 100% in sync with BKNS! No write operations needed (saved quota).');
    return {
      syncedArticles: 0,
      d1Total,
      status: 'UP_TO_DATE'
    };
  }

  console.log(`[D1 Sync] Found ${articles.length} new articles, ${stories.length} stories, ${revisions.length} revisions to sync.`);

  // 3. Build SQL statements
  const statements = [];

  for (const s of stories) {
    statements.push(
      `INSERT OR IGNORE INTO stories (id, title, summary, status, created_at, updated_at) VALUES (${sqlEscape(s.id)}, ${sqlEscape(s.title)}, ${sqlEscape(s.summary)}, ${sqlEscape(s.status || 'published')}, ${sqlEscape(s.created_at)}, ${sqlEscape(s.updated_at)});`
    );
  }

  for (const a of articles) {
    statements.push(
      `INSERT OR REPLACE INTO articles (
        id, story_id, status, current_revision_id, published_revision_id, publish_key,
        created_at, updated_at, slug, category_slug, hero_image_url, video_url,
        meta_title, meta_description, canonical_url, og_image_url, keywords,
        source_count, quality_score, is_breaking, is_trending
      ) VALUES (
        ${sqlEscape(a.id)}, ${sqlEscape(a.story_id)}, ${sqlEscape(a.status)}, ${sqlEscape(a.current_revision_id)}, ${sqlEscape(a.published_revision_id)}, ${sqlEscape(a.publish_key)},
        ${sqlEscape(a.created_at)}, ${sqlEscape(a.updated_at)}, ${sqlEscape(a.slug)}, ${sqlEscape(a.category_slug)}, ${sqlEscape(a.hero_image_url)}, ${sqlEscape(a.video_url)},
        ${sqlEscape(a.meta_title)}, ${sqlEscape(a.meta_description)}, ${sqlEscape(a.canonical_url)}, ${sqlEscape(a.og_image_url)}, ${sqlEscape(a.keywords)},
        ${a.source_count || 1}, ${a.quality_score || 90}, ${a.is_breaking || 0}, ${a.is_trending || 0}
      );`
    );
  }

  for (const r of revisions) {
    statements.push(
      `INSERT OR REPLACE INTO article_revisions (
        id, article_id, revision_number, title, body, summary, created_at
      ) VALUES (
        ${sqlEscape(r.id)}, ${sqlEscape(r.article_id)}, ${r.revision_number || 1}, ${sqlEscape(r.title)}, ${sqlEscape(r.body)}, ${sqlEscape(r.summary)}, ${sqlEscape(r.created_at)}
      );`
    );
  }

  // 4. Batch send to D1 (chunks of 30 statements per HTTP call)
  const CHUNK_SIZE = 30;
  console.log(`[D1 Sync] Executing ${statements.length} SQL operations in batches of ${CHUNK_SIZE}...`);

  for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
    const chunk = statements.slice(i, i + CHUNK_SIZE);
    const batchSql = chunk.join('\n');
    await queryD1(batchSql);
    process.stdout.write(`  Synced statements ${i + 1} to ${Math.min(i + CHUNK_SIZE, statements.length)} / ${statements.length}\r`);
  }
  console.log('\n[D1 Sync] Batch execution completed successfully.');

  // 5. Verify final count in D1
  const updatedStats = await queryD1('SELECT MAX(created_at) as max_date, COUNT(*) as total FROM articles');
  const finalTotal = updatedStats[0]?.results[0]?.total || 0;
  const finalMaxDate = updatedStats[0]?.results[0]?.max_date;

  console.log(`[D1 Sync] Complete! D1 articles: ${d1Total} -> ${finalTotal} (Latest created_at: ${finalMaxDate})`);

  return {
    syncedArticles: articles.length,
    previousTotal: d1Total,
    newTotal: finalTotal,
    maxDate: finalMaxDate
  };
}

// Run directly
if (process.argv[1]?.endsWith('sync-bkns-to-d1.mjs')) {
  runD1Sync()
    .then((summary) => {
      console.log('[D1 Sync Summary]:', JSON.stringify(summary, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('[D1 Sync Fatal Error]:', err);
      process.exit(1);
    });
}
