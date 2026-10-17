"use client";

import { useState } from "react";

/**
 * Follow/Hide topic controls (MST-062) — POST same-origin /api/events,
 * proxy tới workers/api. Không tự bịa topicId: dùng slug taxonomy PLAN.
 */
type ActionState = "idle" | "sending" | "done" | "error";

async function sendEvent(eventType: "follow_topic" | "hide_topic", topicId: string): Promise<boolean> {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify([{ eventType, topicId }]),
  });
  return response.ok;
}

function TopicAction({
  action,
  topicId,
  topicLabel,
}: {
  action: "follow_topic" | "hide_topic";
  topicId: string;
  topicLabel: string;
}) {
  const [state, setState] = useState<ActionState>("idle");
  const isFollow = action === "follow_topic";

  async function handleClick() {
    setState("sending");
    try {
      setState((await sendEvent(action, topicId)) ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <span>
      <button
        aria-pressed={state === "done"}
        className={isFollow ? "btn-follow" : "btn-hide"}
        disabled={state === "sending" || state === "done"}
        onClick={handleClick}
        type="button"
      >
        {state === "done"
          ? isFollow
            ? "Đang theo dõi"
            : "Đã ẩn"
          : state === "sending"
            ? "Đang gửi…"
            : isFollow
              ? `Theo dõi ${topicLabel}`
              : `Ẩn ${topicLabel}`}
      </button>{" "}
      <span aria-live="polite" role="status" style={{ color: "var(--gray)", fontSize: "var(--text-sm)" }}>
        {state === "error" ? "Gửi thất bại, thử lại sau." : ""}
      </span>
    </span>
  );
}

export function FollowTopicButton({ topicId, topicLabel }: { topicId: string; topicLabel: string }) {
  return <TopicAction action="follow_topic" topicId={topicId} topicLabel={topicLabel} />;
}

export function HideTopicButton({ topicId, topicLabel }: { topicId: string; topicLabel: string }) {
  return <TopicAction action="hide_topic" topicId={topicId} topicLabel={topicLabel} />;
}

export function FollowEntityButton({
  entityId,
  entityName,
  initialState = false,
}: {
  entityId: string;
  entityName: string;
  initialState?: boolean;
}) {
  return <TopicAction action="follow_topic" topicId={entityId} topicLabel={entityName} />;
}
