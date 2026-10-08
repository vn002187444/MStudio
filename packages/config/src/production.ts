import type { AppConfig } from "./types";

export const productionConfig: AppConfig = {
  environment: "production",
  observability: { logLevel: "info", samplingRate: 0.05 },
};
