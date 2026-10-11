import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
  R2Bucket,
  R2Object,
} from "@cloudflare/workers-types";
import { InMemoryQuotaGuard } from "./quota-guard.ts";
import {
  createCountingD1,
  createCountingQueueProducer,
  createCountingR2Bucket,
  recordAnalyticsEvents,
  recordModelUsage,
  recordWorkersRequest,
} from "./quota-tracking.ts";

function recordingGuard(): {
  guard: InMemoryQuotaGuard;
  usage(): Record<string, number | undefined>;
} {
  const guard = new InMemoryQuotaGuard({
    warn: {},
    safe: {},
    stop: {},
  });
  const recorded: Record<string, number> = {};
  const originalRecord = guard.record.bind(guard);
  const proxy = new Proxy(guard, {
    get(target, prop, receiver) {
      if (prop === "record") {
        return (usage: Record<string, number>) => {
          for (const [metric, value] of Object.entries(usage)) {
            recorded[metric] = (recorded[metric] ?? 0) + (value ?? 0);
          }
          return originalRecord(usage);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
  return { guard: proxy, usage: () => recorded };
}

function stubD1(): {
  db: D1Database;
  calls: { prepared: string[]; batched: number; exec: string[] };
} {
  const calls = { prepared: [] as string[], batched: 0, exec: [] as string[] };
  const meta = {
    duration: 0,
    size_after: 0,
    rows_read: 0,
    rows_written: 0,
    last_row_id: 0,
    changed_db: false,
    changes: 0,
  };
  const statement: D1PreparedStatement = {
    bind: () => statement,
    first: async () => null,
    all: async (): Promise<D1Result<unknown>> => ({
      success: true,
      meta,
      results: [],
    }),
    run: async (): Promise<D1Result<unknown>> => ({
      success: true,
      meta,
      results: [],
    }),
    raw: async () => [],
  } as unknown as D1PreparedStatement;
  const db = {
    prepare(query: string) {
      calls.prepared.push(query);
      return statement;
    },
    batch: async (
      statements: D1PreparedStatement[],
    ): Promise<D1Result<unknown>[]> => {
      calls.batched += statements.length;
      return statements.map(() => ({
        success: true,
        meta,
        results: [],
      }));
    },
    exec: async (query: string) => {
      calls.exec.push(query);
      return { count: 0, duration: 0 };
    },
  } as unknown as D1Database;
  return { db, calls };
}

test("counting D1 tracks reads and writes", async () => {
  const { guard, usage } = recordingGuard();
  const { db } = stubD1();
  const counting = createCountingD1(db, guard);

  await counting.prepare("SELECT 1").first();
  await counting.prepare("SELECT 2").all();
  await counting.prepare("SELECT 3").raw();
  await counting.prepare("INSERT INTO t VALUES (1)").run();
  await counting.batch([
    counting.prepare("INSERT INTO t VALUES (2)"),
    counting.prepare("INSERT INTO t VALUES (3)"),
  ]);
  await counting.exec("CREATE TABLE t (id TEXT)");

  assert.equal(usage().d1Reads, 3);
  assert.equal(usage().d1Writes, 4);
});

test("counting D1 batch passes original statements through", async () => {
  const { guard } = recordingGuard();
  const { db, calls } = stubD1();
  const counting = createCountingD1(db, guard);
  const statements = [
    counting.prepare("INSERT INTO t VALUES (1)"),
    counting.prepare("INSERT INTO t VALUES (2)"),
  ];
  await counting.batch(statements);
  assert.equal(calls.batched, 2);
  assert.equal(guard.mode(), "NORMAL");
});

test("counting queue producer counts messages", async () => {
  const { guard, usage } = recordingGuard();
  const sent: unknown[] = [];
  const queue = {
    async send(message: unknown) {
      sent.push(message);
    },
    async sendBatch(messages: unknown[]) {
      sent.push(...messages);
    },
  };
  const counting = createCountingQueueProducer(queue, guard);
  await counting.send({ id: "m1" });
  await counting.sendBatch([{ id: "m2" }, { id: "m3" }]);
  assert.equal(sent.length, 3);
  assert.equal(usage().queueOperations, 3);
});

test("counting R2 bucket counts every operation", async () => {
  const { guard, usage } = recordingGuard();
  const object: R2Object = {
    key: "k",
    size: 1,
    etag: "e",
    httpMetadata: undefined,
    customMetadata: undefined,
    body: null,
    bodyExists: false,
    async text() {
      return "content";
    },
    async arrayBuffer() {
      return new ArrayBuffer(0);
    },
    async json<T>() {
      return {} as T;
    },
    writeHttpMetadata() {},
  } as unknown as R2Object;
  const bucket: R2Bucket = {
    get: async () => object,
    put: async () => object,
    head: async () => object,
    delete: async () => {},
    list: async () => ({ objects: [], truncated: false }),
  } as unknown as R2Bucket;
  const counting = createCountingR2Bucket(bucket, guard);
  await counting.get("k");
  await counting.head("k");
  await counting.put("k", "body");
  await counting.delete("k");
  await counting.list();
  assert.equal(usage().r2Operations, 5);
});

test("helper recorders count their metrics", () => {
  const { guard, usage } = recordingGuard();
  recordWorkersRequest(guard);
  recordWorkersRequest(guard);
  recordAnalyticsEvents(guard, 4);
  recordModelUsage(guard);
  recordModelUsage(guard, 2);
  assert.equal(usage().workersRequests, 2);
  assert.equal(usage().analyticsEvents, 4);
  assert.equal(usage().modelUsage, 3);
});
