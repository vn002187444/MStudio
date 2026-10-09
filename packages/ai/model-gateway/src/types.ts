export interface ModelRequest {
  model: string;
  prompt: string;
  systemPrompt?: string;
  maxOutputTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface UsageMetadata {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ModelResponse {
  text: string;
  model: string;
  finishReason: string;
  usage: UsageMetadata;
}

export type ModelErrorCode =
  | "TIMEOUT"
  | "PROVIDER_ERROR"
  | "UNKNOWN";

export class ModelGatewayError extends Error {
  readonly code: ModelErrorCode;

  constructor(message: string, code: ModelErrorCode) {
    super(message);
    this.name = "ModelGatewayError";
    this.code = code;
  }
}

export interface ModelProvider {
  generate(request: ModelRequest): Promise<ModelResponse>;
}
