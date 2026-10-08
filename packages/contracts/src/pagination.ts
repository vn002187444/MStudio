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
