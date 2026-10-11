import assert from "node:assert/strict";
import { test } from "node:test";
import {
  analyticsModelUsageSource,
  CompositeModelUsageSource,
  type ModelUsageSource,
} from "./model-usage-source.ts";

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function mockFetch(
  responses: Response[],
): { fetchImpl: typeof fetch; urls: string[] } {
  const urls: string[] = [];
  const fetchImpl = (async (url: string | URL | Request) => {
    urls.push(String(url));
    const response = responses.shift();
    if (!response) {
      throw new Error("unexpected fetch");
    }
    return response;
  }) as typeof fetch;
  return { fetchImpl, urls };
}

test("analyticsModelUsageSource reads model usage from the analytics worker", async () => {
  const { fetchImpl, urls } = mockFetch([
    jsonResponse({ modelUsage: 42, windowHours: 24 }),
  ]);
  const source = analyticsModelUsageSource(
    "https://analytics.example.com",
    fetchImpl,
  );
  assert.equal(await source.readModelUsage(), 42);
  assert.deepEqual(urls, [
    "https://analytics.example.com/internal/model-usage",
  ]);
});

test("analyticsModelUsageSource trims trailing slashes on the base URL", async () => {
  const { fetchImpl, urls } = mockFetch([
    jsonResponse({ modelUsage: 0 }),
  ]);
  const source = analyticsModelUsageSource(
    "https://analytics.example.com/",
    fetchImpl,
  );
  await source.readModelUsage();
  assert.deepEqual(urls, [
    "https://analytics.example.com/internal/model-usage",
  ]);
});

test("analyticsModelUsageSource throws on non-OK responses", async () => {
  const { fetchImpl } = mockFetch([jsonResponse({}, 500)]);
  const source = analyticsModelUsageSource(
    "https://analytics.example.com",
    fetchImpl,
  );
  await assert.rejects(source.readModelUsage(), /HTTP 500/);
});

test("analyticsModelUsageSource throws when the response is malformed", async () => {
  const { fetchImpl } = mockFetch([jsonResponse({})]);
  const source = analyticsModelUsageSource(
    "https://analytics.example.com",
    fetchImpl,
  );
  await assert.rejects(source.readModelUsage(), /modelUsage/);
});

test("CompositeModelUsageSource sums across sources", async () => {
  const constant = (value: number): ModelUsageSource => ({
    async readModelUsage() {
      return value;
    },
  });
  const composite = new CompositeModelUsageSource([
    constant(10),
    constant(32),
  ]);
  assert.equal(await composite.readModelUsage(), 42);
});
