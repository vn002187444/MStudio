import type { AppConfig } from "./types";

export const devConfig: AppConfig = {
  environment: "dev",
  observability: { logLevel: "debug", samplingRate: 1 },
};
