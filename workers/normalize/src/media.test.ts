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
  const fetchImage = async (url: string, init?: RequestInit): Promise<Response> => {
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

test("rehostImage passes standard browser headers", async () => {
  const bucket = {
    async put(): Promise<void> {},
  };
  const body = new ArrayBuffer(3);
  const fetchImage = async (url: string, init?: RequestInit): Promise<Response> => {
    assert.equal(url, "https://img.example.com/a.png");
    const headers = new Headers(init?.headers);
    assert.equal(
      headers.get("User-Agent"),
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    assert.equal(
      headers.get("Accept"),
      "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    );
    assert.equal(headers.get("Referer"), "https://img.example.com");
    return new Response(body, { status: 200 });
  };
  await rehostImage(
    bucket,
    "https://img.example.com/a.png",
    { fetchImage },
  );
});

test("rehostImage retries without Referer on 403", async () => {
  const bucket = {
    async put(): Promise<void> {},
  };
  const body = new ArrayBuffer(3);
  let attempts = 0;
  const fetchImage = async (url: string, init?: RequestInit): Promise<Response> => {
    attempts++;
    const headers = new Headers(init?.headers);
    if (attempts === 1) {
      assert.equal(headers.get("Referer"), "https://img.example.com");
      return new Response("Forbidden", { status: 403 });
    }
    assert.equal(headers.get("Referer"), null);
    return new Response(body, { status: 200 });
  };
  await rehostImage(
    bucket,
    "https://img.example.com/a.png",
    { fetchImage },
  );
  assert.equal(attempts, 2);
});

test("rehostImage retries without Referer on 401", async () => {
  const bucket = {
    async put(): Promise<void> {},
  };
  const body = new ArrayBuffer(3);
  let attempts = 0;
  const fetchImage = async (url: string, init?: RequestInit): Promise<Response> => {
    attempts++;
    const headers = new Headers(init?.headers);
    if (attempts === 1) {
      assert.equal(headers.get("Referer"), "https://img.example.com");
      return new Response("Unauthorized", { status: 401 });
    }
    assert.equal(headers.get("Referer"), null);
    return new Response(body, { status: 200 });
  };
  await rehostImage(
    bucket,
    "https://img.example.com/a.png",
    { fetchImage },
  );
  assert.equal(attempts, 2);
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
