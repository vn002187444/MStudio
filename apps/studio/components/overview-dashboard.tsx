"use client";

import { useEffect, useState } from "react";
import { authedFetch, TokenGate } from "./cms-actions";
import {
  apiBaseUrl,
  formatTime,
  webBaseUrl,
  type ArticleStatus,
  type PublishedArticleRow,
} from "../lib/cms";

const DRAFT_GROUP: readonly ArticleStatus[] = ["drafted", "ai_qa"];
const REVIEW_GROUP: readonly ArticleStatus[] = [
  "human_review",
  "auto_eligible",
  "hold",
];
const SCHEDULED_GROUP: readonly ArticleStatus[] = ["scheduled"];
const LIVE_GROUP: readonly ArticleStatus[] = ["published", "updated", "corrected"];

const COUNT_STATUSES: readonly ArticleStatus[] = [
  ...DRAFT_GROUP,
  ...REVIEW_GROUP,
  ...SCHEDULED_GROUP,
  ...LIVE_GROUP,
  "retracted",
];

const quickLinks: readonly { href: string; label: string }[] = [
  { href: "/overview", label: "Overview" },
  { href: "/editor", label: "Editor" },
  { href: "/newsroom/incoming", label: "Incoming" },
  { href: "/clusters", label: "Story Clusters" },
  { href: "/drafts", label: "Drafts" },
  { href: "/newsroom/needs-review", label: "Needs Review" },
  { href: "/scheduled", label: "Scheduled" },
  { href: "/newsroom/published", label: "Published" },
  { href: "/audience", label: "Audience & Views" },
  { href: "/seo", label: "SEO & Discovery" },
  { href: "/newsroom/sources", label: "Sources" },
];

async function fetchRecent(): Promise<PublishedArticleRow[]> {
  try {
    const response = await fetch(`${apiBaseUrl()}/articles?limit=5`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { rows?: PublishedArticleRow[] };
    return Array.isArray(payload.rows) ? payload.rows : [];
  } catch {
    return [];
  }
}

async function fetchStatusCounts(
  token: string,
): Promise<{
  counts: Map<ArticleStatus, number> | undefined;
  error?: string;
}> {
  if (!token) {
    return {
      counts: new Map(
        COUNT_STATUSES.map((status) => [status, 0] as const),
      ),
    };
  }
  try {
    const response = await authedFetch(
      `${apiBaseUrl()}/articles/counts`,
      token,
      { cache: "no-store" },
    );
    if (!response.ok) {
      return { counts: undefined, error: `HTTP ${response.status}` };
    }
    const payload = (await response.json()) as {
      counts?: Partial<Record<ArticleStatus, number>>;
    };
    const counts = new Map<ArticleStatus, number>();
    for (const status of COUNT_STATUSES) {
      counts.set(status, Number(payload.counts?.[status] ?? 0));
    }
    return { counts };
  } catch {
    return { counts: undefined, error: "Không gọi được API" };
  }
}

function sumGroup(
  counts: Map<ArticleStatus, number>,
  statuses: readonly ArticleStatus[],
): number {
  let total = 0;
  for (const status of statuses) {
    total += counts.get(status) ?? 0;
  }
  return total;
}

function StatusCard({
  title,
  href,
  total,
  counts,
  statuses,
  icon,
}: {
  title: string;
  href: string;
  total: number;
  counts: Map<ArticleStatus, number>;
  statuses: readonly ArticleStatus[];
  icon: string;
}) {
  return (
    <li
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "16px 18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--gray)",
              background: "#f1f5f9",
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            {title}
          </span>
        </div>
        <p style={{ fontSize: "var(--text-3xl)", fontWeight: 800, margin: "2px 0 6px", color: "var(--ink)" }}>
          {total}
        </p>
      </div>
      <div>
        <p style={{ color: "var(--gray)", fontSize: "12px", margin: "0 0 10px", lineHeight: 1.4 }}>
          {statuses
            .map((status) => `${status}: ${counts.get(status) ?? 0}`)
            .join(" · ")}
        </p>
        <a
          href={href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--ai-blue)",
            textDecoration: "none",
          }}
        >
          Chi tiết ➜
        </a>
      </div>
    </li>
  );
}

export function OverviewDashboard() {
  const [counts, setCounts] = useState<
    Map<ArticleStatus, number> | undefined
  >(undefined);
  const [countsError, setCountsError] = useState<string | undefined>(undefined);
  const [recent, setRecent] = useState<PublishedArticleRow[] | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    let token = "";
    try {
      token = window.localStorage.getItem("mstudio-cms-token") ?? "";
    } catch {
      token = "";
    }
    void fetchRecent().then((rows) => {
      if (!cancelled) setRecent(rows);
    });
    void fetchStatusCounts(token).then((result) => {
      if (cancelled) return;
      setCounts(result.counts);
      setCountsError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TokenGate>
      {/* Automation Pipeline Funnel Banner */}
      <section
        aria-label="Luồng tự động hoá tin tức"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          borderRadius: "var(--radius-lg)",
          padding: "20px 24px",
          marginBottom: 24,
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
              ⚡ Luồng Vận Hành Tự Động (AI News Pipeline)
            </h2>
            <p style={{ fontSize: "12.5px", color: "#94a3b8", margin: "4px 0 0" }}>
              Mỗi 15 phút: Quét RSS ➔ Gom chùm tin ➔ AI Desk viết bài ➔ Chờ duyệt ➔ Tự động phát hành
            </p>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 10px",
              background: "rgba(34, 197, 94, 0.2)",
              color: "#4ade80",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: 999,
            }}
          >
            ● HỆ THỐNG ĐANG CHẠY 24/7
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          <a
            href="/newsroom/incoming"
            style={{
              background: "rgba(255, 255, 255, 0.07)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              color: "#ffffff",
              textDecoration: "none",
              display: "block",
            }}
          >
            <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: 4 }}>1. Thu thập</div>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>📥 Tin thô RSS</div>
          </a>

          <a
            href="/clusters"
            style={{
              background: "rgba(255, 255, 255, 0.07)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              color: "#ffffff",
              textDecoration: "none",
              display: "block",
            }}
          >
            <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: 4 }}>2. Phân loại</div>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>🧩 Gom chùm tin</div>
          </a>

          <a
            href="/drafts"
            style={{
              background: "rgba(255, 255, 255, 0.07)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              color: "#ffffff",
              textDecoration: "none",
              display: "block",
            }}
          >
            <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: 4 }}>3. AI biên soạn</div>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>🤖 Bản thảo ({counts ? sumGroup(counts, DRAFT_GROUP) : "…"})</div>
          </a>

          <a
            href="/newsroom/needs-review"
            style={{
              background: "rgba(255, 255, 255, 0.07)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              color: "#ffffff",
              textDecoration: "none",
              display: "block",
            }}
          >
            <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: 4 }}>4. Hàng đợi 15m</div>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>⏱️ Chờ duyệt ({counts ? sumGroup(counts, REVIEW_GROUP) : "…"})</div>
          </a>

          <a
            href="/newsroom/published"
            style={{
              background: "rgba(255, 255, 255, 0.07)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              color: "#ffffff",
              textDecoration: "none",
              display: "block",
            }}
          >
            <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: 4 }}>5. Đang phát hành</div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#4ade80" }}>🚀 Live ({counts ? sumGroup(counts, LIVE_GROUP) : "…"})</div>
          </a>
        </div>
      </section>

      {counts ? (
        <section aria-labelledby="overview-counts" style={{ marginBottom: 24 }}>
          <h2 id="overview-counts" style={{ fontSize: "var(--text-xl)", margin: "0 0 12px" }}>
            Số liệu theo trạng thái bài viết
          </h2>
          {countsError ? (
            <p role="alert" style={{ color: "var(--breaking-red)" }}>Lỗi tải số liệu: {countsError}</p>
          ) : null}
          <ul
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            <StatusCard
              counts={counts}
              href="/drafts"
              icon="📝"
              statuses={DRAFT_GROUP}
              title="Bản nháp"
              total={sumGroup(counts, DRAFT_GROUP)}
            />
            <StatusCard
              counts={counts}
              href="/newsroom/needs-review"
              icon="⏳"
              statuses={REVIEW_GROUP}
              title="Chờ duyệt"
              total={sumGroup(counts, REVIEW_GROUP)}
            />
            <StatusCard
              counts={counts}
              href="/scheduled"
              icon="📅"
              statuses={SCHEDULED_GROUP}
              title="Đã lên lịch"
              total={sumGroup(counts, SCHEDULED_GROUP)}
            />
            <StatusCard
              counts={counts}
              href="/newsroom/published"
              icon="🌐"
              statuses={LIVE_GROUP}
              title="Đang phát hành"
              total={sumGroup(counts, LIVE_GROUP)}
            />
          </ul>
        </section>
      ) : (
        <p role="status" style={{ color: "var(--gray)" }}>
          Đang tải số liệu…
        </p>
      )}

      <section aria-labelledby="overview-recent" style={{ marginBottom: 24 }}>
        <h2 id="overview-recent" style={{ fontSize: "var(--text-xl)", margin: "0 0 12px" }}>
          5 bài mới phát hành gần nhất
        </h2>
        {!recent ? (
          <p role="status" style={{ color: "var(--gray)" }}>
            Đang tải bài mới nhất…
          </p>
        ) : recent.length === 0 ? (
          <p role="status" style={{ color: "var(--gray)" }}>
            Chưa có bài reader-visible nào — duyệt ở Incoming rồi publish tại
            Needs Review.
          </p>
        ) : (
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <table className="responsive-table" style={{ borderCollapse: "collapse", width: "100%" }}>
              <caption style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--gray)", fontSize: "13px" }}>
                Bài viết reader-visible đã phát hành trên hệ thống TinFlow
              </caption>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
                  <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>
                    Tiêu đề bài viết
                  </th>
                  <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>
                    Trạng thái
                  </th>
                  <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>
                    Cập nhật
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.map((article) => (
                  <tr key={article.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <a
                        href={`${webBaseUrl()}/bai-viet/${article.id}`}
                        rel="noreferrer"
                        style={{ fontWeight: 600, color: "var(--ink)", textDecoration: "none" }}
                        target="_blank"
                      >
                        {article.title}
                      </a>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 12,
                          background: "#dcfce7",
                          color: "#15803d",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontWeight: 600,
                        }}
                      >
                        ● {article.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--gray)", fontSize: "13px" }}>
                      {formatTime(article.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="overview-links">
        <h2 id="overview-links" style={{ fontSize: "var(--text-xl)", margin: "0 0 12px" }}>
          Lối tắt chức năng CMS
        </h2>
        <ul
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 10,
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {quickLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                style={{
                  display: "block",
                  padding: "12px 14px",
                  background: "var(--white)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--ink)",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "13.5px",
                  textAlign: "center",
                  transition: "background 0.15s ease",
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </TokenGate>
  );
}
