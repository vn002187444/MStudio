export interface FeatureFlags {
  isEnabled(feature: string): boolean;
  set(feature: string, enabled: boolean): void;
  list(): Record<string, boolean>;
}

export function createFeatureFlags(
  initial: Record<string, boolean> = {},
): FeatureFlags {
  const flags = new Map<string, boolean>(Object.entries(initial));
  return {
    isEnabled(feature) {
      return flags.get(feature) ?? true;
    },
    set(feature, enabled) {
      flags.set(feature, enabled);
    },
    list() {
      return Object.fromEntries(flags.entries());
    },
  };
}

function toFeatureName(name: string): string {
  const parts = name.toLowerCase().split("_").filter(Boolean);
  const [first = "", ...rest] = parts;
  return [
    first,
    ...rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)),
  ].join("");
}

export function flagsFromEnv(
  env: Record<string, string | undefined>,
  prefix = "FEATURE_",
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith(prefix)) continue;
    const feature = toFeatureName(key.slice(prefix.length));
    result[feature] = !["off", "false", "0", "disabled"].includes(
      String(value).toLowerCase(),
    );
  }
  return result;
}
