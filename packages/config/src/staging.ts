import type { AppConfig } from "./types";

export const stagingConfig: AppConfig = {
  environment: "staging",
  observability: { logLevel: "info", samplingRate: 0.1 },
};
