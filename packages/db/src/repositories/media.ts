import type { D1Database } from "@cloudflare/workers-types";
import type { RightsStatus } from "@mstudio/contracts";

export interface MediaAssetRecord {
  id: string;
  articleId?: string;
  originUrl: string;
  r2Key?: string;
  source?: string;
  creator?: string;
  rightsStatus: RightsStatus;
  license?: string;
  credit?: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
  assetHash?: string;
  createdAt: string;
}

export interface NewMediaAsset {
  id: string;
  articleId?: string;
  originUrl: string;
  r2Key?: string;
  source?: string;
  creator?: string;
  rightsStatus?: RightsStatus;
  license?: string;
  credit?: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
  assetHash?: string;
  createdAt: string;
}

interface MediaAssetRowRaw {
  id: string;
  article_id: string | null;
  origin_url: string;
  r2_key: string | null;
  source: string | null;
  creator: string | null;
  rights_status: RightsStatus;
  license: string | null;
  credit: string | null;
  caption: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
  asset_hash: string | null;
  created_at: string;
}

function toMediaAssetRecord(row: MediaAssetRowRaw): MediaAssetRecord {
  return {
    id: row.id,
    articleId: row.article_id ?? undefined,
    originUrl: row.origin_url,
    r2Key: row.r2_key ?? undefined,
    source: row.source ?? undefined,
    creator: row.creator ?? undefined,
    rightsStatus: row.rights_status,
    license: row.license ?? undefined,
    credit: row.credit ?? undefined,
    caption: row.caption ?? undefined,
    alt: row.alt ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    assetHash: row.asset_hash ?? undefined,
    createdAt: row.created_at,
  };
}

const MEDIA_ASSET_SELECT = `
  SELECT id, article_id, origin_url, r2_key, source, creator,
         rights_status, license, credit, caption, alt,
         width, height, asset_hash, created_at
  FROM media_assets
`;

export async function createMediaAsset(
  db: D1Database,
  input: NewMediaAsset,
): Promise<MediaAssetRecord> {
  await db
    .prepare(
      `INSERT INTO media_assets
         (id, article_id, origin_url, r2_key, source, creator,
          rights_status, license, credit, caption, alt,
          width, height, asset_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.articleId ?? null,
      input.originUrl,
      input.r2Key ?? null,
      input.source ?? null,
      input.creator ?? null,
      input.rightsStatus ?? "unknown",
      input.license ?? null,
      input.credit ?? null,
      input.caption ?? null,
      input.alt ?? null,
      input.width ?? null,
      input.height ?? null,
      input.assetHash ?? null,
      input.createdAt,
    )
    .run();
  const row = await getMediaAsset(db, input.id);
  if (!row) {
    throw new Error("media asset not found after insert");
  }
  return row;
}

export async function getMediaAsset(
  db: D1Database,
  id: string,
): Promise<MediaAssetRecord | undefined> {
  const row = await db
    .prepare(`${MEDIA_ASSET_SELECT} WHERE id = ?`)
    .bind(id)
    .first<MediaAssetRowRaw>();
  return row ? toMediaAssetRecord(row) : undefined;
}

export async function listMediaAssetsByArticle(
  db: D1Database,
  articleId: string,
): Promise<MediaAssetRecord[]> {
  const rows = await db
    .prepare(`${MEDIA_ASSET_SELECT} WHERE article_id = ?`)
    .bind(articleId)
    .all<MediaAssetRowRaw>();
  return rows.results.map(toMediaAssetRecord);
}
