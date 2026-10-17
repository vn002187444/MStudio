"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "../lib/api";
import { type ArticleRecord } from "../../../packages/contracts/src/schema.ts";
import { StudioShell } from "./studio-shell";
import { BentoGrid, BentoCard } from "@mstudio/ui";

const DRAFT_GROUP = ["draft"];
const REVIEW_GROUP = ["needs_review", "approved"];
const SCHEDULED_GROUP = ["scheduled"];
const LIVE_GROUP = ["published", "archived"];

type StatusCounts = Record<string, number>;

function sumGroup(counts: StatusCounts, statuses: string[]) {
  return statuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
}

function StatusCard({
  counts,
  href,
  icon,
  statuses,
  title,
  total,
}: {
  counts: StatusCounts;
  href: string;
  icon: string;
  statuses: string[];
  title: string;
  total: number;
}) {
  return (
    <a
      href={href}
      className="glass-panel p-[var(--bento-padding)] rounded-xl flex flex-col gap-2 transition-all hover:-translate-y-1 hover:border-blue-500/30 group"
    >
      <div className="flex items-center gap-2 mb-2">
        <span aria-hidden="true" className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
        <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">{title}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-2">{total}</div>
      <div className="flex flex-col gap-1 text-[11px] text-white/50">
        {statuses.map((status) => (
          <div key={status} className="flex justify-between">
            <span>{status}:</span>
            <span className="font-medium text-white/80">{counts[status] ?? 0}</span>
          </div>
        ))}
      </div>
    </a>
  );
}

function webBaseUrl() {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost") return "http://localhost:5173";
    if (window.location.hostname.endsWith("pages.dev")) return "https://mstudio-channel.pages.dev";
  }
  return "https://mstudio.minds.io.vn";
}

function formatTime(dateString: string) {
  try {
    const d = new Date(dateString);
    return d.toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return dateString;
  }
}

export function OverviewDashboard() {
  const [counts, setCounts] = useState<StatusCounts | null>(null);
  const [countsError, setCountsError] = useState("");
  const [recent, setRecent] = useState<ArticleRecord[] | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const cResp = await fetchApi("/articles/counts");
        if (cResp.ok) {
          const cData = await cResp.json();
          setCounts(cData.counts ?? {});
        } else {
          setCountsError(await cResp.text());
        }
      } catch (err: any) {
        setCountsError(err.message);
      }
      try {
        const rResp = await fetchApi("/articles?limit=5");
        if (rResp.ok) {
          const rData = await rResp.json();
          setRecent(rData.rows ?? []);
        }
      } catch (err) {
        // ignore for now
      }
    }
    void load();
  }, []);

  const quickLinks = [
    { href: "/editor", label: "+ Viết bài mới" },
    { href: "/newsroom/incoming", label: "Duyệt Incoming" },
    { href: "/audience", label: "Xem thống kê" },
    { href: "/email", label: "Hộp thư Email" },
  ];

  return (
    <TokenGate>
      <div className="max-w-[var(--container)] mx-auto w-full">
        {/* Header HUD */}
        <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Telemetry & Metrics</h1>
            <p className="text-white/60">Quản trị bài viết, hiệu suất biên tập và thông lượng hệ thống theo thời gian thực.</p>
          </div>
          <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full border-emerald-500/20 bg-emerald-500/5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse glow-meter" />
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Hệ thống đang chạy 24/7</span>
          </div>
        </header>

        {/* Pipeline Flow Bento Grid */}
        <section className="mb-8">
          <BentoGrid>
            {/* Step 1 */}
            <BentoCard colSpan={2} className="glass-panel p-4 border-white/10 hover:border-blue-500/30 transition-colors group cursor-pointer" onClick={() => window.location.href='/newsroom/incoming'}>
              <div className="text-xs text-white/50 mb-1 font-medium tracking-wide">1. THU THẬP</div>
              <div className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">📥 Tin thô RSS</div>
            </BentoCard>

            {/* Step 2 */}
            <BentoCard colSpan={2} className="glass-panel p-4 border-white/10 hover:border-blue-500/30 transition-colors group cursor-pointer" onClick={() => window.location.href='/clusters'}>
              <div className="text-xs text-white/50 mb-1 font-medium tracking-wide">2. PHÂN LOẠI</div>
              <div className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">🧩 Gom chùm tin</div>
            </BentoCard>

            {/* Step 3 */}
            <BentoCard colSpan={3} className="glass-panel p-4 border-white/10 hover:border-blue-500/30 transition-colors group cursor-pointer" onClick={() => window.location.href='/drafts'}>
              <div className="text-xs text-white/50 mb-1 font-medium tracking-wide">3. AI BIÊN SOẠN</div>
              <div className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">🤖 Bản thảo ({counts ? sumGroup(counts, DRAFT_GROUP) : "…"})</div>
            </BentoCard>

            {/* Step 4 */}
            <BentoCard colSpan={3} className="glass-panel p-4 border-white/10 hover:border-blue-500/30 transition-colors group cursor-pointer" onClick={() => window.location.href='/newsroom/needs-review'}>
              <div className="text-xs text-amber-500/70 mb-1 font-medium tracking-wide">4. HÀNG ĐỢI 15M</div>
              <div className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">⏱️ Chờ duyệt ({counts ? sumGroup(counts, REVIEW_GROUP) : "…"})</div>
            </BentoCard>

            {/* Step 5 */}
            <BentoCard colSpan={2} className="glass-panel p-4 border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/50 transition-colors group cursor-pointer" onClick={() => window.location.href='/newsroom/published'}>
              <div className="text-xs text-emerald-500/70 mb-1 font-medium tracking-wide">5. PHÁT HÀNH</div>
              <div className="font-bold text-emerald-400 text-base">🚀 Live ({counts ? sumGroup(counts, LIVE_GROUP) : "…"})</div>
            </BentoCard>
          </BentoGrid>
        </section>

        {/* Status Metrics */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-white/80 mb-4 border-b border-white/10 pb-2">Trạng thái khối lượng bài viết</h2>
          {countsError && <p className="text-red-400 text-sm mb-4 bg-red-950/50 p-2 rounded">Lỗi tải số liệu: {countsError}</p>}
          {counts ? (
            <BentoGrid>
              <BentoCard colSpan={3} className="p-0 border-none bg-transparent">
                <StatusCard counts={counts} href="/drafts" icon="📝" statuses={DRAFT_GROUP} title="Bản nháp" total={sumGroup(counts, DRAFT_GROUP)} />
              </BentoCard>
              <BentoCard colSpan={3} className="p-0 border-none bg-transparent">
                <StatusCard counts={counts} href="/newsroom/needs-review" icon="⏳" statuses={REVIEW_GROUP} title="Chờ duyệt" total={sumGroup(counts, REVIEW_GROUP)} />
              </BentoCard>
              <BentoCard colSpan={3} className="p-0 border-none bg-transparent">
                <StatusCard counts={counts} href="/scheduled" icon="📅" statuses={SCHEDULED_GROUP} title="Đã lên lịch" total={sumGroup(counts, SCHEDULED_GROUP)} />
              </BentoCard>
              <BentoCard colSpan={3} className="p-0 border-none bg-transparent">
                <StatusCard counts={counts} href="/newsroom/published" icon="🌐" statuses={LIVE_GROUP} title="Đang phát hành" total={sumGroup(counts, LIVE_GROUP)} />
              </BentoCard>
            </BentoGrid>
          ) : (
            <div className="h-32 glass-panel flex items-center justify-center text-white/50 text-sm rounded-[var(--bento-radius-outer)]">
              Đang đồng bộ telemetry...
            </div>
          )}
        </section>

        {/* Recent & Links Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <h2 className="text-lg font-bold text-white/80 mb-4 border-b border-white/10 pb-2">Bài viết phát hành gần nhất</h2>
            {!recent ? (
              <div className="glass-panel p-8 text-center text-white/50 text-sm rounded-[var(--bento-radius-outer)]">Đang truy xuất CSDL D1...</div>
            ) : recent.length === 0 ? (
              <div className="glass-panel p-8 text-center text-white/50 text-sm rounded-[var(--bento-radius-outer)]">Chưa có bài viết nào được xuất bản.</div>
            ) : (
              <div className="glass-panel rounded-[var(--bento-radius-outer)] overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="p-4 font-semibold text-white/70">Tiêu đề</th>
                      <th className="p-4 font-semibold text-white/70">Trạng thái</th>
                      <th className="p-4 font-semibold text-white/70">Cập nhật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recent.map((article) => (
                      <tr key={article.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <a
                            href={`${webBaseUrl()}/bai-viet/${article.slug || article.id}`}
                            rel="noreferrer"
                            className="font-medium text-white hover:text-blue-400 transition-colors"
                            target="_blank"
                          >
                            {article.title}
                          </a>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {article.status}
                          </span>
                        </td>
                        <td className="p-4 text-white/50">
                          {formatTime(article.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold text-white/80 mb-4 border-b border-white/10 pb-2">Lệnh thao tác nhanh</h2>
            <div className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="glass-panel p-4 rounded-xl text-center font-semibold text-sm hover:bg-white/10 hover:border-white/30 transition-all active:scale-[0.98]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </TokenGate>
  );
}
