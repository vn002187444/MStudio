import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GeminiAdapter,
  GEMINI_DEFAULT_BASE_URL,
} from "./gemini.ts";
import {
  ModelGateway,
  ModelGatewayError,
  withTimeout,
} from "./index.ts";
import type {
  ModelProvider,
  ModelRequest,
  ModelResponse,
} from "./types.ts";

const REQUEST: ModelRequest = {
  model: "gemini-2.0-flash",
  prompt: "Summarize the evidence",
  systemPrompt: "You are an evidence desk assistant",
  maxOutputTokens: 512,
  temperature: 0.2,
};

const RESPONSE: ModelResponse = {
  text: "The claim is supported by two independent sources",
  model: REQUEST.model,
  finishReason: "STOP",
  usage: { inputTokens: 12, outputTokens: 34, totalTokens: 46 },
};

function mockProvider(
  impl: (request: ModelRequest) => Promise<ModelResponse>,
): { provider: ModelProvider; calls: ModelRequest[] } {
  const calls: ModelRequest[] = [];
  return {
    provider: {
      async generate(request: ModelRequest) {
        calls.push(request);
        return impl(request);
      },
    },
    calls,
  };
}

test("gateway delegates to the provider and returns the response", async () => {
  const { provider, calls } = mockProvider(async () => RESPONSE);
  const gateway = new ModelGateway({ provider });
  const response = await gateway.generate(REQUEST);
  assert.deepEqual(response, RESPONSE);
  assert.deepEqual(calls, [REQUEST]);
});

test("gateway wraps unknown provider errors as UNKNOWN", async () => {
  const { provider } = mockProvider(async () => {
    throw new Error("provider exploded");
  });
  const gateway = new ModelGateway({ provider });
  await assert.rejects(
    gateway.generate(REQUEST),
    (error: unknown) => {
      assert.ok(error instanceof ModelGatewayError);
      assert.equal(error.code, "UNKNOWN");
      assert.equal(error.message, "provider exploded");
      return true;
    },
  );
});

test("gateway applies the default timeout", async () => {
  const { provider } = mockProvider(
    () => new Promise<ModelResponse>(() => {}),
  );
  const gateway = new ModelGateway({
    provider,
    defaultTimeoutMs: 25,
  });
  await assert.rejects(
    gateway.generate(REQUEST),
    (error: unknown) => {
      assert.ok(error instanceof ModelGatewayError);
      assert.equal(error.code, "TIMEOUT");
      return true;
    },
  );
});

test("request timeout overrides the gateway default", async () => {
  const { provider } = mockProvider(
    () => new Promise<ModelResponse>(() => {}),
  );
  const gateway = new ModelGateway({
    provider,
    defaultTimeoutMs: 5_000,
  });
  await assert.rejects(
    gateway.generate({ ...REQUEST, timeoutMs: 25 }),
    (error: unknown) => {
      assert.ok(error instanceof ModelGatewayError);
      assert.equal(error.code, "TIMEOUT");
      return true;
    },
  );
});

test("withTimeout resolves before the deadline", async () => {
  const result = await withTimeout(
    Promise.resolve("value"),
    1_000,
  );
  assert.equal(result, "value");
});

test("withTimeout rejects with TimeoutError", async () => {
  await assert.rejects(
    withTimeout(new Promise<string>(() => {}), 25),
    (error: unknown) => error instanceof Error &&
      error.name === "TimeoutError",
  );
});

function geminiPayload() {
  return {
    candidates: [
      {
        content: {
          parts: [
            { text: "First paragraph. " },
            { text: "Second paragraph." },
          ],
          role: "model",
        },
        finishReason: "STOP",
      },
    ],
    usageMetadata: {
      promptTokenCount: 12,
      candidatesTokenCount: 34,
      totalTokenCount: 46,
    },
  };
}

function mockGeminiFetch(
  payload: unknown,
  status = 200,
): {
  fetchImpl: typeof fetch;
  calls: Array<{ url: string; init: RequestInit | undefined }>;
} {
  const calls: Array<{
    url: string;
    init: RequestInit | undefined;
  }> = [];
  const fetchImpl = (async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    const target =
      typeof url === "string" ? url : url.toString();
    calls.push({ url: target, init });
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  return { fetchImpl, calls };
}

test("gemini adapter sends the expected request shape", async () => {
  const { fetchImpl, calls } = mockGeminiFetch(
    geminiPayload(),
  );
  const adapter = new GeminiAdapter({
    apiKey: "test-key",
    fetchImpl,
  });
  const response = await adapter.generate(REQUEST);
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    `${GEMINI_DEFAULT_BASE_URL}/v1beta/models/gemini-2.0-flash:generateContent`,
  );
  assert.equal(
    calls[0].init?.method,
    "POST",
  );
  const headers = calls[0].init?.headers as Record<
    string,
    string
  >;
  assert.equal(headers["x-goog-api-key"], "test-key");
  const body = JSON.parse(
    String(calls[0].init?.body),
  ) as {
    systemInstruction: { parts: Array<{ text: string }> };
    contents: Array<{
      role: string;
      parts: Array<{ text: string }>;
    }>;
    generationConfig: {
      maxOutputTokens?: number;
      temperature?: number;
    };
  };
  assert.deepEqual(body.systemInstruction, {
    parts: [{ text: "You are an evidence desk assistant" }],
  });
  assert.deepEqual(body.contents, [
    {
      role: "user",
      parts: [{ text: "Summarize the evidence" }],
    },
  ]);
  assert.equal(body.generationConfig.maxOutputTokens, 512);
  assert.equal(body.generationConfig.temperature, 0.2);
  assert.deepEqual(response.text, "First paragraph. Second paragraph.");
  assert.equal(response.model, REQUEST.model);
  assert.equal(response.finishReason, "STOP");
  assert.deepEqual(response.usage, {
    inputTokens: 12,
    outputTokens: 34,
    totalTokens: 46,
  });
});

test("gemini adapter maps HTTP errors to PROVIDER_ERROR", async () => {
  const { fetchImpl } = mockGeminiFetch(
    { error: { message: "quota exceeded" } },
    429,
  );
  const adapter = new GeminiAdapter({
    apiKey: "test-key",
    fetchImpl,
  });
  await assert.rejects(
    adapter.generate(REQUEST),
    (error: unknown) => {
      assert.ok(error instanceof ModelGatewayError);
      assert.equal(error.code, "PROVIDER_ERROR");
      assert.equal(error.message, "gemini returned HTTP 429");
      return true;
    },
  );
});

test("gemini adapter maps empty content to PROVIDER_ERROR", async () => {
  const { fetchImpl } = mockGeminiFetch({
    candidates: [{ content: { parts: [] } }],
  });
  const adapter = new GeminiAdapter({
    apiKey: "test-key",
    fetchImpl,
  });
  await assert.rejects(
    adapter.generate(REQUEST),
    (error: unknown) => {
      assert.ok(error instanceof ModelGatewayError);
      assert.equal(error.code, "PROVIDER_ERROR");
      assert.equal(error.message, "gemini returned no content");
      return true;
    },
  );
});

test("gemini adapter normalizes missing usage metadata", async () => {
  const { fetchImpl } = mockGeminiFetch({
    candidates: [
      {
        content: { parts: [{ text: "Hello" }] },
        finishReason: "STOP",
      },
    ],
  });
  const adapter = new GeminiAdapter({
    apiKey: "test-key",
    fetchImpl,
  });
  const response = await adapter.generate(REQUEST);
  assert.deepEqual(response.usage, {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  });
});

test("gemini adapter falls back to summed tokens", async () => {
  const { fetchImpl } = mockGeminiFetch({
    candidates: [
      {
        content: { parts: [{ text: "Hello" }] },
        finishReason: "STOP",
      },
    ],
    usageMetadata: {
      promptTokenCount: 7,
      candidatesTokenCount: 3,
    },
  });
  const adapter = new GeminiAdapter({
    apiKey: "test-key",
    fetchImpl,
  });
  const response = await adapter.generate(REQUEST);
  assert.deepEqual(response.usage, {
    inputTokens: 7,
    outputTokens: 3,
    totalTokens: 10,
  });
});

test("gemini adapter times out via abort signal", async () => {
  const timeoutError = (): Error => {
    const error = new Error("The operation was aborted due to timeout");
    error.name = "TimeoutError";
    return error;
  };
  const fetchImpl = (async (
    _url: string | URL | Request,
    init?: RequestInit,
  ) => {
    await new Promise<never>((_resolve, reject) => {
      const signal = init?.signal;
      if (!signal) return;
      if (signal.aborted) {
        reject(timeoutError());
        return;
      }
      signal.addEventListener("abort", () => reject(timeoutError()), {
        once: true,
      });
    });
    return new Response("{}");
  }) as typeof fetch;
  const adapter = new GeminiAdapter({
    apiKey: "test-key",
    fetchImpl,
    timeoutMs: 25,
  });
  await assert.rejects(
    adapter.generate(REQUEST),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.name, "TimeoutError");
      return true;
    },
  );
});
