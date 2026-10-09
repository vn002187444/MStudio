import assert from "node:assert/strict";
import { test } from "node:test";
import { sha256Hex } from "./sha256.ts";

test("sha256Hex returns correct hash for a known string", async () => {
  const input = "hello world";
  // SHA-256 of "hello world"
  const expected = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";
  const result = await sha256Hex(input);
  assert.equal(result, expected);
});

test("sha256Hex handles empty string correctly", async () => {
  const input = "";
  // SHA-256 of an empty string
  const expected = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const result = await sha256Hex(input);
  assert.equal(result, expected);
});

test("sha256Hex is deterministic", async () => {
  const input = "test string";
  const result1 = await sha256Hex(input);
  const result2 = await sha256Hex(input);
  assert.equal(result1, result2);
});
