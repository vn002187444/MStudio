"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { apiBaseUrl, ARTICLE_TRANSITIONS, publishBaseUrl } from "../lib/cms";

const TOKEN_KEY = "mstudio-cms-token";

function readStoredToken(): string {
  try {
    return window.localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function useCmsToken(): [string, (token: string) => void] {
  const [token, setTokenState] = useState("");
  useEffect(() => {
    try {
      setTokenState(window.localStorage.getItem(TOKEN_KEY) ?? "");
    } catch {
      setTokenState("");
    }
  }, []);
  const setToken = useCallback((value: string) => {
    setTokenState(value);
    try {
      if (value) {
        window.localStorage.setItem(TOKEN_KEY, value);
      } else {
        window.localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // storage không khả dụng — giữ token trong memory của phiên
    }
  }, []);
  return [token, setToken];
}

export function TokenField({
  token,
  onChange,
}: {
  token: string;
  onChange: (token: string) => void;
}) {
  return (
    <p style={{ margin: "0 0 16px" }}>
      <label htmlFor="cms-token" style={{ display: "block", marginBottom: 4 }}>
        Token biên tập (Bearer — xin từ admin, lưu trên trình duyệt này)
      </label>
      <input
        autoComplete="off"
        id="cms-token"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Dán token…"
        spellCheck={false}
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-base)",
          maxWidth: 480,
          padding: "8px 12px",
          width: "100%",
        }}
        type="password"
        value={token}
      />
    </p>
  );
}

async function authedFetch(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
  });
}

function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  return { busy, message, setBusy, setMessage };
}

function ActionMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role={message.startsWith("Lỗi") ? "alert" : "status"} style={{ margin: "4px 0 0" }}>
      {message}
    </p>
  );
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string };
    };
    return body.error?.message ?? body.error?.code ?? `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

export function TokenGate({ children }: { children: ReactNode }) {
  const [token, setToken] = useCmsToken();
  return (
    <>
      <TokenField token={token} onChange={setToken} />
      {children}
    </>
  );
}

export function AcceptRejectButtons({ rawItemId }: { rawItemId: string }) {
  const { busy, message, setBusy, setMessage } = useAction();

  async function decide(action: "accept" | "reject") {
    const token = readStoredToken();
    if (!token) {
      setMessage("Lỗi: nhập token biên tập ở trên trước.");
      return;
    }
    setBusy(true);
    setMessage(undefined);
    try {
      const response = await authedFetch(
        `${apiBaseUrl()}/raw-items/${rawItemId}/${action}`,
        token,
        { method: "POST", body: "{}" },
      );
      if (!response.ok) {
        setMessage(`Lỗi: ${await readError(response)}`);
        return;
      }
      setMessage(action === "accept" ? "Đã duyệt — tạo story/article." : "Đã loại.");
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span>
      <button disabled={busy} onClick={() => void decide("accept")} type="button">
        Duyệt
      </button>{" "}
      <button disabled={busy} onClick={() => void decide("reject")} type="button">
        Loại
      </button>
      <ActionMessage message={message} />
    </span>
  );
}

export function TransitionPublishButtons({
  articleId,
  status,
  revisionId,
}: {
  articleId: string;
  status: string;
  revisionId?: string;
}) {
  const { busy, message, setBusy, setMessage } = useAction();
  const targets = ARTICLE_TRANSITIONS[status as keyof typeof ARTICLE_TRANSITIONS] ?? [];

  async function transition(to: string) {
    setBusy(true);
    setMessage(undefined);
    try {
      const response = await fetch(
        `${publishBaseUrl()}/articles/${articleId}/transitions`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ to }),
        },
      );
      if (!response.ok) {
        setMessage(`Lỗi: ${await readError(response)}`);
        return;
      }
      setMessage(`Đã chuyển → ${to}.`);
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!revisionId) {
      setMessage("Lỗi: bài chưa có revision để publish.");
      return;
    }
    setBusy(true);
    setMessage(undefined);
    try {
      const response = await fetch(
        `${publishBaseUrl()}/articles/${articleId}/publish`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ revisionId }),
        },
      );
      if (!response.ok) {
        setMessage(`Lỗi: ${await readError(response)}`);
        return;
      }
      setMessage("Đã publish.");
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span>
      {targets
        .filter((to) => to !== "published")
        .map((to) => (
          <span key={to}>
            <button disabled={busy} onClick={() => void transition(to)} type="button">
              → {to}
            </button>{" "}
          </span>
        ))}
      {status === "scheduled" ? (
        <button disabled={busy} onClick={() => void publish()} type="button">
          Publish
        </button>
      ) : null}
      <ActionMessage message={message} />
    </span>
  );
}
