/**
 * MStudio Channel - Automated Batched Orphan D1 Cleanup
 * Date: 2026-11-20
 * 
 * Purpose:
 * Cleans orphan records from `raw_items` table in Cloudflare D1 that are not linked
 * to any story in `story_sources`.
 * 
 * Quota Safety:
 * Cloudflare D1 Free Tier allows 100,000 writes/day.
 * This script runs daily in batches (default: 30,000 rows/day) before the daily quota reset.
 * Deletion is executed in micro-chunks of 5,000 rows to ensure zero timeouts and low latency.
 * If orphan records remain, the next scheduled run continues where it left off until 0 orphans remain.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '9db1a9ece3ede791fd3cfb5d13bd6765';
const CF_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '6cef0de8-cd16-4494-a809-d1d177be002e';
const DEFAULT_DAILY_LIMIT = 30000;
const CHUNK_SIZE = 2500;
const INTER_CHUNK_DELAY_MS = 10500; // Cloudflare D1 10-second resource consumption window guard

function getCfToken() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  return null;
}

const CF_TOKEN = getCfToken();

async function executeD1Query(sql, retries = 4) {
  // If API token is available in env, prefer REST API
  if (CF_TOKEN) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`;
    for (let attempt = 1; attempt <= retries; attempt++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql })
      });
      if (res.status === 429) {
        console.warn(`  ⚠️ D1 Rate limit hit (code 7429). Pausing for 12 seconds to clear window (attempt ${attempt}/${retries})...`);
        await sleep(12000);
        continue;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`D1 API HTTP ${res.status}: ${text}`);
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(`D1 API Error: ${JSON.stringify(data.errors)}`);
      }
      return data.result;
    }
    throw new Error('D1 Query failed after retries due to 429 rate limit.');
  }

  // Robust execution via wrangler CLI with --command & --json flag
  const flattenedSql = sql.replace(/\r?\n/g, ' ').replace(/"/g, '\"').trim();
  const cmd = `pnpm exec wrangler d1 execute mstudio_dev --remote --command "${flattenedSql}" --json`;
  const output = execSync(cmd, { encoding: 'utf8', timeout: 90000, stdio: ['pipe', 'pipe', 'pipe'] });
  const jsonMatch = output.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return JSON.parse(output.trim());
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runOrphanCleanup(options = {}) {
  const dailyLimit = options.dailyLimit || DEFAULT_DAILY_LIMIT;
  const dryRun = options.dryRun || false;

  console.log('======================================================================');
  console.log('🧹 MSTUDIO CLOUDFLARE D1 AUTOMATED ORPHAN RAW_ITEMS CLEANUP');
  console.log(`Timestamp:       ${new Date().toISOString()}`);
  console.log(`Database ID:     ${CF_D1_DATABASE_ID}`);
  console.log(`Daily Limit:     ${dailyLimit.toLocaleString()} rows`);
  console.log(`Micro-Chunk:     ${CHUNK_SIZE.toLocaleString()} rows/step`);
  console.log(`Mode:            ${dryRun ? 'DRY-RUN (Inspection Only)' : 'LIVE EXECUTION'}`);
  console.log('======================================================================\n');

  // 1. Check initial state
  console.log('--- 1. INSPECTING CURRENT D1 ORPHAN STATUS ---');
  const statsQuery = `
    SELECT count(*) as total_raw_items FROM raw_items;
    SELECT count(*) as orphan_count FROM raw_items WHERE id NOT IN (SELECT raw_item_id FROM story_sources WHERE raw_item_id IS NOT NULL);
    SELECT count(*) as total_stories FROM stories;
    SELECT count(*) as total_articles FROM articles;
  `;
  const statsRes = await executeD1Query(statsQuery);

  const totalRawItems = statsRes[0]?.results[0]?.total_raw_items || 0;
  const orphanCount = statsRes[1]?.results[0]?.orphan_count || 0;
  const totalStories = statsRes[2]?.results[0]?.total_stories || 0;
  const totalArticles = statsRes[3]?.results[0]?.total_articles || 0;
  const dbSizeBytes = statsRes[0]?.meta?.size_after || 0;
  const dbSizeMB = (dbSizeBytes / (1024 * 1024)).toFixed(2);

  console.log(`📊 Total raw_items:     ${totalRawItems.toLocaleString()}`);
  console.log(`📊 Orphan raw_items:    ${orphanCount.toLocaleString()} (${((orphanCount / (totalRawItems || 1)) * 100).toFixed(1)}%)`);
  console.log(`📊 Total stories:       ${totalStories.toLocaleString()}`);
  console.log(`📊 Total articles:      ${totalArticles.toLocaleString()}`);
  console.log(`💾 Database Size:       ${dbSizeMB} MB`);

  if (orphanCount === 0) {
    console.log('\n✅ [STATUS: CLEAN] 0 orphan raw_items found. D1 Database is fully optimized.');
    return {
      status: 'UP_TO_DATE',
      initialOrphans: 0,
      deletedToday: 0,
      remainingOrphans: 0,
      dbSizeMB
    };
  }

  const targetToDelete = Math.min(orphanCount, dailyLimit);
  console.log(`\n🎯 Planned deletion today: ${targetToDelete.toLocaleString()} rows (Quota consumption: ~${Math.round((targetToDelete / 100000) * 100)}% of daily Free limit)`);

  if (dryRun) {
    console.log('\n[DRY RUN] Inspection complete. No rows were deleted.');
    return {
      status: 'DRY_RUN',
      initialOrphans: orphanCount,
      plannedDeletion: targetToDelete,
      remainingAfterPlan: orphanCount - targetToDelete
    };
  }

  // 2. Perform batched deletion in micro-chunks of CHUNK_SIZE
  console.log('\n--- 2. EXECUTING BATCHED DELETION ---');
  let totalDeleted = 0;
  let step = 0;

  while (totalDeleted < targetToDelete) {
    step++;
    const currentChunk = Math.min(CHUNK_SIZE, targetToDelete - totalDeleted);
    const deleteSql = `
      DELETE FROM raw_items 
      WHERE id IN (
        SELECT id FROM raw_items 
        WHERE id NOT IN (SELECT raw_item_id FROM story_sources WHERE raw_item_id IS NOT NULL) 
        LIMIT ${currentChunk}
      );
    `;

    const t0 = Date.now();
    const delRes = await executeD1Query(deleteSql);
    const durationMs = Date.now() - t0;
    const changed = delRes[0]?.meta?.changes ?? currentChunk;
    totalDeleted += changed;

    console.log(`  ⚡ [Step ${step}] Deleted ${changed.toLocaleString()} rows (${durationMs}ms) | Total deleted so far: ${totalDeleted.toLocaleString()} / ${targetToDelete.toLocaleString()}`);

    if (changed === 0) {
      console.log('  ℹ️ No more rows changed. Reached end of orphans early.');
      break;
    }

    // Safety pause between micro-chunks (enforces Cloudflare 10-second resource window)
    if (totalDeleted < targetToDelete) {
      console.log(`  ⏳ Pausing ${Math.round(INTER_CHUNK_DELAY_MS / 1000)}s to respect Cloudflare D1 burst resource window...`);
      await sleep(INTER_CHUNK_DELAY_MS);
    }
  }

  // 3. Final verification & Remaining count
  console.log('\n--- 3. POST-CLEANUP VERIFICATION ---');
  const verifyRes = await executeD1Query(`
    SELECT count(*) as remaining_orphans FROM raw_items WHERE id NOT IN (SELECT raw_item_id FROM story_sources WHERE raw_item_id IS NOT NULL);
    SELECT count(*) as total_raw_items FROM raw_items;
  `);

  const remainingOrphans = verifyRes[0]?.results[0]?.remaining_orphans || 0;
  const newTotalRaw = verifyRes[1]?.results[0]?.total_raw_items || 0;
  const newSizeBytes = verifyRes[0]?.meta?.size_after || 0;
  const newSizeMB = (newSizeBytes / (1024 * 1024)).toFixed(2);

  console.log('======================================================================');
  console.log('📋 BATCH CLEANUP SESSION SUMMARY');
  console.log(`Rows Deleted Today:    ${totalDeleted.toLocaleString()}`);
  console.log(`New raw_items Total:   ${newTotalRaw.toLocaleString()}`);
  console.log(`Remaining Orphans:     ${remainingOrphans.toLocaleString()}`);
  console.log(`New DB Size:           ${newSizeMB} MB`);

  if (remainingOrphans > 0) {
    const daysRemaining = Math.ceil(remainingOrphans / dailyLimit);
    console.log(`\n⏳ [CONTINUATION REQUIRED] Còn lại ${remainingOrphans.toLocaleString()} bản ghi mồ côi.`);
    console.log(`📅 Hệ thống sẽ tự động dọn tiếp vào phiên tiếp theo trước khi reset hạn mức ngày mai (dự kiến hoàn tất trong ~${daysRemaining} ngày nữa).`);
  } else {
    console.log('\n🎉 [COMPLETE] Toàn bộ bản ghi mồ côi đã được dọn sạch 100%! Cơ sở dữ liệu D1 hoàn toàn tinh gọn.');
  }
  console.log('======================================================================');

  return {
    status: remainingOrphans > 0 ? 'PARTIAL' : 'COMPLETED',
    initialOrphans: orphanCount,
    deletedToday: totalDeleted,
    remainingOrphans,
    newSizeMB
  };
}

// CLI direct execution
if (process.argv[1] && process.argv[1].endsWith('cleanup-d1-orphans.mjs')) {
  const isDryRun = process.argv.includes('--dry-run');
  const limitArg = process.argv.find(a => a.startsWith('--limit='));
  const dailyLimit = limitArg ? Number(limitArg.split('=')[1]) : DEFAULT_DAILY_LIMIT;

  runOrphanCleanup({ dryRun: isDryRun, dailyLimit })
    .catch(err => {
      console.error('\n❌ Fatal Cleanup Error:', err);
      process.exitCode = 1;
    });
}
