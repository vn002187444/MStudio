"use client";

import { useEffect, useState, useTransition } from "react";
import { apiBaseUrl, type FeedRow, type SourceRow } from "../lib/cms";
import { TokenGate, useCmsToken } from "./cms-actions";

export function SourcesManager() {
  const [token] = useCmsToken();
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [feedsBySource, setFeedsBySource] = useState<Record<string, FeedRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Dialogs / Form States
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({
    id: "",
    name: "",
    originUrl: "",
    kind: "rss",
    rightsStatus: "unknown",
  });

  const [activeFeedSourceId, setActiveFeedSourceId] = useState<string | null>(null);
  const [newFeed, setNewFeed] = useState({
    url: "",
    format: "rss",
    enabled: true,
    fetchIntervalSeconds: 900,
  });

  const [editingSource, setEditingSource] = useState<SourceRow | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl()}/sources?limit=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { rows?: SourceRow[] };
      const loadedSources = data.rows ?? [];
      setSources(loadedSources);

      // Load feeds for all sources in parallel
      const feedEntries = await Promise.all(
        loadedSources.map(async (s) => {
          try {
            const fRes = await fetch(`${apiBaseUrl()}/sources/${s.id}/feeds`);
            if (!fRes.ok) return [s.id, []] as const;
            const fData = (await fRes.json()) as { rows?: FeedRow[]; feeds?: FeedRow[] };
            return [s.id, fData.rows ?? fData.feeds ?? []] as const;
          } catch {
            return [s.id, []] as const;
          }
        }),
      );
      setFeedsBySource(Object.fromEntries(feedEntries));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${apiBaseUrl()}/sources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newSource),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: { message?: string } })?.error?.message ?? `Lỗi ${res.status}`);
      }
      setShowAddSource(false);
      setNewSource({ id: "", name: "", originUrl: "", kind: "rss", rightsStatus: "unknown" });
      void loadData();
    } catch (err) {
      alert(`Không thể tạo nguồn: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleUpdateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingSource) return;
    try {
      const res = await fetch(`${apiBaseUrl()}/sources/${editingSource.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingSource.name,
          originUrl: editingSource.originUrl,
          kind: editingSource.kind,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: { message?: string } })?.error?.message ?? `Lỗi ${res.status}`);
      }
      setEditingSource(null);
      void loadData();
    } catch (err) {
      alert(`Không thể cập nhật nguồn: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleUpdateAllowStatus = async (sourceId: string, allowStatus: "approved" | "denied" | "pending") => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBaseUrl()}/sources/${sourceId}/allow-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ allowStatus }),
      });
      if (!res.ok) throw new Error(`Lỗi ${res.status}`);
      void loadData();
    } catch (err) {
      alert(`Lỗi cập nhật trạng thái: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!token) return;
    if (!confirm(`Bạn có chắc chắn muốn xoá nguồn ${sourceId}? Tất cả các feeds và dữ liệu liên quan sẽ bị xoá.`)) return;
    try {
      const res = await fetch(`${apiBaseUrl()}/sources/${sourceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Lỗi ${res.status}`);
      void loadData();
    } catch (err) {
      alert(`Không thể xoá nguồn: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeFeedSourceId) return;
    try {
      const res = await fetch(`${apiBaseUrl()}/sources/${activeFeedSourceId}/feeds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newFeed),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: { message?: string } })?.error?.message ?? `Lỗi ${res.status}`);
      }
      setActiveFeedSourceId(null);
      setNewFeed({ url: "", format: "rss", enabled: true, fetchIntervalSeconds: 900 });
      void loadData();
    } catch (err) {
      alert(`Không thể tạo feed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleToggleFeed = async (feedId: string, currentEnabled: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBaseUrl()}/feeds/${feedId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (!res.ok) throw new Error(`Lỗi ${res.status}`);
      void loadData();
    } catch (err) {
      alert(`Không thể thay đổi trạng thái feed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    if (!token) return;
    if (!confirm("Bạn có chắc chắn muốn xoá feed này?")) return;
    try {
      const res = await fetch(`${apiBaseUrl()}/feeds/${feedId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Lỗi ${res.status}`);
      void loadData();
    } catch (err) {
      alert(`Không thể xoá feed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const filteredSources = sources.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.originUrl.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <TokenGate>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Tìm nguồn theo tên, ID, domain..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            fontSize: "13px",
            minWidth: 260,
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            style={{
              padding: "8px 14px",
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {loading ? "Đang tải…" : "Làm mới"}
          </button>
          <button
            type="button"
            onClick={() => setShowAddSource(true)}
            style={{
              padding: "8px 14px",
              background: "var(--ink)",
              color: "var(--white)",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Thêm Nguồn Mới
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Modal Add Source */}
      {showAddSource && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <form
            onSubmit={handleCreateSource}
            style={{
              background: "var(--white)",
              padding: 24,
              borderRadius: 12,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>Thêm Nguồn Tin Mới</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>ID Nguồn (slug)</label>
                <input
                  required
                  placeholder="ví dụ: src-techcrunch"
                  value={newSource.id}
                  onChange={(e) => setNewSource({ ...newSource, id: e.target.value })}
                  style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tên Nguồn</label>
                <input
                  required
                  placeholder="ví dụ: TechCrunch"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Origin URL</label>
                <input
                  required
                  type="url"
                  placeholder="https://techcrunch.com"
                  value={newSource.originUrl}
                  onChange={(e) => setNewSource({ ...newSource, originUrl: e.target.value })}
                  style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Loại (Kind)</label>
                  <select
                    value={newSource.kind}
                    onChange={(e) => setNewSource({ ...newSource, kind: e.target.value })}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="rss">RSS / Atom</option>
                    <option value="sitemap">Sitemap</option>
                    <option value="api">API</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Bản quyền (Rights)</label>
                  <select
                    value={newSource.rightsStatus}
                    onChange={(e) => setNewSource({ ...newSource, rightsStatus: e.target.value })}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="unknown">Unknown</option>
                    <option value="clear">Clear (Public/CC)</option>
                    <option value="licensed">Licensed</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowAddSource(false)}
                style={{ padding: "8px 14px", border: "1px solid var(--border)", borderRadius: 6, background: "none", cursor: "pointer" }}
              >
                Hủy
              </button>
              <button
                type="submit"
                style={{ padding: "8px 14px", background: "var(--ink)", color: "var(--white)", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
              >
                Tạo Nguồn
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Edit Source */}
      {editingSource && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <form
            onSubmit={handleUpdateSource}
            style={{
              background: "var(--white)",
              padding: 24,
              borderRadius: 12,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>Chỉnh sửa Nguồn: {editingSource.id}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tên Nguồn</label>
                <input
                  required
                  value={editingSource.name}
                  onChange={(e) => setEditingSource({ ...editingSource, name: e.target.value })}
                  style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Origin URL</label>
                <input
                  required
                  type="url"
                  value={editingSource.originUrl}
                  onChange={(e) => setEditingSource({ ...editingSource, originUrl: e.target.value })}
                  style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Loại (Kind)</label>
                <select
                  value={editingSource.kind}
                  onChange={(e) => setEditingSource({ ...editingSource, kind: e.target.value })}
                  style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }}
                >
                  <option value="rss">RSS / Atom</option>
                  <option value="sitemap">Sitemap</option>
                  <option value="api">API</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setEditingSource(null)}
                style={{ padding: "8px 14px", border: "1px solid var(--border)", borderRadius: 6, background: "none", cursor: "pointer" }}
              >
                Hủy
              </button>
              <button
                type="submit"
                style={{ padding: "8px 14px", background: "var(--ink)", color: "var(--white)", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
              >
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Add Feed */}
      {activeFeedSourceId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <form
            onSubmit={handleCreateFeed}
            style={{
              background: "var(--white)",
              padding: 24,
              borderRadius: 12,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>Thêm Feed cho nguồn: {activeFeedSourceId}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>URL Feed (RSS / Atom)</label>
                <input
                  required
                  type="url"
                  placeholder="https://example.com/feed.xml"
                  value={newFeed.url}
                  onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                  style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Định dạng (Format)</label>
                  <select
                    value={newFeed.format}
                    onChange={(e) => setNewFeed({ ...newFeed, format: e.target.value })}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="rss">RSS 2.0</option>
                    <option value="atom">Atom (YouTube/Reddit)</option>
                    <option value="jsonfeed">JSON Feed</option>
                    <option value="sitemap">Sitemap</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tần suất cào (giây)</label>
                  <input
                    type="number"
                    min="300"
                    step="60"
                    value={newFeed.fetchIntervalSeconds}
                    onChange={(e) => setNewFeed({ ...newFeed, fetchIntervalSeconds: parseInt(e.target.value, 10) || 900 })}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setActiveFeedSourceId(null)}
                style={{ padding: "8px 14px", border: "1px solid var(--border)", borderRadius: 6, background: "none", cursor: "pointer" }}
              >
                Hủy
              </button>
              <button
                type="submit"
                style={{ padding: "8px 14px", background: "var(--ink)", color: "var(--white)", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
              >
                Thêm Feed
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sources Grid */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}>
        {filteredSources.map((source) => {
          const feeds = feedsBySource[source.id] ?? [];
          return (
            <section
              aria-labelledby={`source-${source.id}`}
              key={source.id}
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <h2
                      id={`source-${source.id}`}
                      style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 2px", color: "var(--ink)" }}
                    >
                      {source.name}
                    </h2>
                    <span style={{ fontSize: 11, color: "var(--gray)", fontFamily: "monospace" }}>{source.id}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <button
                      type="button"
                      title="Chuyển trạng thái Duyệt"
                      onClick={() =>
                        handleUpdateAllowStatus(
                          source.id,
                          source.allowStatus === "approved" ? "denied" : "approved",
                        )
                      }
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        background: source.allowStatus === "approved" ? "#dcfce7" : "#fee2e2",
                        color: source.allowStatus === "approved" ? "#15803d" : "#b91c1c",
                        padding: "3px 8px",
                        borderRadius: 999,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {source.allowStatus}
                    </button>
                    <button
                      type="button"
                      title="Chỉnh sửa nguồn"
                      onClick={() => setEditingSource(source)}
                      style={{
                        fontSize: 11,
                        padding: "3px 6px",
                        background: "#f1f5f9",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      title="Xoá nguồn"
                      onClick={() => handleDeleteSource(source.id)}
                      style={{
                        fontSize: 11,
                        padding: "3px 6px",
                        background: "#fff1f2",
                        border: "1px solid #fecdd3",
                        color: "#e11d48",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <p style={{ color: "var(--gray)", fontSize: "12.5px", margin: "0 0 12px", wordBreak: "break-all" }}>
                  <a
                    href={source.originUrl}
                    rel="noreferrer"
                    target="_blank"
                    style={{ color: "var(--ai-blue)", textDecoration: "none" }}
                  >
                    {source.originUrl}
                  </a>
                  {" · "}
                  <span style={{ fontWeight: 600 }}>{source.kind.toUpperCase()}</span>
                </p>

                <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
                      Luồng Feed ({feeds.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveFeedSourceId(source.id)}
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        color: "#2563eb",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      + Feed
                    </button>
                  </div>

                  {feeds.length === 0 ? (
                    <p style={{ fontSize: 11, color: "var(--gray)", margin: "4px 0" }}>Chưa có feed nào được gán.</p>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: 14, fontSize: "12px", color: "var(--gray)", display: "flex", flexDirection: "column", gap: 6 }}>
                      {feeds.map((feed) => (
                        <li key={feed.id} style={{ wordBreak: "break-all" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                            <span style={{ color: "var(--ink)", flex: 1 }}>{feed.url}</span>
                            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => handleToggleFeed(feed.id, feed.enabled)}
                                style={{
                                  fontSize: 10,
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                  background: feed.enabled ? "#f0fdf4" : "#f1f5f9",
                                  color: feed.enabled ? "#16a34a" : "#64748b",
                                  border: "1px solid var(--border)",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                {feed.format} · {feed.enabled ? "BẬT" : "TẮT"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFeed(feed.id)}
                                style={{
                                  fontSize: 10,
                                  padding: "1px 4px",
                                  borderRadius: 4,
                                  background: "#fee2e2",
                                  color: "#b91c1c",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </TokenGate>
  );
}
