import { test } from "node:test";
import assert from "node:assert/strict";
import { openMigratedTestDb } from "../testing/helpers.ts";
import {
  createRedirect,
  listRedirects,
  deleteRedirect,
  incrementRedirectHits,
  getRedirectByFromPath,
} from "./redirects.ts";

test("should create, list, increment and delete redirects", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const redirect = {
      id: "redirect-1",
      fromPath: "/old-page",
      toPath: "/new-page",
      statusCode: 301,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createRedirect(db, redirect);
    
    let redirects = await listRedirects(db);
    assert.ok(redirects.length >= 1);
    
    let found = await getRedirectByFromPath(db, "/old-page");
    assert.ok(found);
    assert.equal(found?.toPath, "/new-page");
    
    await incrementRedirectHits(db, "redirect-1");
    found = await getRedirectByFromPath(db, "/old-page");
    assert.equal(found?.hits, 1);
    
    await deleteRedirect(db, "redirect-1");
    found = await getRedirectByFromPath(db, "/old-page");
    assert.equal(found, null);
  } finally {
    close();
  }
});
