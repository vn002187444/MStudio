import assert from "node:assert/strict";
import { test } from "node:test";
import type { Logger } from "@mstudio/observability";
import { openMigratedTestDb } from "@mstudio/db/testing";
import { runScheduler } from "./scheduler.ts";

interface CapturedLog {
  message: string;
  data: Record<string, unknown>;
}

interface CapturingLogger extends Logger {
  logs: CapturedLog[];
}

function capturingLogger(): CapturingLogger {
  const logs: CapturedLog[] = [];
  const handler = (
    message: string,
    data?: Record<string, unknown>,
  ) => {
    logs.push({ message, data: data ?? {} });
  };
  return {
    debug: handler,
    info: handler,
    warn: handler,
    error: handler,
    logs,
  };
}

test("QUOTA_MODE=STOP defers the whole ingest run", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const logger = capturingLogger();
    const env = {
      DB: db,
      ENVIRONMENT: "test",
      LOG_LEVEL: "error",
      QUOTA_MODE: "STOP",
    } as unknown as Env;
    const result = await runScheduler(env, logger);
    assert.deepEqual(result, {
      feeds: 0,
      enqueued: 0,
      duplicates: 0,
      failed: 0,
    });
    const deferred = logger.logs.find(
      (entry) => entry.message === "ingest_deferred_quota",
    );
    assert.equal(deferred?.data.mode, "STOP");
  } finally {
    close();
  }
});
