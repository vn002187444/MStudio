import assert from "node:assert/strict";
import { test } from "node:test";
import { sha256Hex } from "./sha256.ts";

test("sha256Hex computes the correct hash for empty string", async () => {
  const hash = await sha256Hex("");
  // The sha256 of empty string is e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  assert.equal(hash, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
});

test("sha256Hex computes the correct hash for a standard string", async () => {
  const hash = await sha256Hex("hello world");
  // sha256 of "hello world" is b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
  assert.equal(hash, "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
});

test("sha256Hex computes the correct hash for string with special characters", async () => {
  const hash = await sha256Hex("🔥 emoji and symbols! @#$");
  // Pre-calculated hash
  const expected = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("🔥 emoji and symbols! @#$"))
    .then(digest => Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join(""));
  assert.equal(hash, expected);
});

test("sha256Hex is deterministic", async () => {
  const result1 = await sha256Hex("test string");
  const result2 = await sha256Hex("test string");
  assert.equal(result1, result2);
});
