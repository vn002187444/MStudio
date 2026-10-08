export interface Cursor {
  createdAt: string;
  id: string;
}

export interface PageInput {
  limit?: number;
  cursor?: Cursor;
}

export interface PagedRows<T> {
  rows: T[];
  nextCursor?: Cursor;
}

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export function pageSize(limit?: number): number {
  return Math.min(Math.max(limit ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
}

export function paginate<T extends Cursor>(
  rows: T[],
  limit: number,
): PagedRows<T> {
  const hasMore = rows.length > limit;
  const trimmed = hasMore ? rows.slice(0, limit) : rows;
  const last = trimmed[trimmed.length - 1];
  return {
    rows: trimmed,
    nextCursor: hasMore && last ? { createdAt: last.createdAt, id: last.id } : undefined,
  };
}
