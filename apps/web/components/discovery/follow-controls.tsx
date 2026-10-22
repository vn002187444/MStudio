"use client";

import { useState } from "react";

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
    <span className="inline-flex items-center gap-1">
      <button
        aria-label={`${isFollow ? "Theo dõi" : "Ẩn"} chủ đề ${topicLabel}`}
        aria-pressed={state === "done"}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900 ${
          state === "done"
            ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-default"
            : state === "sending"
            ? "opacity-60 cursor-wait bg-slate-800 text-slate-300 border border-slate-700"
            : isFollow
            ? "bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-sm"
            : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600"
        }`}
        disabled={state === "sending" || state === "done"}
        onClick={handleClick}
        type="button"
      >
        {state === "done"
          ? isFollow
            ? "✓ Đang theo dõi"
            : "✕ Đã ẩn"
          : state === "sending"
            ? "Đang lưu…"
            : isFollow
              ? `Theo dõi`
              : `Ẩn`}
      </button>{" "}
      <span aria-live="polite" role="status" className="text-rose-400 text-xs">
        {state === "error" ? "Lỗi, thử lại." : ""}
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
