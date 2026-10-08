import type { LogLevel } from "@mstudio/observability";

export type { LogLevel };

export type Environment = "dev" | "staging" | "production";

export interface ObservabilityConfig {
  logLevel: LogLevel;
  samplingRate: number;
}

export interface AppConfig {
  environment: Environment;
  observability: ObservabilityConfig;
}
