import type { D1Database } from "@cloudflare/workers-types";
import type { ReaderEventMessage } from "@mstudio/contracts";
import { createReaderEvents, upsertReaderProfile } from "@mstudio/db";
import { flagsFromEnv, type Logger, type QuotaMode } from "@mstudio/observability";

export interface AnalyticsOutcome {
  inserted: number;
  profilesUpdated: number;
  dropped: number;
  reason?: string;
}

/**
 * Counts model usage (agent runs) within a rolling
 * window — served on the internal /internal/model-usage
 * endpoint for QuotaGuard's modelUsage metric.
 */
export async function countModelUsage(
  db: D1Database,
  windowHours: number,
): Promise<number> {
  const cutoff = new Date(
    Date.now() - windowHours * 60 * 60 * 1000,
  ).toISOString();
  const row = await db
    .prepare(
      "SELECT COUNT(*) AS count FROM agent_runs WHERE created_at >= ?",
    )
    .bind(cutoff)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export function quotaModeFromEnv(
  env: Record<string, string | undefined>,
): QuotaMode {
  const raw = env.QUOTA_MODE?.toUpperCase();
  switch (raw) {
    case "NORMAL":
    case "WARN":
    case "SAFE":
    case "STOP":
      return raw;
    default:
      return "NORMAL";
  }
}

// Mirrors QuotaGuard.canPerform("analyticsEvents"): analytics events are an
// expensive quota metric, so SAFE and STOP drop them first (PLAN.md: reduce
// analytics before crawl/reprocessing/embeddings/model usage).
export function quotaAllowsAnalytics(mode: QuotaMode): boolean {
  return mode === "NORMAL" || mode === "WARN";
}

interface ProfileUpdates {
  followedTopicIds: Set<string>;
  hiddenTopicIds: Set<string>;
}

export async function processEventBatch(
  messages: ReaderEventMessage[],
  env: Env,
  logger: Logger,
): Promise<AnalyticsOutcome> {
  const envRecord = env as unknown as Record<string, string | undefined>;
  const flags = flagsFromEnv(envRecord);
  if (flags.readerEventsEnabled === false) {
    logger.info("reader_events_disabled", { dropped: messages.length });
    return {
      inserted: 0,
      profilesUpdated: 0,
      dropped: messages.length,
      reason: "disabled",
    };
  }
  const mode = quotaModeFromEnv(envRecord);
  if (!quotaAllowsAnalytics(mode)) {
    logger.info("reader_events_dropped_quota", {
      mode,
      dropped: messages.length,
    });
    return {
      inserted: 0,
      profilesUpdated: 0,
      dropped: messages.length,
      reason: `quota_${mode.toLowerCase()}`,
    };
  }
  const db = env.DB;
  if (!db) {
    throw new Error("DB binding must be configured");
  }
  const now = new Date().toISOString();
  const events = messages.map((message) => ({ ...message, createdAt: now }));
  const updatesByUser = new Map<string, ProfileUpdates>();
  for (const message of messages) {
    if (!message.userId || !message.topicId) continue;
    if (message.eventType !== "follow_topic" && message.eventType !== "hide_topic") {
      continue;
    }
    const updates = updatesByUser.get(message.userId) ?? {
      followedTopicIds: new Set<string>(),
      hiddenTopicIds: new Set<string>(),
    };
    if (message.eventType === "follow_topic") {
      updates.followedTopicIds.add(message.topicId);
    } else {
      updates.hiddenTopicIds.add(message.topicId);
    }
    updatesByUser.set(message.userId, updates);
  }
  await createReaderEvents(db, events);
  let profilesUpdated = 0;
  for (const [userId, updates] of updatesByUser) {
    await upsertReaderProfile(
      db,
      userId,
      {
        followedTopicIds: [...updates.followedTopicIds],
        hiddenTopicIds: [...updates.hiddenTopicIds],
      },
      now,
    );
    profilesUpdated += 1;
  }
  return { inserted: events.length, profilesUpdated, dropped: 0 };
}
