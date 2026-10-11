export type QuotaMode = "NORMAL" | "WARN" | "SAFE" | "STOP";

export type QuotaMetric =
  | "workersRequests"
  | "d1Reads"
  | "d1Writes"
  | "queueOperations"
  | "r2Operations"
  | "vectorizeDimensions"
  | "analyticsEvents"
  | "modelUsage";

export type QuotaUsage = Partial<Record<QuotaMetric, number>>;

export interface QuotaThresholds {
  warn: QuotaUsage;
  safe: QuotaUsage;
  stop: QuotaUsage;
}

export interface QuotaGuard {
  mode(): QuotaMode;
  record(usage: QuotaUsage): void;
  canPerform(metric: QuotaMetric): boolean;
}

const MODE_ORDER: readonly QuotaMode[] = ["NORMAL", "WARN", "SAFE", "STOP"];

const EXPENSIVE_METRICS: readonly QuotaMetric[] = [
  "queueOperations",
  "r2Operations",
  "vectorizeDimensions",
  "analyticsEvents",
  "modelUsage",
];

// Reads and serving stay available in SAFE; only STOP blocks them.
const SERVE_ONLY_METRICS: readonly QuotaMetric[] = [
  "workersRequests",
  "d1Reads",
];

export function worstMode(a: QuotaMode, b: QuotaMode): QuotaMode {
  return MODE_ORDER.indexOf(a) >= MODE_ORDER.indexOf(b) ? a : b;
}

export function computeQuotaMode(
  usage: QuotaUsage,
  thresholds: QuotaThresholds,
): QuotaMode {
  let mode: QuotaMode = "NORMAL";
  for (const metric of Object.keys(usage) as QuotaMetric[]) {
    const value = usage[metric] ?? 0;
    if (value >= (thresholds.stop[metric] ?? Number.POSITIVE_INFINITY)) {
      return "STOP";
    }
    if (value >= (thresholds.safe[metric] ?? Number.POSITIVE_INFINITY)) {
      mode = worstMode(mode, "SAFE");
    } else if (
      value >= (thresholds.warn[metric] ?? Number.POSITIVE_INFINITY)
    ) {
      mode = worstMode(mode, "WARN");
    }
  }
  return mode;
}

const QUOTA_METRICS: readonly QuotaMetric[] = [
  "workersRequests",
  "d1Reads",
  "d1Writes",
  "queueOperations",
  "r2Operations",
  "vectorizeDimensions",
  "analyticsEvents",
  "modelUsage",
];

const THRESHOLD_LEVELS = ["warn", "safe", "stop"] as const;

function metricEnvName(metric: QuotaMetric): string {
  return metric
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    .toUpperCase();
}

/**
 * Reads thresholds from QUOTA_GUARD_{WARN|SAFE|STOP}_{METRIC} env
 * vars (e.g. QUOTA_GUARD_STOP_MODEL_USAGE=5000). Unset metrics
 * never trigger — nothing is hardcoded; the Human configures
 * thresholds per deployment.
 */
export function thresholdsFromEnv(
  env: Record<string, string | undefined>,
  prefix = "QUOTA_GUARD_",
): QuotaThresholds {
  const thresholds: QuotaThresholds = { warn: {}, safe: {}, stop: {} };
  for (const metric of QUOTA_METRICS) {
    for (const level of THRESHOLD_LEVELS) {
      const key = `${prefix}${level.toUpperCase()}_${metricEnvName(metric)}`;
      const raw = env[key];
      if (raw === undefined || raw === "") {
        continue;
      }
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) {
        continue;
      }
      thresholds[level][metric] = value;
    }
  }
  return thresholds;
}

/**
 * Manual mode override via QUOTA_MODE env var (set by ops to
 * force degradation without waiting for usage to cross
 * thresholds). Returns undefined when unset/invalid.
 */
export function quotaModeFromEnv(
  env: Record<string, string | undefined>,
): QuotaMode | undefined {
  const raw = env.QUOTA_MODE?.toUpperCase();
  switch (raw) {
    case "NORMAL":
    case "WARN":
    case "SAFE":
    case "STOP":
      return raw;
    default:
      return undefined;
  }
}

/** Effective mode: the worse of usage-computed and env override. */
export function effectiveQuotaMode(
  computed: QuotaMode,
  override: QuotaMode | undefined,
): QuotaMode {
  return override ? worstMode(computed, override) : computed;
}

export class InMemoryQuotaGuard implements QuotaGuard {
  private usage: QuotaUsage = {};
  private readonly thresholds: QuotaThresholds;

  constructor(thresholds: QuotaThresholds) {
    this.thresholds = thresholds;
  }

  mode(): QuotaMode {
    return computeQuotaMode(this.usage, this.thresholds);
  }

  record(usage: QuotaUsage): void {
    for (const metric of Object.keys(usage) as QuotaMetric[]) {
      const value = usage[metric] ?? 0;
      this.usage[metric] = (this.usage[metric] ?? 0) + value;
    }
  }

  canPerform(metric: QuotaMetric): boolean {
    const mode = this.mode();
    if (mode === "STOP") {
      return SERVE_ONLY_METRICS.includes(metric);
    }
    if (mode === "SAFE") {
      return !EXPENSIVE_METRICS.includes(metric);
    }
    return true;
  }
}
