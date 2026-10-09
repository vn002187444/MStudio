import {
  ModelGatewayError,
  type ModelRequest,
  type ModelProvider,
  type ModelResponse,
} from "./types.ts";

export const DEFAULT_GATEWAY_TIMEOUT_MS = 60_000;

export class TimeoutError extends Error {
  constructor() {
    super("operation timed out");
    this.name = "TimeoutError";
  }
}

export interface GatewayOptions {
  provider: ModelProvider;
  defaultTimeoutMs?: number;
}

export class ModelGateway {
  private readonly provider: ModelProvider;
  private readonly defaultTimeoutMs: number;

  constructor(options: GatewayOptions) {
    this.provider = options.provider;
    this.defaultTimeoutMs =
      options.defaultTimeoutMs ?? DEFAULT_GATEWAY_TIMEOUT_MS;
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const timeoutMs = request.timeoutMs ?? this.defaultTimeoutMs;
    try {
      return await withTimeout(
        this.provider.generate(request),
        timeoutMs,
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw new ModelGatewayError(
          `model request timed out after ${timeoutMs}ms`,
          "TIMEOUT",
        );
      }
      if (error instanceof ModelGatewayError) {
        throw error;
      }
      throw new ModelGatewayError(
        error instanceof Error ? error.message : "unknown error",
        "UNKNOWN",
      );
    }
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError());
    }, timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
