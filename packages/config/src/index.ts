import { devConfig } from "./dev";
import { productionConfig } from "./production";
import { stagingConfig } from "./staging";
import type { AppConfig, Environment } from "./types";

const configs: Record<Environment, AppConfig> = {
  dev: devConfig,
  staging: stagingConfig,
  production: productionConfig,
};

export function getConfig(environment: Environment): AppConfig {
  return configs[environment];
}

export { devConfig, stagingConfig, productionConfig };
export type { AppConfig, Environment, LogLevel } from "./types";
