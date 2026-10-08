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

const EXPENSIVE_METRICS: ReadonlySet<QuotaMetric> = new Set<QuotaMetric>([
  "queueOperations",
  "r2Operations",
  "vectorizeDimensions",
  "analyticsEvents",
  "modelUsage",
]);

const SERVE_ONLY_METRICS: ReadonlySet<QuotaMetric> = new Set<QuotaMetric>([
  "workersRequests",
  "d1Reads",
]);

function worse(a: QuotaMode, b: QuotaMode): QuotaMode {
  return MODE_ORDER.indexOf(a) >= MODE_ORDER.indexOf(b) ? a : b;
}

function modeForUsage(
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
      mode = worse(mode, "SAFE");
    } else if (value >= (thresholds.warn[metric] ?? Number.POSITIVE_INFINITY)) {
      mode = worse(mode, "WARN");
    }
  }
  return mode;
}

export class InMemoryQuotaGuard implements QuotaGuard {
  private readonly thresholds: QuotaThresholds;
  private usage: QuotaUsage = {};

  constructor(thresholds: QuotaThresholds) {
    this.thresholds = thresholds;
  }

  mode(): QuotaMode {
    return modeForUsage(this.usage, this.thresholds);
  }

  record(usage: QuotaUsage): void {
    for (const entry of Object.entries(usage) as [QuotaMetric, number][]) {
      const metric = entry[0];
      const value = entry[1] ?? 0;
      this.usage[metric] = (this.usage[metric] ?? 0) + value;
    }
  }

  canPerform(metric: QuotaMetric): boolean {
    const mode = this.mode();
    if (mode === "STOP") return SERVE_ONLY_METRICS.has(metric);
    if (mode === "SAFE") return !EXPENSIVE_METRICS.has(metric);
    return true;
  }
}
