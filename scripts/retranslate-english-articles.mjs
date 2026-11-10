/**
 * MStudio Batch Retranslation & Synthesis Engine
 * Scans mstudio.db for non-Vietnamese / English articles, passes them through the
 * AI Newsroom Synthesizer, and updates titles, slugs, sapos, and bodies into
 * professional Vietnamese journalistic format.
 *
 * Usage:
 *   node scripts/retranslate-english-articles.mjs [--limit 50] [--all]
 */

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { synthesizeArticle, isVietnameseText } from "../deploy/bkns-api/synthesizer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "deploy", "bkns-api", "data", "mstudio.db");

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9 -]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function run() {
  const args = process.argv.slice(2);
  const isAll = args.includes("--all");
  const limitIndex = args.indexOf("--limit");
  const limit = isAll ? 5000 : (limitIndex !== -1 ? Number(args[limitIndex + 1]) : 50);

  console.log("=================================================================");
  console.log("🚀 MSTUDIO ARTICLE RETRANSLATION & SYNTHESIS ENGINE");
  console.log(`Database: ${dbPath}`);
  console.log(`Mode: ${isAll ? "ALL" : `Batch (limit: ${limit})`}`);
  console.log("=================================================================\n");

  const db = new DatabaseSync(dbPath);

  // Query articles with their published revision
  const articles = db.prepare(`
    SELECT 
      a.id, 
      a.story_id,
      a.slug, 
      a.category_slug, 
      a.published_revision_id,
      a.canonical_url,
      r.title, 
      r.summary, 
      r.body
    FROM articles a
    JOIN article_revisions r ON r.id = a.published_revision_id
    WHERE a.status = 'published'
    ORDER BY a.created_at DESC
  `).all();

  console.log(`[Scan] Total published articles found: ${articles.length}`);

  const candidates = articles.filter((a) => !isVietnameseText(a.title));
  console.log(`[Scan] Detected non-Vietnamese articles: ${candidates.length}`);

  if (candidates.length === 0) {
    console.log("✅ Zero English articles detected! All articles are in Vietnamese.");
    return;
  }

  const batch = candidates.slice(0, limit);
  console.log(`[Batch] Processing ${batch.length} articles in this run...\n`);

  const updateStoryStmt = db.prepare("UPDATE stories SET title = ?, summary = ? WHERE id = ?");
  const updateArticleStmt = db.prepare(`
    UPDATE articles 
    SET slug = ?, meta_title = ?, meta_description = ?, canonical_url = ? 
    WHERE id = ?
  `);
  const updateRevisionStmt = db.prepare(`
    UPDATE article_revisions 
    SET title = ?, summary = ?, body = ? 
    WHERE id = ?
  `);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < batch.length; i++) {
    const item = batch[i];
    console.log(`[${i + 1}/${batch.length}] Processing: "${item.title.slice(0, 60)}..."`);

    try {
      const synthesized = await synthesizeArticle({
        title: item.title,
        summary: item.summary,
        body: item.body || item.summary,
        sourceName: "Thông tấn Quốc tế",
        url: item.canonical_url,
        categorySlug: item.category_slug
      });

      if (!synthesized || !synthesized.title) {
        throw new Error("Synthesizer returned empty response");
      }

      const newTitle = synthesized.title;
      const newSummary = synthesized.summary;
      const newBody = synthesized.body;
      const newSlug = slugify(newTitle) || item.slug;
      const newCanonicalUrl = `https://mstudio.minds.io.vn/bai-viet/${newSlug}`;

      // Update database tables
      updateStoryStmt.run(newTitle, newSummary, item.story_id);
      updateArticleStmt.run(newSlug, newTitle, newSummary, newCanonicalUrl, item.id);
      updateRevisionStmt.run(newTitle, newSummary, newBody, item.published_revision_id);

      successCount++;
      console.log(`  -> ✅ Synthesized: "${newTitle.slice(0, 60)}..." (slug: ${newSlug})`);
    } catch (err) {
      failCount++;
      console.log(`  -> ❌ Failed: ${err.message}`);
    }
  }

  console.log("\n=================================================================");
  console.log("📊 RETRANSLATION SUMMARY REPORT");
  console.log(`Total Scanned:     ${candidates.length}`);
  console.log(`Processed in Batch: ${batch.length}`);
  console.log(`✅ Success:         ${successCount}`);
  console.log(`❌ Failed:          ${failCount}`);
  console.log(`Remaining English:  ${candidates.length - successCount}`);
  console.log("=================================================================");
}

run().catch((err) => {
  console.error("Fatal Retranslation Runner Error:", err);
  process.exit(1);
});
