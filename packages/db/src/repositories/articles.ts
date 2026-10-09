import type { D1Database } from "@cloudflare/workers-types";
import type {
  ArticleStatus,
} from "@mstudio/contracts";
import { validateTransition } from "@mstudio/contracts";
import { paginate, pageSize } from "./pagination.ts";
import type { PageInput, PagedRows } from "./pagination.ts";

export interface ArticleRecord {
  id: string;
  storyId: string;
  status: ArticleStatus;
  currentRevisionId?: string;
  publishedRevisionId?: string;
  publishKey?: string;
  createdAt: string;
  updatedAt: string;
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

interface ArticleRowRaw {
  id: string;
  storyId: string;
  status: ArticleStatus;
  currentRevisionId: string | null;
  publishedRevisionId: string | null;
  publishKey: string | null;
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
      `INSERT INTO articles (id, story_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.storyId,
      input.status ?? "drafted",
      now,
      now,
    )
    .run();
  const row = await getArticle(db, input.id);
  if (!row) throw new Error("article not found after insert");
  return row;
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

export async function addRevision(
  db: D1Database,
  input: NewArticleRevision,
): Promise<ArticleRevisionRecord> {
  const now = input.now ?? new Date().toISOString();
  const nextNumber = await nextRevisionNumber(db, input.articleId);
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
      input.body,
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
  if (!revision || revision.articleId !== id) {
    throw new Error(`revision ${revisionId} does not belong to article ${id}`);
  }

  const publishKey = `${id}:${revisionId}`;
  if (
    article.status !== "scheduled" &&
    article.status !== "published"
  ) {
    throw new TransitionError(
      `article ${id} must be scheduled before publish (current: ${article.status})`,
      article.status,
      "published",
      ["scheduled"],
    );
  }

  if (article.publishedRevisionId === revisionId) {
    return { article, alreadyPublished: true };
  }

  if (article.status === "published" && article.publishedRevisionId) {
    throw new PublishConflictError(
      `article ${id} already published revision ${article.publishedRevisionId}`,
    );
  }

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
