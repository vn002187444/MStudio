import type { D1Database } from "@cloudflare/workers-types";
import type {
  ArticleRecord,
  ArticleSourceLink,
  ArticleStatus,
  PublishedArticleDetailRecord,
  PublishedArticleRecord,
} from "@mstudio/contracts";
import {
  ARTICLE_STATUSES,
  isArticleStatus,
  validateTransition,
} from "@mstudio/contracts";
import { paginate, pageSize } from "./pagination.ts";
import type { PageInput, PagedRows } from "./pagination.ts";
import {
  applyInternalLinks,
  resolveLinkCandidates,
  type InternalLinkOptions,
} from "../internal-links.ts";

export type {
  ArticleRecord,
  ArticleSourceLink,
  PublishedArticleDetailRecord,
  PublishedArticleRecord,
};

export interface AddRevisionOptions {
  internalLinks?: InternalLinkOptions & { storyId: string };
}

export interface ArticleRevisionRecord {
  id: string;
  articleId: string;
  revisionNumber: number;
  title: string;
  body: string;
  summary?: string;
  createdAt: string;
}

export interface NewArticle {
  id: string;
  storyId: string;
  status?: ArticleStatus;
  slug?: string;
  categorySlug?: string;
  heroImageUrl?: string;
  videoUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  keywords?: string;
  sourceCount?: number;
  qualityScore?: number;
  isBreaking?: boolean;
  isTrending?: boolean;
  now?: string;
}

export interface NewArticleRevision {
  id: string;
  articleId: string;
  title: string;
  body: string;
  summary?: string;
  now?: string;
}

export interface UpdateArticleMetadataInput {
  slug?: string;
  categorySlug?: string;
  heroImageUrl?: string;
  videoUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  keywords?: string;
  sourceCount?: number;
  qualityScore?: number;
  isBreaking?: boolean;
  isTrending?: boolean;
}

interface ArticleRowRaw {
  id: string;
  storyId: string;
  status: ArticleStatus;
  currentRevisionId: string | null;
  publishedRevisionId: string | null;
  publishKey: string | null;
  slug: string | null;
  categorySlug: string | null;
  heroImageUrl: string | null;
  videoUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  keywords: string | null;
  sourceCount: number;
  qualityScore: number | null;
  isBreaking: number;
  isTrending: number;
  createdAt: string;
  updatedAt: string;
}

interface RevisionRowRaw {
  id: string;
  articleId: string;
  revisionNumber: number;
  title: string;
  body: string;
  summary: string | null;
  createdAt: string;
}

const ARTICLE_SELECT = `
  SELECT id, story_id AS storyId, status,
         current_revision_id AS currentRevisionId,
         published_revision_id AS publishedRevisionId,
         publish_key AS publishKey,
         slug, category_slug AS categorySlug,
         hero_image_url AS heroImageUrl,
         video_url AS videoUrl,
         meta_title AS metaTitle,
         meta_description AS metaDescription,
         canonical_url AS canonicalUrl,
         og_image_url AS ogImageUrl,
         keywords,
         source_count AS sourceCount,
         quality_score AS qualityScore,
         is_breaking AS isBreaking,
         is_trending AS isTrending,
         created_at AS createdAt, updated_at AS updatedAt
  FROM articles
`;

const REVISION_SELECT = `
  SELECT id, article_id AS articleId, revision_number AS revisionNumber,
         title, body, summary, created_at AS createdAt
  FROM article_revisions
`;

function toArticleRow(row: ArticleRowRaw): ArticleRecord {
  return {
    ...row,
    currentRevisionId: row.currentRevisionId ?? undefined,
    publishedRevisionId: row.publishedRevisionId ?? undefined,
    publishKey: row.publishKey ?? undefined,
    slug: row.slug ?? undefined,
    categorySlug: row.categorySlug ?? undefined,
    heroImageUrl: row.heroImageUrl ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    metaTitle: row.metaTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    canonicalUrl: row.canonicalUrl ?? undefined,
    ogImageUrl: row.ogImageUrl ?? undefined,
    keywords: row.keywords ?? undefined,
    qualityScore: row.qualityScore != null ? row.qualityScore : undefined,
    sourceCount: Number(row.sourceCount ?? 0),
    isBreaking: Boolean(row.isBreaking),
    isTrending: Boolean(row.isTrending),
  };
}

function toRevisionRow(row: RevisionRowRaw): ArticleRevisionRecord {
  return { ...row, summary: row.summary ?? undefined };
}

export class TransitionError extends Error {
  readonly from: ArticleStatus;
  readonly to: ArticleStatus;
  readonly allowed: readonly ArticleStatus[];

  constructor(
    message: string,
    from: ArticleStatus,
    to: ArticleStatus,
    allowed: readonly ArticleStatus[],
  ) {
    super(message);
    this.name = "TransitionError";
    this.from = from;
    this.to = to;
    this.allowed = allowed;
  }
}

export class PublishConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishConflictError";
  }
}

export async function createArticle(
  db: D1Database,
  input: NewArticle,
): Promise<ArticleRecord> {
  const now = input.now ?? new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO articles (
         id, story_id, status, slug, category_slug, hero_image_url, video_url,
         meta_title, meta_description, canonical_url, og_image_url, keywords,
         source_count, quality_score, is_breaking, is_trending, created_at, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.storyId,
      input.status ?? "drafted",
      input.slug || null,
      input.categorySlug || null,
      input.heroImageUrl || null,
      input.videoUrl || null,
      input.metaTitle || null,
      input.metaDescription || null,
      input.canonicalUrl || null,
      input.ogImageUrl || null,
      input.keywords || null,
      input.sourceCount ?? 0,
      input.qualityScore ?? null,
      input.isBreaking ? 1 : 0,
      input.isTrending ? 1 : 0,
      now,
      now,
    )
    .run();
  const row = await getArticle(db, input.id);
  if (!row) throw new Error("article not found after insert");
  return row;
}

export async function updateArticleMetadata(
  db: D1Database,
  id: string,
  input: UpdateArticleMetadataInput,
  now = new Date().toISOString(),
): Promise<ArticleRecord> {
  const existing = await getArticle(db, id);
  if (!existing) {
    throw new Error(`article ${id} not found`);
  }

  const fields: string[] = ["updated_at = ?"];
  const values: unknown[] = [now];

  if (input.slug !== undefined) {
    fields.push("slug = ?");
    values.push(input.slug || null);
  }
  if (input.categorySlug !== undefined) {
    fields.push("category_slug = ?");
    values.push(input.categorySlug || null);
  }
  if (input.heroImageUrl !== undefined) {
    fields.push("hero_image_url = ?");
    values.push(input.heroImageUrl || null);
  }
  if (input.videoUrl !== undefined) {
    fields.push("video_url = ?");
    values.push(input.videoUrl || null);
  }
  if (input.metaTitle !== undefined) {
    fields.push("meta_title = ?");
    values.push(input.metaTitle || null);
  }
  if (input.metaDescription !== undefined) {
    fields.push("meta_description = ?");
    values.push(input.metaDescription || null);
  }
  if (input.canonicalUrl !== undefined) {
    fields.push("canonical_url = ?");
    values.push(input.canonicalUrl || null);
  }
  if (input.ogImageUrl !== undefined) {
    fields.push("og_image_url = ?");
    values.push(input.ogImageUrl || null);
  }
  if (input.keywords !== undefined) {
    fields.push("keywords = ?");
    values.push(input.keywords || null);
  }
  if (input.sourceCount !== undefined) {
    fields.push("source_count = ?");
    values.push(input.sourceCount);
  }
  if (input.qualityScore !== undefined) {
    fields.push("quality_score = ?");
    values.push(input.qualityScore ?? null);
  }
  if (input.isBreaking !== undefined) {
    fields.push("is_breaking = ?");
    values.push(input.isBreaking ? 1 : 0);
  }
  if (input.isTrending !== undefined) {
    fields.push("is_trending = ?");
    values.push(input.isTrending ? 1 : 0);
  }

  values.push(id);

  await db
    .prepare(`UPDATE articles SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await getArticle(db, id);
  if (!updated) throw new Error(`article ${id} not found after metadata update`);
  return updated;
}

export async function getArticle(
  db: D1Database,
  id: string,
): Promise<ArticleRecord | undefined> {
  const row = await db
    .prepare(`${ARTICLE_SELECT} WHERE id = ?`)
    .bind(id)
    .first<ArticleRowRaw>();
  return row ? toArticleRow(row) : undefined;
}

export async function listArticlesByStory(
  db: D1Database,
  storyId: string,
  input: PageInput = {},
): Promise<PagedRows<ArticleRecord>> {
  const limit = pageSize(input.limit);
  const results = input.cursor
    ? (
        await db
          .prepare(
            `${ARTICLE_SELECT} WHERE story_id = ? AND (created_at, id) > (?, ?) ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(storyId, input.cursor.createdAt, input.cursor.id, limit + 1)
          .all<ArticleRowRaw>()
      ).results
    : (
        await db
          .prepare(
            `${ARTICLE_SELECT} WHERE story_id = ? ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(storyId, limit + 1)
          .all<ArticleRowRaw>()
      ).results;
  return paginate(results.map(toArticleRow), limit);
}

/**
 * Editorial queue (CMS): bài theo status, cũ nhất trước để duyệt.
 * Keyset (created_at ASC, id ASC). Chỉ dùng nội bộ có auth — reader
 * surfaces dùng listPublishedArticles.
 */
export async function listArticlesByStatus(
  db: D1Database,
  status: ArticleStatus,
  input: PageInput = {},
): Promise<PagedRows<ArticleRecord>> {
  const limit = pageSize(input.limit);
  const results = input.cursor
    ? (
        await db
          .prepare(
            `${ARTICLE_SELECT} WHERE status = ? AND (created_at, id) > (?, ?) ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(status, input.cursor.createdAt, input.cursor.id, limit + 1)
          .all<ArticleRowRaw>()
      ).results
    : (
        await db
          .prepare(
            `${ARTICLE_SELECT} WHERE status = ? ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(status, limit + 1)
          .all<ArticleRowRaw>()
      ).results;
  return paginate(results.map(toArticleRow), limit);
}

export type ArticleStatusCounts = Record<ArticleStatus, number>;

/**
 * CMS dashboard: đếm số bài theo status trong một query GROUP BY.
 * Mọi status đều có key (0 nếu chưa có bài) để studio group theo
 * status không phải xử lý undefined.
 */
export async function countArticlesByStatus(
  db: D1Database,
): Promise<ArticleStatusCounts> {
  const rows = (
    await db
      .prepare(
        "SELECT status, COUNT(*) AS count FROM articles GROUP BY status",
      )
      .all<{ status: string; count: number }>()
  ).results;
  const counts = Object.fromEntries(
    ARTICLE_STATUSES.map((status) => [status, 0]),
  ) as ArticleStatusCounts;
  for (const row of rows) {
    if (isArticleStatus(row.status)) {
      counts[row.status] = Number(row.count);
    }
  }
  return counts;
}

export interface StoryAggregateRecord {
  storyId: string;
  articleCount: number;
  statuses: ArticleStatus[];
  /** Title của article mới nhất trong story đã có revision (bài chưa
   * có revision không có title để hiển thị — omit khi không có). */
  latestTitle?: string;
  latestUpdatedAt: string;
}

interface StoryAggregateRowRaw {
  storyId: string;
  articleCount: number;
  statuses: string;
  latestTitle: string | null;
  latestUpdatedAt: string;
}

export const STORY_AGGREGATE_LIMIT = 50;

function toStoryAggregate(row: StoryAggregateRowRaw): StoryAggregateRecord {
  const statuses = row.statuses
    .split(",")
    .filter(isArticleStatus)
    .sort(
      (a, b) => ARTICLE_STATUSES.indexOf(a) - ARTICLE_STATUSES.indexOf(b),
    );
  return {
    storyId: row.storyId,
    articleCount: Number(row.articleCount),
    statuses,
    latestTitle: row.latestTitle ?? undefined,
    latestUpdatedAt: row.latestUpdatedAt,
  };
}

/**
 * CMS "Story Clusters": group articles theo story_id (chỉ story có bài),
 * mới nhất trước, limit 50. Chỉ metadata aggregate — không đọc body.
 * Index consideration: GROUP BY story_id là full scan; articles còn nhỏ
 * nên chấp nhận được — nếu bảng phình cần index (story_id, updated_at)
 * (tạo migration riêng, không nằm trong task read-only này).
 */
export async function listStoryAggregates(
  db: D1Database,
  limit: number = STORY_AGGREGATE_LIMIT,
): Promise<StoryAggregateRecord[]> {
  const rows = (
    await db
      .prepare(
        `SELECT a.story_id AS storyId,
                COUNT(*) AS articleCount,
                group_concat(DISTINCT a.status) AS statuses,
                MAX(a.updated_at) AS latestUpdatedAt,
                (SELECT r.title
                   FROM articles la
                   JOIN article_revisions r ON r.id = la.current_revision_id
                  WHERE la.story_id = a.story_id
                  ORDER BY la.updated_at DESC, la.id DESC
                  LIMIT 1) AS latestTitle
           FROM articles a
          GROUP BY a.story_id
          ORDER BY MAX(a.updated_at) DESC, a.story_id DESC
          LIMIT ?`,
      )
      .bind(limit)
      .all<StoryAggregateRowRaw>()
  ).results;
  return rows.map(toStoryAggregate);
}

interface PublishedArticleRowRaw {
  id: string;
  storyId: string;
  status: ArticleStatus;
  title: string;
  body: string;
  summary: string | null;
  publishedRevisionId: string;
  slug: string | null;
  categorySlug: string | null;
  heroImageUrl: string | null;
  videoUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  keywords: string | null;
  sourceCount: number;
  qualityScore: number | null;
  isBreaking: number;
  isTrending: number;
  updatedAt: string;
  createdAt: string;
}

const PUBLISHED_ARTICLE_SELECT = `
  SELECT a.id AS id, a.story_id AS storyId, a.status AS status,
         a.published_revision_id AS publishedRevisionId,
         a.slug AS slug, a.category_slug AS categorySlug,
         a.hero_image_url AS heroImageUrl,
         a.video_url AS videoUrl,
         a.meta_title AS metaTitle,
         a.meta_description AS metaDescription,
         a.canonical_url AS canonicalUrl,
         a.og_image_url AS ogImageUrl,
         a.keywords AS keywords,
         a.source_count AS sourceCount,
         a.quality_score AS qualityScore,
         a.is_breaking AS isBreaking,
         a.is_trending AS isTrending,
         a.updated_at AS updatedAt, a.created_at AS createdAt,
         r.title AS title, r.body AS body, r.summary AS summary
  FROM articles a
  JOIN article_revisions r ON r.id = a.published_revision_id
`;

const READER_VISIBLE_STATUSES: readonly ArticleStatus[] = [
  "published",
  "updated",
  "corrected",
];

export async function getPublishedArticle(
  db: D1Database,
  identifier: string,
): Promise<PublishedArticleDetailRecord | undefined> {
  const placeholders = READER_VISIBLE_STATUSES.map(
    () => "?",
  ).join(", ");
  const row = await db
    .prepare(
      `${PUBLISHED_ARTICLE_SELECT} WHERE (a.id = ? OR a.slug = ?) AND a.status IN (${placeholders})`,
    )
    .bind(identifier, identifier, ...READER_VISIBLE_STATUSES)
    .first<PublishedArticleRowRaw>();
  if (!row) return undefined;
  // Lineage sources: story -> story_sources -> raw_items -> sources.
  // Index theo story_id (story_sources PK/UNIQUE đầu là story_id) — một
  // query nhỏ cho detail, không chạm list path.
  const sourceRows = (
    await db
      .prepare(
        `SELECT s.name AS name, s.origin_url AS originUrl,
                s.rights_status AS rightsStatus, ss.role AS role
         FROM story_sources ss
         JOIN raw_items ri ON ri.id = ss.raw_item_id
         JOIN sources s ON s.id = ri.source_id
         WHERE ss.story_id = ?
         ORDER BY CASE ss.role
                    WHEN 'primary' THEN 0
                    WHEN 'supporting' THEN 1
                    ELSE 2
                  END, s.name ASC`,
      )
      .bind(row.storyId)
      .all<ArticleSourceLink>()
  ).results;
  return {
    id: row.id,
    storyId: row.storyId,
    status: row.status,
    title: row.title,
    body: row.body,
    summary: row.summary ?? undefined,
    publishedRevisionId: row.publishedRevisionId,
    slug: row.slug ?? undefined,
    categorySlug: row.categorySlug ?? undefined,
    heroImageUrl: row.heroImageUrl ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    metaTitle: row.metaTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    canonicalUrl: row.canonicalUrl ?? undefined,
    ogImageUrl: row.ogImageUrl ?? undefined,
    keywords: row.keywords ?? undefined,
    sourceCount: Number(row.sourceCount ?? 0),
    qualityScore: row.qualityScore != null ? row.qualityScore : undefined,
    isBreaking: Boolean(row.isBreaking),
    isTrending: Boolean(row.isTrending),
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
    sources: sourceRows,
  };
}

/**
 * Danh sách bài reader-visible, mới nhất trước (web homepage "Mới nhất").
 * Keyset trên (updated_at DESC, id DESC); cursor tái dùng PageInput
 * (createdAt mang updated_at của row cuối). Hỗ trợ lọc theo categorySlug.
 */
export async function listPublishedArticles(
  db: D1Database,
  input: PageInput & { categorySlug?: string } = {},
): Promise<PagedRows<PublishedArticleRecord>> {
  const limit = pageSize(input.limit);
  const placeholders = READER_VISIBLE_STATUSES.map(
    () => "?",
  ).join(", ");
  let base = `${PUBLISHED_ARTICLE_SELECT}
    WHERE a.status IN (${placeholders})`;
  const baseParams: unknown[] = [...READER_VISIBLE_STATUSES];

  if (input.categorySlug) {
    base += ` AND a.category_slug = ?`;
    baseParams.push(input.categorySlug);
  }

  const order = `ORDER BY a.updated_at DESC, a.id DESC LIMIT ${limit + 1}`;
  const rows = input.cursor
    ? (
        await db
          .prepare(
            `${base} AND (a.updated_at, a.id) < (?, ?) ${order}`,
          )
          .bind(
            ...baseParams,
            input.cursor.createdAt,
            input.cursor.id,
          )
          .all<PublishedArticleRowRaw>()
      ).results
    : (
        await db
          .prepare(`${base} ${order}`)
          .bind(...baseParams)
          .all<PublishedArticleRowRaw>()
      ).results;
  return paginate(
    rows.map((row) => ({
      id: row.id,
      storyId: row.storyId,
      status: row.status,
      title: row.title,
      body: row.body,
      summary: row.summary ?? undefined,
      publishedRevisionId: row.publishedRevisionId,
      slug: row.slug ?? undefined,
      categorySlug: row.categorySlug ?? undefined,
      heroImageUrl: row.heroImageUrl ?? undefined,
      videoUrl: row.videoUrl ?? undefined,
      metaTitle: row.metaTitle ?? undefined,
      metaDescription: row.metaDescription ?? undefined,
      canonicalUrl: row.canonicalUrl ?? undefined,
      ogImageUrl: row.ogImageUrl ?? undefined,
      keywords: row.keywords ?? undefined,
      sourceCount: Number(row.sourceCount ?? 0),
      qualityScore: row.qualityScore != null ? row.qualityScore : undefined,
      isBreaking: Boolean(row.isBreaking),
      isTrending: Boolean(row.isTrending),
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
    })),
    limit,
  );
}

export async function addRevision(
  db: D1Database,
  input: NewArticleRevision,
  options: AddRevisionOptions = {},
): Promise<ArticleRevisionRecord> {
  const now = input.now ?? new Date().toISOString();
  const nextNumber = await nextRevisionNumber(db, input.articleId);
  let body = input.body;
  if (options.internalLinks) {
    const { storyId, ...linkOptions } = options.internalLinks;
    const candidates = await resolveLinkCandidates(db, storyId);
    body = applyInternalLinks(body, candidates, linkOptions);
  }
  await db
    .prepare(
      `INSERT INTO article_revisions
         (id, article_id, revision_number, title, body, summary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.articleId,
      nextNumber,
      input.title,
      body,
      input.summary ?? null,
      now,
    )
    .run();
  await db
    .prepare(
      "UPDATE articles SET current_revision_id = ?, updated_at = ? WHERE id = ?",
    )
    .bind(input.id, now, input.articleId)
    .run();
  const revision = await getRevision(db, input.id);
  if (!revision) throw new Error("revision not found after insert");
  return revision;
}

export async function getRevision(
  db: D1Database,
  id: string,
): Promise<ArticleRevisionRecord | undefined> {
  const row = await db
    .prepare(`${REVISION_SELECT} WHERE id = ?`)
    .bind(id)
    .first<RevisionRowRaw>();
  return row ? toRevisionRow(row) : undefined;
}

export async function listRevisions(
  db: D1Database,
  articleId: string,
): Promise<ArticleRevisionRecord[]> {
  const rows = (
    await db
      .prepare(
        `${REVISION_SELECT} WHERE article_id = ? ORDER BY revision_number ASC`,
      )
      .bind(articleId)
      .all<RevisionRowRaw>()
  ).results;
  return rows.map(toRevisionRow);
}

async function nextRevisionNumber(
  db: D1Database,
  articleId: string,
): Promise<number> {
  const row = await db
    .prepare(
      "SELECT COALESCE(MAX(revision_number), 0) AS max FROM article_revisions WHERE article_id = ?",
    )
    .bind(articleId)
    .first<{ max: number }>();
  return (row?.max ?? 0) + 1;
}

export async function transitionArticle(
  db: D1Database,
  id: string,
  to: ArticleStatus,
  now = new Date().toISOString(),
): Promise<ArticleRecord> {
  const article = await getArticle(db, id);
  if (!article) {
    throw new Error(`article ${id} not found`);
  }
  const result = validateTransition(article.status, to);
  if (!result.ok) {
    throw new TransitionError(
      `cannot transition article ${id} from ${article.status} to ${to}`,
      article.status,
      to,
      result.allowed,
    );
  }
  await db
    .prepare("UPDATE articles SET status = ?, updated_at = ? WHERE id = ?")
    .bind(to, now, id)
    .run();
  const updated = await getArticle(db, id);
  if (!updated) throw new Error(`article ${id} not found after transition`);
  return updated;
}

export interface PublishResult {
  article: ArticleRecord;
  alreadyPublished: boolean;
}

function validatePublishRevision(
  id: string,
  revisionId: string,
  revision: ArticleRevisionRecord | undefined,
) {
  if (!revision || revision.articleId !== id) {
    throw new Error(`revision ${revisionId} does not belong to article ${id}`);
  }
}

function validatePublishState(
  article: ArticleRecord,
  revisionId: string,
): { alreadyPublished: boolean } {
  if (article.status !== "scheduled" && article.status !== "published") {
    throw new TransitionError(
      `article ${article.id} must be scheduled before publish (current: ${article.status})`,
      article.status,
      "published",
      ["scheduled"],
    );
  }

  if (article.publishedRevisionId === revisionId) {
    return { alreadyPublished: true };
  }

  if (article.status === "published" && article.publishedRevisionId) {
    throw new PublishConflictError(
      `article ${article.id} already published revision ${article.publishedRevisionId}`,
    );
  }

  return { alreadyPublished: false };
}

export async function publishArticle(
  db: D1Database,
  id: string,
  revisionId: string,
  now = new Date().toISOString(),
): Promise<PublishResult> {
  const article = await getArticle(db, id);
  if (!article) {
    throw new Error(`article ${id} not found`);
  }
  const revision = await getRevision(db, revisionId);

  validatePublishRevision(id, revisionId, revision);

  const { alreadyPublished } = validatePublishState(article, revisionId);
  if (alreadyPublished) {
    return { article, alreadyPublished: true };
  }

  const publishKey = `${id}:${revisionId}`;

  await db
    .prepare(
      `UPDATE articles
       SET status = 'published', published_revision_id = ?,
           current_revision_id = ?, publish_key = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(revisionId, revisionId, publishKey, now, id)
    .run();
  const updated = await getArticle(db, id);
  if (!updated) throw new Error(`article ${id} not found after publish`);
  return { article: updated, alreadyPublished: false };
}
