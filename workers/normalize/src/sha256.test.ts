import assert from "node:assert/strict";
import { test } from "node:test";
import * as nodeCrypto from "node:crypto";
import { sha256Hex } from "./sha256.ts";

// Polyfill global crypto for Node.js test environment if missing
if (!("crypto" in globalThis)) {
  Object.defineProperty(globalThis, "crypto", {
    value: nodeCrypto.webcrypto,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

test("sha256Hex", async (t) => {
  await t.test("hashes an empty string correctly", async () => {
    const hash = await sha256Hex("");
    assert.equal(
      hash,
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  await t.test("hashes a simple string correctly", async () => {
    const hash = await sha256Hex("hello world");
    assert.equal(
      hash,
      "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    );
  });

  await t.test("hashes a string with special/unicode characters correctly", async () => {
    const hash = await sha256Hex("你好，世界");
    assert.equal(
      hash,
      "46932f1e6ea5216e77f58b1908d72ec9322ed129318c6d4bd4450b5eaab9d7e7",
    );
  });
});
