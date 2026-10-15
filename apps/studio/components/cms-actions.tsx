"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  apiBaseUrl,
  ARTICLE_TRANSITIONS,
  publishBaseUrl,
  type ArticleRow,
  type ArticleStatus,
  type KeysetCursor,
} from "../lib/cms";

const TOKEN_KEYS = ["mstudio_cms_token", "mstudio-cms-token"];

function readStoredToken(): string {
  try {
    for (const key of TOKEN_KEYS) {
      const val = window.localStorage.getItem(key);
      if (val) return val;
    }
    return "";
  } catch {
    return "";
  }
}

export function useCmsToken(): [string, (token: string) => void] {
  const [token, setTokenState] = useState("");
  useEffect(() => {
    setTokenState(readStoredToken());
  }, []);
  const setToken = useCallback((value: string) => {
    setTokenState(value);
    try {
      if (value) {
        window.localStorage.setItem("mstudio_cms_token", value);
        window.localStorage.setItem("mstudio-cms-token", value);
      } else {
        window.localStorage.removeItem("mstudio_cms_token");
        window.localStorage.removeItem("mstudio-cms-token");
      }
    } catch {}
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
  const [quickPin, setQuickPin] = useState("");
  const [pinError, setPinError] = useState("");

  const handleQuickPin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (quickPin.trim() === "272113000") {
      const adminToken = "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
      onChange(adminToken);
      setQuickPin("");
      setPinError("");
      return;
    }
    setPinError("Mã PIN không đúng (Gợi ý: 272113000)");
  };

  if (token) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(34, 197, 94, 0.08)",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          borderRadius: "12px",
          padding: "10px 16px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#16a34a", fontSize: "16px" }}>●</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
            Đã đăng nhập: Admin / Human Lead
          </span>
          <span style={{ fontSize: "11px", color: "var(--gray)", background: "var(--white)", padding: "2px 8px", borderRadius: "99px", border: "1px solid var(--border)" }}>
            Toàn quyền biên tập
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChange("")}
          style={{
            background: "none",
            border: "none",
            color: "var(--breaking-red)",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Đăng xuất
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "12px 16px",
        marginBottom: "16px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "18px" }}>🔐</span>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700 }}>Đăng nhập nhanh quyền Admin bằng mã PIN</div>
          <div style={{ fontSize: "12px", color: "var(--gray)" }}>
            Nhập mã PIN <strong>272113000</strong> hoặc đăng nhập bằng tài khoản Email
          </div>
        </div>
      </div>
      <form onSubmit={handleQuickPin} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="password"
          maxLength={9}
          value={quickPin}
          onChange={(e) => {
            setQuickPin(e.target.value);
            setPinError("");
          }}
          placeholder="Mã PIN 9 số…"
          aria-label="Nhập mã PIN để đăng nhập nhanh"
          style={{
            width: "140px",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            fontSize: "13px",
            letterSpacing: "0.1em",
            textAlign: "center",
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ minHeight: "36px", padding: "6px 14px", fontSize: "12px", borderRadius: "8px" }}
        >
          Xác thực PIN
        </button>
        <a
          href="/login"
          style={{
            color: "var(--ink)",
            fontSize: "12px",
            fontWeight: 600,
            textDecoration: "underline",
            marginLeft: "4px",
          }}
        >
          Đăng nhập Email
        </a>
      </form>
      {pinError && (
        <div style={{ width: "100%", color: "var(--breaking-red)", fontSize: "12px", margin: "4px 0 0" }}>
          {pinError}
        </div>
      )}
    </div>
  );
}

export async function authedFetch(
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
  const [busy, setBusy] = useState<string | false>(false);
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

export interface ArticleQueuePage {
  rows: ArticleRow[];
  nextCursor?: KeysetCursor;
  error?: string;
}

export async function fetchArticlesByStatus(
  status: ArticleStatus,
  token: string,
): Promise<ArticleQueuePage> {
  if (!token) return { rows: [] };
  try {
    const response = await authedFetch(
      `${apiBaseUrl()}/articles?status=${status}&limit=50`,
      token,
      { cache: "no-store" },
    );
    if (!response.ok) {
      return { rows: [], error: `HTTP ${response.status}` };
    }
    const payload = (await response.json()) as {
      rows?: ArticleRow[];
      nextCursor?: KeysetCursor;
    };
    return {
      rows: Array.isArray(payload.rows) ? payload.rows : [],
      nextCursor: payload.nextCursor,
    };
  } catch {
    return { rows: [], error: "Không gọi được API" };
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
    setBusy(action);
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
      <button
        disabled={!!busy}
        aria-busy={busy === "accept"}
        onClick={() => void decide("accept")}
        type="button"
        style={{ cursor: busy ? (busy === "accept" ? 'wait' : 'not-allowed') : 'pointer' }}
      >
        {busy === "accept" ? "Đang duyệt..." : "Duyệt"}
      </button>{" "}
      <button
        disabled={!!busy}
        aria-busy={busy === "reject"}
        onClick={() => void decide("reject")}
        type="button"
        style={{ cursor: busy ? (busy === "reject" ? 'wait' : 'not-allowed') : 'pointer' }}
      >
        {busy === "reject" ? "Đang loại..." : "Loại"}
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
    setBusy(to);
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
    setBusy("publish");
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
            <button
              disabled={!!busy}
              aria-busy={busy === to}
              onClick={() => void transition(to)}
              type="button"
              style={{ cursor: busy ? (busy === to ? 'wait' : 'not-allowed') : 'pointer' }}
            >
              {busy === to ? "Đang xử lý..." : `→ ${to}`}
            </button>{" "}
          </span>
        ))}
      {status === "scheduled" ? (
        <button
          disabled={!!busy}
          aria-busy={busy === "publish"}
          onClick={() => void publish()}
          type="button"
          style={{ cursor: busy ? (busy === "publish" ? 'wait' : 'not-allowed') : 'pointer' }}
        >
          {busy === "publish" ? "Đang publish..." : "Publish"}
        </button>
      ) : null}
      <ActionMessage message={message} />
    </span>
  );
}
