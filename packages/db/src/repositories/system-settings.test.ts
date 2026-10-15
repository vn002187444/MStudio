import { test } from "node:test";
import assert from "node:assert/strict";
import { openMigratedTestDb } from "../testing/helpers.ts";
import {
  setSystemSetting,
  getSystemSetting,
} from "./system-settings.ts";

test("should set and get system setting", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await setSystemSetting(db, "test_key", "test_value");
    
    let setting = await getSystemSetting(db, "test_key");
    assert.ok(setting);
    assert.equal(setting?.value, "test_value");
    
    await setSystemSetting(db, "test_key", "new_value");
    setting = await getSystemSetting(db, "test_key");
    assert.ok(setting);
    assert.equal(setting?.value, "new_value");
    
    let notFound = await getSystemSetting(db, "non_existent");
    assert.equal(notFound, null);
  } finally {
    close();
  }
});
