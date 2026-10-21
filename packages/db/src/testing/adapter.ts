import { DatabaseSync } from "node:sqlite";
import type {
  D1Database,
  D1ExecResult,
  D1Meta,
  D1PreparedStatement,
  D1Result,
} from "@cloudflare/workers-types";

interface StatementSyncLike {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  };
}

type TestD1Meta = D1Meta & Record<string, unknown>;

function d1Meta(changes = 0, lastRowId = 0): TestD1Meta {
  return {
    duration: 0,
    size_after: 0,
    rows_read: 0,
    rows_written: changes,
    last_row_id: lastRowId,
    changed_db: changes > 0,
    changes,
  };
}

function toStatement(
  stmt: StatementSyncLike & { source?: string },
  params: unknown[],
  query?: string
): D1PreparedStatement {
  const statement = {
    bind(...values: unknown[]) {
      return toStatement(stmt, [...params, ...values], query);
    },
    async first<T = unknown>(): Promise<T | null> {
      const row = stmt.get(...params) as T | undefined;
      return row ? ({ ...row } as T) : null;
    },
    async all<T = unknown>(): Promise<D1Result<T>> {
      const rows = (
        stmt.all(...params) as Record<string, unknown>[]
      ).map((row) => ({ ...row })) as T[];
      return {
        success: true,
        meta: d1Meta(),
        results: rows,
      };
    },
    async run<T = unknown>(): Promise<D1Result<T>> {
      const { changes, lastInsertRowid } = stmt.run(...params);
      const numericChanges = Number(changes);
      return {
        success: true,
        meta: d1Meta(numericChanges, Number(lastInsertRowid)),
        results: [],
      };
    },
    async raw<T = unknown[]>(): Promise<T[]> {
      const rows = (
        stmt.all(...params) as Record<string, unknown>[]
      ).map((row) => ({ ...row })) as T[];
      return rows;
    },
  };
  // Structural test double for the abstract D1PreparedStatement:
  // the cast bridges abstract-class typing, not behavior.
  (statement as any).__query = query ?? stmt.source ?? "";
  return statement as unknown as D1PreparedStatement;
}

export interface TestDatabase {
  db: D1Database;
  close(): void;
}

// Test double for the abstract D1Database class, implemented over
// node:sqlite (the same SQLite engine D1 runs on).
export function openTestDatabase(): TestDatabase {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const db = {
    prepare(query: string): D1PreparedStatement {
      return toStatement(sqlite.prepare(query), [], query);
    },
    batch<T = unknown>(
      statements: D1PreparedStatement[],
    ): Promise<D1Result<T>[]> {
      return Promise.all(
        statements.map(async (statement) => {
          const q = ((statement as any).__query || "").trim().toUpperCase();
          if (q.startsWith("SELECT")) {
             return await statement.all() as D1Result<T>;
          }
          return await statement.run() as D1Result<T>;
        }),
      );
    },
    async exec(query: string): Promise<D1ExecResult> {
      sqlite.exec(query);
      return { count: 0, duration: 0 };
    },
  };
  return { db: db as unknown as D1Database, close: () => sqlite.close() };
}
