import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkRateLimit,
  createSession,
  generateToken,
  hashToken,
  listAuditLog,
  recordAudit,
  verifySession,
} from "./auth.ts";
import { openMigratedTestDb } from "../testing/helpers.ts";

const FUTURE = "2099-01-01T00:00:00.000Z";
const PAST = "2000-01-01T00:00:00.000Z";
const NOW = "2026-10-10T00:00:00.000Z";

test("createSession returns an opaque token and verifySession resolves the identity", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const { token, session } = await createSession(db, {
      userId: "user-1",
      role: "admin",
      expiresAt: FUTURE,
    });
    assert.equal(session.userId, "user-1");
    assert.equal(session.role, "admin");
    assert.equal(token.length, 64);
    assert.notEqual(token, session.tokenHash);
    const identity = await verifySession(db, token, NOW);
    assert.deepEqual(identity, { userId: "user-1", role: "admin" });
  } finally {
    close();
  }
});

test("verifySession rejects an unknown token", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const identity = await verifySession(
      db,
      generateToken(),
      NOW,
    );
    assert.equal(identity, undefined);
  } finally {
    close();
  }
});

test("verifySession rejects an expired session", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const { token } = await createSession(db, {
      userId: "user-1",
      role: "editor",
      expiresAt: PAST,
    });
    const identity = await verifySession(db, token, NOW);
    assert.equal(identity, undefined);
  } finally {
    close();
  }
});

test("createSession rejects an invalid role", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await assert.rejects(
      createSession(db, {
        userId: "user-1",
        role: "superadmin" as never,
        expiresAt: FUTURE,
      }),
      /invalid role/,
    );
  } finally {
    close();
  }
});

test("hashToken is a deterministic SHA-256 hex digest", async () => {
  const digest = await hashToken("token-abc");
  assert.equal(digest.length, 64);
  assert.match(digest, /^[0-9a-f]{64}$/);
  assert.equal(digest, await hashToken("token-abc"));
  assert.notEqual(digest, await hashToken("token-abd"));
});

test("recordAudit appends rows that listAuditLog returns newest first", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await recordAudit(db, {
      actor: "user-admin",
      action: "source.create",
      at: "2026-10-10T00:00:01.000Z",
    });
    await recordAudit(db, {
      actor: "user-admin",
      action: "source.allow-status",
      target: "src-1",
      at: "2026-10-10T00:00:02.000Z",
    });
    const entries = await listAuditLog(db);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].action, "source.allow-status");
    assert.equal(entries[0].target, "src-1");
    assert.equal(entries[1].actor, "user-admin");
    assert.equal(entries[1].target, undefined);
  } finally {
    close();
  }
});

test("checkRateLimit allows up to the limit then blocks within a window", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const first = await checkRateLimit(db, "1.2.3.4", "w1", 2);
    assert.deepEqual(first, { allowed: true, count: 1 });
    const second = await checkRateLimit(db, "1.2.3.4", "w1", 2);
    assert.deepEqual(second, { allowed: true, count: 2 });
    const third = await checkRateLimit(db, "1.2.3.4", "w1", 2);
    assert.deepEqual(third, { allowed: false, count: 3 });
    const otherIp = await checkRateLimit(db, "5.6.7.8", "w1", 2);
    assert.deepEqual(otherIp, { allowed: true, count: 1 });
    const otherWindow = await checkRateLimit(
      db,
      "1.2.3.4",
      "w2",
      2,
    );
    assert.deepEqual(otherWindow, { allowed: true, count: 1 });
  } finally {
    close();
  }
});
