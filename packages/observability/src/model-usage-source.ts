export interface ModelUsageSource {
  readModelUsage(): Promise<number>;
}

/**
 * Reads cumulative model usage (agent_runs count) from the
 * analytics worker's internal /internal/model-usage endpoint.
 * Internal-only: no auth, same-worker-network endpoint.
 */
export function analyticsModelUsageSource(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
): ModelUsageSource {
  const url = `${baseUrl.replace(/\/+$/, "")}/internal/model-usage`;
  return {
    async readModelUsage(): Promise<number> {
      const response = await fetchImpl(url);
      if (!response.ok) {
        throw new Error(`analytics worker returned HTTP ${response.status}`);
      }
      const body = (await response.json()) as { modelUsage?: unknown };
      if (typeof body.modelUsage !== "number") {
        throw new Error("analytics worker response missing numeric modelUsage");
      }
      return body.modelUsage;
    },
  };
}

/**
 * Sums model usage across sources — e.g. the analytics worker
 * (cross-worker agent_runs count) plus any local in-memory
 * usage recorded by recordModelUsage.
 */
export class CompositeModelUsageSource implements ModelUsageSource {
  private readonly sources: readonly ModelUsageSource[];

  constructor(sources: readonly ModelUsageSource[]) {
    this.sources = sources;
  }

  async readModelUsage(): Promise<number> {
    let total = 0;
    for (const source of this.sources) {
      total += await source.readModelUsage();
    }
    return total;
  }
}
