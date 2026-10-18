import {
  ModelGatewayError,
  type ModelProvider,
  type ModelRequest,
  type ModelResponse,
  type UsageMetadata,
} from "./types.ts";

export const GEMINI_DEFAULT_BASE_URL =
  "https://generativelanguage.googleapis.com";
export const GEMINI_DEFAULT_TIMEOUT_MS = 60_000;

export interface GeminiAdapterOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  parts?: GeminiPart[];
  role?: string;
}

interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
}

interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  usageMetadata?: GeminiUsageMetadata;
}

export class GeminiAdapter implements ModelProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: GeminiAdapterOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl =
      options.baseUrl ?? GEMINI_DEFAULT_BASE_URL;
    // Bọc fetch: tham chiếu trần `fetch` mất `this` trên workerd
    // (illegal invocation) — chỉ tái hiện ở runtime, tests Node vẫn xanh.
    this.fetchImpl =
      options.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
    this.timeoutMs =
      options.timeoutMs ?? GEMINI_DEFAULT_TIMEOUT_MS;
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const timeoutMs = request.timeoutMs ?? this.timeoutMs;
    const start = Date.now();
    let response: Response;
    try {
      response = await this.fetchImpl(
        `${this.baseUrl}/v1beta/models/${request.model}:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": this.apiKey,
          },
          body: JSON.stringify({
            systemInstruction: request.systemPrompt
              ? { parts: [{ text: request.systemPrompt }] }
              : undefined,
            contents: [
              { role: "user", parts: [{ text: request.prompt }] },
            ],
            generationConfig: {
              maxOutputTokens: request.maxOutputTokens,
              temperature: request.temperature,
            },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        },
      );
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      console.error(
        JSON.stringify({
          event: "ai_model_execution",
          provider: "gemini",
          model: request.model,
          status: "network_error",
          durationMs,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      throw err;
    }

    const durationMs = Date.now() - start;
    if (!response.ok) {
      let errDetails = "";
      try {
        errDetails = await response.text();
      } catch {
        // fallback if unreadable
      }
      console.error(
        JSON.stringify({
          event: "ai_model_execution",
          provider: "gemini",
          model: request.model,
          status: "http_error",
          httpStatus: response.status,
          durationMs,
          errorBody: errDetails.slice(0, 500),
        }),
      );
      throw new ModelGatewayError(
        `gemini returned HTTP ${response.status}`,
        "PROVIDER_ERROR",
      );
    }

    const payload = (await response.json()) as GeminiResponse;
    const candidate = payload.candidates?.[0];
    const text = (candidate?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("");
    if (text.length === 0) {
      console.error(
        JSON.stringify({
          event: "ai_model_execution",
          provider: "gemini",
          model: request.model,
          status: "empty_content",
          durationMs,
          finishReason: candidate?.finishReason ?? "UNKNOWN",
        }),
      );
      throw new ModelGatewayError(
        "gemini returned no content",
        "PROVIDER_ERROR",
      );
    }

    const usage = normalizeUsage(payload.usageMetadata);
    console.info(
      JSON.stringify({
        event: "ai_model_execution",
        provider: "gemini",
        model: request.model,
        status: "success",
        durationMs,
        finishReason: candidate?.finishReason ?? "UNKNOWN",
        usage,
      }),
    );

    return {
      text,
      model: request.model,
      finishReason: candidate?.finishReason ?? "UNKNOWN",
      usage,
    };
  }
}

function normalizeUsage(
  usage: GeminiUsageMetadata | undefined,
): UsageMetadata {
  const inputTokens = usage?.promptTokenCount ?? 0;
  const outputTokens = usage?.candidatesTokenCount ?? 0;
  const totalTokens =
    usage?.totalTokenCount ?? inputTokens + outputTokens;
  return { inputTokens, outputTokens, totalTokens };
}
