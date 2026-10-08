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
  stmt: StatementSyncLike,
  params: unknown[],
): D1PreparedStatement {
  const statement = {
    bind(...values: unknown[]) {
      return toStatement(stmt, [...params, ...values]);
    },
    first<T = unknown>(): Promise<T | null> {
      try {
        const row = stmt.get(...params) as T | undefined;
        return Promise.resolve(row ? ({ ...row } as T) : null);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    all<T = unknown>(): Promise<D1Result<T>> {
      try {
        const rows = (
          stmt.all(...params) as Record<string, unknown>[]
        ).map((row) => ({ ...row })) as T[];
        return Promise.resolve({
          success: true,
          meta: d1Meta(),
          results: rows,
        });
      } catch (error) {
        return Promise.reject(error);
      }
    },
    run<T = unknown>(): Promise<D1Result<T>> {
      try {
        const { changes, lastInsertRowid } = stmt.run(...params);
        const numericChanges = Number(changes);
        return Promise.resolve({
          success: true,
          meta: d1Meta(numericChanges, Number(lastInsertRowid)),
          results: [],
        });
      } catch (error) {
        return Promise.reject(error);
      }
    },
    raw<T = unknown[]>(): Promise<T[]> {
      try {
        const rows = (
          stmt.all(...params) as Record<string, unknown>[]
        ).map((row) => ({ ...row })) as T[];
        return Promise.resolve(rows);
      } catch (error) {
        return Promise.reject(error);
      }
    },
  };
  // Structural test double for the abstract D1PreparedStatement:
  // the cast bridges abstract-class typing, not behavior.
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
      return toStatement(sqlite.prepare(query), []);
    },
    batch<T = unknown>(
      statements: D1PreparedStatement[],
    ): Promise<D1Result<T>[]> {
      return Promise.all(
        statements.map((statement) => statement.run() as Promise<D1Result<T>>),
      );
    },
    exec(query: string): Promise<D1ExecResult> {
      try {
        sqlite.exec(query);
        return Promise.resolve({ count: 0, duration: 0 });
      } catch (error) {
        return Promise.reject(error);
      }
    },
  };
  return { db: db as unknown as D1Database, close: () => sqlite.close() };
}
