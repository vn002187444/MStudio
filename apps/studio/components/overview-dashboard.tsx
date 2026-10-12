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
  { href: "/newsroom/incoming", label: "Incoming" },
  { href: "/clusters", label: "Story Clusters" },
  { href: "/drafts", label: "Drafts" },
  { href: "/newsroom/needsReview", label: "Needs Review" },
  { href: "/scheduled", label: "Scheduled" },
  { href: "/newsroom/published", label: "Published" },
  { href: "/corrections", label: "Corrections" },
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
}: {
  title: string;
  href: string;
  total: number;
  counts: Map<ArticleStatus, number>;
  statuses: readonly ArticleStatus[];
}) {
  return (
    <li
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: 16,
      }}
    >
      <a href={href} style={{ display: "block", fontWeight: 700 }}>
        {title}
      </a>
      <p style={{ fontSize: "var(--text-3xl)", margin: "4px 0" }}>{total}</p>
      <p style={{ color: "var(--gray)", fontSize: "var(--text-sm)", margin: 0 }}>
        {statuses
          .map((status) => `${status}: ${counts.get(status) ?? 0}`)
          .join(" · ")}
      </p>
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
      {counts ? (
        <section aria-labelledby="overview-counts" style={{ marginBottom: 24 }}>
          <h2 id="overview-counts" style={{ fontSize: "var(--text-xl)" }}>
            Số liệu theo trạng thái
          </h2>
          {countsError ? (
            <p role="alert">Lỗi tải số liệu: {countsError}</p>
          ) : null}
          <ul
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              listStyle: "none",
              margin: "8px 0 0",
              padding: 0,
            }}
          >
            <StatusCard
              counts={counts}
              href="/drafts"
              statuses={DRAFT_GROUP}
              title="Bản nháp"
              total={sumGroup(counts, DRAFT_GROUP)}
            />
            <StatusCard
              counts={counts}
              href="/newsroom/needsReview"
              statuses={REVIEW_GROUP}
              title="Chờ duyệt"
              total={sumGroup(counts, REVIEW_GROUP)}
            />
            <StatusCard
              counts={counts}
              href="/scheduled"
              statuses={SCHEDULED_GROUP}
              title="Đã lên lịch"
              total={sumGroup(counts, SCHEDULED_GROUP)}
            />
            <StatusCard
              counts={counts}
              href="/newsroom/published"
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
        <h2 id="overview-recent" style={{ fontSize: "var(--text-xl)" }}>
          Bài mới nhất
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
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <caption style={{ textAlign: "left" }}>
              5 bài mới nhất đang phát hành
            </caption>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left" }}>
                  Tiêu đề
                </th>
                <th scope="col" style={{ textAlign: "left" }}>Trạng thái</th>
                <th scope="col" style={{ textAlign: "left" }}>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((article) => (
                <tr key={article.id}>
                  <td>
                    <a
                      href={`${webBaseUrl()}/bai-viet/${article.id}`}
                      rel="noreferrer"
                      style={{ fontWeight: 600 }}
                      target="_blank"
                    >
                      {article.title}
                    </a>
                  </td>
                  <td>{article.status}</td>
                  <td>{formatTime(article.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="overview-links">
        <h2 id="overview-links" style={{ fontSize: "var(--text-xl)" }}>
          Module nhanh
        </h2>
        <ul
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            listStyle: "none",
            margin: "8px 0 0",
            padding: 0,
          }}
        >
          {quickLinks.map((link) => (
            <li key={link.href}>
              <a
                className="btn-primary"
                href={link.href}
                style={{ textDecoration: "none" }}
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
