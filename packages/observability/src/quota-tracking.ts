import type {
  D1Database,
  D1ExecResult,
  D1PreparedStatement,
  D1Result,
  R2Bucket,
  R2Object,
} from "@cloudflare/workers-types";
import type { QuotaGuard, QuotaMetric } from "./quota-guard.ts";

function record(
  guard: QuotaGuard,
  metric: QuotaMetric,
  amount = 1,
): void {
  if (amount <= 0) {
    return;
  }
  guard.record({ [metric]: amount });
}

export function recordWorkersRequest(guard: QuotaGuard): void {
  record(guard, "workersRequests");
}

export function recordAnalyticsEvents(
  guard: QuotaGuard,
  events: number,
): void {
  record(guard, "analyticsEvents", events);
}

export function recordModelUsage(
  guard: QuotaGuard,
  calls = 1,
): void {
  record(guard, "modelUsage", calls);
}

export interface QueueProducerLike<Message = unknown> {
  send(message: Message, options?: unknown): Promise<unknown>;
  sendBatch(
    messages: Iterable<Message>,
    options?: unknown,
  ): Promise<unknown>;
}

/**
 * Wraps a queue producer so every send/sendBatch counts against
 * the quota guard's queueOperations metric (one message = one
 * operation).
 */
export function createCountingQueueProducer<Message = unknown>(
  queue: QueueProducerLike<Message>,
  guard: QuotaGuard,
): QueueProducerLike<Message> {
  return {
    async send(message: Message, options?: unknown): Promise<unknown> {
      record(guard, "queueOperations");
      return queue.send(message, options);
    },
    async sendBatch(
      messages: Iterable<Message>,
      options?: unknown,
    ): Promise<unknown> {
      const batch = Array.isArray(messages) ? messages : [...messages];
      record(guard, "queueOperations", batch.length);
      return queue.sendBatch(batch, options);
    },
  };
}

// Batch is used for write batches in this codebase (see
// createRawItems), so a batch counts as d1Writes up front and
// the original statements are passed through untouched — no
// double counting.
const originalStatements = new WeakMap<
  D1PreparedStatement,
  D1PreparedStatement
>();

/**
 * Wraps a D1 database so reads (first/all/raw) count as
 * d1Reads and writes (run/exec/batch) count as d1Writes.
 */
export function createCountingD1(
  db: D1Database,
  guard: QuotaGuard,
): D1Database {
  const wrapStatement = (
    statement: D1PreparedStatement,
  ): D1PreparedStatement => {
    const wrapped = {
      bind(...values: unknown[]): D1PreparedStatement {
        return wrapStatement(statement.bind(...values));
      },
      async first<T = unknown>(): Promise<T | null> {
        record(guard, "d1Reads");
        return statement.first<T>();
      },
      async all<T = unknown>(): Promise<D1Result<T>> {
        record(guard, "d1Reads");
        return statement.all<T>();
      },
      async run<T = unknown>(): Promise<D1Result<T>> {
        record(guard, "d1Writes");
        return statement.run<T>();
      },
      async raw<T = unknown[]>(): Promise<T[]> {
        record(guard, "d1Reads");
        return statement.raw<T>();
      },
    } as unknown as D1PreparedStatement;
    originalStatements.set(wrapped, statement);
    return wrapped;
  };

  return {
    prepare(query: string): D1PreparedStatement {
      return wrapStatement(db.prepare(query));
    },
    batch<T = unknown>(
      statements: D1PreparedStatement[],
    ): Promise<D1Result<T>[]> {
      record(guard, "d1Writes", statements.length);
      return db.batch<T>(
        statements.map(
          (statement) => originalStatements.get(statement) ?? statement,
        ),
      );
    },
    async exec(query: string): Promise<D1ExecResult> {
      record(guard, "d1Writes");
      return db.exec(query);
    },
  } as unknown as D1Database;
}

/**
 * Wraps an R2 bucket so every get/put/head/delete/list counts
 * against the quota guard's r2Operations metric.
 */
export function createCountingR2Bucket(
  bucket: R2Bucket,
  guard: QuotaGuard,
): R2Bucket {
  function countAnd<T>(action: () => Promise<T>): Promise<T> {
    record(guard, "r2Operations");
    return action();
  }
  return {
    get: (...args: Parameters<R2Bucket["get"]>) =>
      countAnd(() => bucket.get(...args)),
    put: (...args: Parameters<R2Bucket["put"]>) =>
      countAnd(() => bucket.put(...args)),
    head: (...args: Parameters<R2Bucket["head"]>) =>
      countAnd(() => bucket.head(...args)),
    delete: (...args: Parameters<R2Bucket["delete"]>) =>
      countAnd(() => bucket.delete(...args)),
    list: (...args: Parameters<R2Bucket["list"]>) =>
      countAnd(() => bucket.list(...args)),
  } as unknown as R2Bucket;
}

export type { R2Object };
