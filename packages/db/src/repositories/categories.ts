import type { D1Database } from "@cloudflare/workers-types";
import type {
  CategoryRecord,
  CategoryStatus,
} from "@mstudio/contracts";

export type { CategoryRecord, CategoryStatus };

interface CategoryRowRaw {
  slug: string;
  labelVi: string;
  parentSlug: string | null;
  sort: number;
  status: CategoryStatus;
}

function toCategoryRecord(row: CategoryRowRaw): CategoryRecord {
  return {
    slug: row.slug,
    labelVi: row.labelVi,
    parentSlug: row.parentSlug ?? undefined,
    sort: row.sort,
    status: row.status,
  };
}

const CATEGORY_SELECT = `
  SELECT slug AS slug, label_vi AS labelVi,
         parent_slug AS parentSlug, sort AS sort,
         status AS status
  FROM categories
`;

export async function listCategories(
  db: D1Database,
): Promise<CategoryRecord[]> {
  const rows = await db
    .prepare(`${CATEGORY_SELECT} ORDER BY sort, slug`)
    .all<CategoryRowRaw>();
  return rows.results.map(toCategoryRecord);
}

export async function listActiveCategories(
  db: D1Database,
): Promise<CategoryRecord[]> {
  const rows = await db
    .prepare(
      `${CATEGORY_SELECT} WHERE status = 'active'
       ORDER BY sort, slug`,
    )
    .all<CategoryRowRaw>();
  return rows.results.map(toCategoryRecord);
}

export async function getCategory(
  db: D1Database,
  slug: string,
): Promise<CategoryRecord | undefined> {
  const row = await db
    .prepare(`${CATEGORY_SELECT} WHERE slug = ?`)
    .bind(slug)
    .first<CategoryRowRaw>();
  return row ? toCategoryRecord(row) : undefined;
}
