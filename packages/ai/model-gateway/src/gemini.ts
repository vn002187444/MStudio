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
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs =
      options.timeoutMs ?? GEMINI_DEFAULT_TIMEOUT_MS;
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const timeoutMs = request.timeoutMs ?? this.timeoutMs;
    const response = await this.fetchImpl(
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
    if (!response.ok) {
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
      throw new ModelGatewayError(
        "gemini returned no content",
        "PROVIDER_ERROR",
      );
    }
    return {
      text,
      model: request.model,
      finishReason: candidate?.finishReason ?? "UNKNOWN",
      usage: normalizeUsage(payload.usageMetadata),
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
