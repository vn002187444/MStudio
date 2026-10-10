import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isRehostable,
  mediaAssetKey,
  rehostImage,
} from "./media.ts";
import { sha256Hex } from "./sha256.ts";

test("isRehostable allows clear and licensed only", () => {
  assert.equal(isRehostable("clear"), true);
  assert.equal(isRehostable("licensed"), true);
  assert.equal(isRehostable("unknown"), false);
});

test("mediaAssetKey is deterministic and extension-aware", async () => {
  const key = await mediaAssetKey("https://img.example.com/hero.jpg");
  const digest = await sha256Hex("https://img.example.com/hero.jpg");
  assert.equal(key, `media/${digest}.jpg`);
  assert.equal(
    await mediaAssetKey("https://img.example.com/hero.jpg"),
    key,
  );
  assert.match(
    await mediaAssetKey("https://img.example.com/no-extension"),
    /\.bin$/,
  );
});

test("rehostImage fetches the origin and puts a hashed key", async () => {
  const puts: Array<[string, ArrayBuffer]> = [];
  const bucket = {
    async put(key: string, body: ArrayBuffer) {
      puts.push([key, body]);
    },
  };
  const body = new ArrayBuffer(3);
  const fetchImage = async (url: string): Promise<Response> => {
    assert.equal(url, "https://img.example.com/a.png");
    return new Response(body, { status: 200 });
  };
  const key = await rehostImage(
    bucket,
    "https://img.example.com/a.png",
    { fetchImage },
  );
  assert.equal(puts.length, 1);
  assert.equal(puts[0][0], key);
  assert.deepEqual(
    new Uint8Array(puts[0][1]),
    new Uint8Array(body),
  );
  assert.match(key, /^media\/[0-9a-f]{64}\.png$/);
});

test("rehostImage throws on a non-ok origin response", async () => {
  const bucket = {
    async put(): Promise<void> {},
  };
  await assert.rejects(
    rehostImage(bucket, "https://img.example.com/a.png", {
      fetchImage: async () =>
        new Response("gone", { status: 404 }),
    }),
    /image fetch failed: 404/,
  );
});
