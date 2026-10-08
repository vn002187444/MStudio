import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createSource,
  getSource,
  listSources,
  setSourceAllowStatus,
  type SourceKind,
} from "./sources.ts";
import { openMigratedTestDb } from "../testing/helpers.ts";

test("creates and reads a source with defaults", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const created = await createSource(db, {
      id: "src-1",
      name: "Example News",
      originUrl: "https://example.com",
      kind: "rss",
      now: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(created.id, "src-1");
    assert.equal(created.kind, "rss");
    assert.equal(created.rightsStatus, "unknown");
    assert.equal(created.allowStatus, "pending");
    assert.equal(created.createdAt, "2026-01-01T00:00:00.000Z");
    const read = await getSource(db, "src-1");
    assert.deepEqual(read, created);
    assert.equal(await getSource(db, "missing"), undefined);
  } finally {
    close();
  }
});

test("lists sources with keyset pagination", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const stamps = [
      "2026-01-01T00:00:01.000Z",
      "2026-01-01T00:00:02.000Z",
      "2026-01-01T00:00:03.000Z",
    ];
    for (const [index, now] of stamps.entries()) {
      await createSource(db, {
        id: `src-${index + 1}`,
        name: `Source ${index + 1}`,
        originUrl: `https://example.com/${index + 1}`,
        kind: "rss",
        now,
      });
    }
    const page1 = await listSources(db, { limit: 2 });
    assert.equal(page1.rows.length, 2);
    assert.equal(page1.rows[0].id, "src-1");
    assert.ok(page1.nextCursor);
    const page2 = await listSources(db, {
      limit: 2,
      cursor: page1.nextCursor,
    });
    assert.equal(page2.rows.length, 1);
    assert.equal(page2.rows[0].id, "src-3");
    assert.equal(page2.nextCursor, undefined);
  } finally {
    close();
  }
});

test("updates allow status and reports missing ids", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await createSource(db, {
      id: "src-1",
      name: "Example",
      originUrl: "https://example.com",
      kind: "rss",
      now: "2026-01-01T00:00:00.000Z",
    });
    const updated = await setSourceAllowStatus(db, "src-1", "approved");
    assert.equal(updated?.allowStatus, "approved");
    assert.equal(
      await setSourceAllowStatus(db, "missing", "approved"),
      undefined,
    );
  } finally {
    close();
  }
});

test("rejects an invalid source kind via check constraint", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await assert.rejects(
      createSource(db, {
        id: "src-bad",
        name: "Bad",
        originUrl: "https://example.com",
        kind: "nope" as SourceKind,
        now: "2026-01-01T00:00:00.000Z",
      }),
    );
  } finally {
    close();
  }
});
