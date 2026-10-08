import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createJob,
  getJob,
  listJobsByStatus,
  startJob,
  updateJobStatus,
} from "./jobs.ts";
import { openMigratedTestDb } from "../testing/helpers.ts";

const NOW = "2026-01-01T00:00:00.000Z";

test("creates a pending job with defaults", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const job = await createJob(db, {
      id: "job-1",
      type: "fetch_feed",
      correlationId: "cid-1",
      now: NOW,
    });
    assert.equal(job.status, "pending");
    assert.equal(job.attempt, 0);
    assert.equal(job.maxAttempts, 3);
    assert.equal(job.payload, "{}");
    assert.equal(job.correlationId, "cid-1");
    assert.equal(await getJob(db, "missing"), undefined);
  } finally {
    close();
  }
});

test("starts a pending job once", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await createJob(db, { id: "job-1", type: "fetch_feed", now: NOW });
    assert.equal(await startJob(db, "job-1", NOW), true);
    const running = await getJob(db, "job-1");
    assert.equal(running?.status, "running");
    assert.equal(running?.attempt, 1);
    assert.equal(running?.startedAt, NOW);
    assert.equal(await startJob(db, "job-1", NOW), false);
    const still = await getJob(db, "job-1");
    assert.equal(still?.attempt, 1);
  } finally {
    close();
  }
});

test("marks a job failed with error details", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await createJob(db, { id: "job-1", type: "fetch_feed", now: NOW });
    await startJob(db, "job-1", NOW);
    const failed = await updateJobStatus(db, "job-1", "failed", {
      code: "FETCH_FAILED",
      message: "ETIMEDOUT",
    });
    assert.equal(failed?.status, "failed");
    assert.equal(failed?.errorCode, "FETCH_FAILED");
    assert.equal(failed?.errorMessage, "ETIMEDOUT");
    assert.ok(failed?.finishedAt);
  } finally {
    close();
  }
});

test("marks a job succeeded", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await createJob(db, { id: "job-1", type: "fetch_feed", now: NOW });
    const done = await updateJobStatus(db, "job-1", "succeeded");
    assert.equal(done?.status, "succeeded");
    assert.equal(done?.errorCode, undefined);
    assert.ok(done?.finishedAt);
  } finally {
    close();
  }
});

test("lists jobs by status with pagination", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const stamps = [
      "2026-01-01T00:00:01.000Z",
      "2026-01-01T00:00:02.000Z",
      "2026-01-01T00:00:03.000Z",
    ];
    for (const [index, now] of stamps.entries()) {
      await createJob(db, {
        id: `job-${index + 1}`,
        type: "fetch_feed",
        now,
      });
    }
    const page1 = await listJobsByStatus(db, "pending", { limit: 2 });
    assert.equal(page1.rows.length, 2);
    assert.ok(page1.nextCursor);
    const page2 = await listJobsByStatus(db, "pending", {
      limit: 2,
      cursor: page1.nextCursor,
    });
    assert.equal(page2.rows.length, 1);
    assert.equal(page2.nextCursor, undefined);
  } finally {
    close();
  }
});
