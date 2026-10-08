import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createUser,
  getUser,
  getUserByEmail,
  listUsers,
} from "./users.ts";
import { openMigratedTestDb } from "../testing/helpers.ts";

const NOW = "2026-01-01T00:00:00.000Z";

test("creates and reads a user with default role", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const user = await createUser(db, {
      id: "user-1",
      email: "editor@example.com",
      now: NOW,
    });
    assert.equal(user.role, "analyst");
    assert.deepEqual(await getUser(db, "user-1"), user);
    assert.equal(await getUser(db, "missing"), undefined);
  } finally {
    close();
  }
});

test("gets a user by email", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await createUser(db, {
      id: "user-1",
      email: "editor@example.com",
      role: "editor",
      now: NOW,
    });
    const user = await getUserByEmail(db, "editor@example.com");
    assert.equal(user?.id, "user-1");
    assert.equal(user?.role, "editor");
    assert.equal(await getUserByEmail(db, "nobody@example.com"), undefined);
  } finally {
    close();
  }
});

test("enforces unique email", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await createUser(db, {
      id: "user-1",
      email: "editor@example.com",
      now: NOW,
    });
    await assert.rejects(
      createUser(db, {
        id: "user-2",
        email: "editor@example.com",
        now: NOW,
      }),
    );
  } finally {
    close();
  }
});

test("lists users with pagination", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const stamps = [
      "2026-01-01T00:00:01.000Z",
      "2026-01-01T00:00:02.000Z",
      "2026-01-01T00:00:03.000Z",
    ];
    for (const [index, now] of stamps.entries()) {
      await createUser(db, {
        id: `user-${index + 1}`,
        email: `user${index + 1}@example.com`,
        now,
      });
    }
    const page1 = await listUsers(db, { limit: 2 });
    assert.equal(page1.rows.length, 2);
    assert.ok(page1.nextCursor);
    const page2 = await listUsers(db, { limit: 2, cursor: page1.nextCursor });
    assert.equal(page2.rows.length, 1);
    assert.equal(page2.nextCursor, undefined);
  } finally {
    close();
  }
});
