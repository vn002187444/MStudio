import { primaryNav } from "../../components/navigation/taxonomy";
import { FollowTopicButton, HideTopicButton } from "../../components/discovery/follow-controls";

/**
 * Dành cho bạn (MST-062) — feed candidates từ GET /recommendations +
 * quản lý follow/hide theo topic (POST /events qua proxy same-origin).
 * userId: anonymous (optional theo contract) cho đến khi có auth (MST auth).
 */
interface RecommendationCandidate {
  articleId: string;
  pool: "fresh" | "trending" | "followed" | "related";
  score: number;
  reason: string;
}

interface RecommendationsResponse {
  candidates: RecommendationCandidate[];
}

const poolLabels: Record<RecommendationCandidate["pool"], string> = {
  fresh: "Mới",
  trending: "Đang nóng",
  followed: "Đang theo dõi",
  related: "Liên quan",
};

function apiBaseUrl(): string {
  return process.env.MSTUDIO_API_URL ?? "http://localhost:8787";
}

async function fetchCandidates(): Promise<RecommendationCandidate[]> {
  const response = await fetch(`${apiBaseUrl()}/recommendations?limit=10`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`recommendations API ${response.status}`);
  }
  const payload = (await response.json()) as RecommendationsResponse;
  return Array.isArray(payload.candidates) ? payload.candidates : [];
}

export default async function ForYouPage() {
  const candidates = await fetchCandidates();

  return (
    <main className="home-main" id="main-content">
      <h1 style={{ fontSize: "var(--text-4xl)", margin: "0 0 8px" }}>Dành cho bạn</h1>
      <p style={{ color: "var(--gray)", margin: "0 0 24px" }}>
        Gợi ý từ các pool fresh, trending, followed và related — kèm lý do hiển thị.
      </p>

      <section aria-labelledby="foryou-feed-heading" style={{ marginBottom: 32 }}>
        <h2 id="foryou-feed-heading">Gợi ý hôm nay</h2>
        {candidates.length === 0 ? (
          <p role="status" style={{ color: "var(--gray)" }}>
            Chưa có gợi ý — theo dõi chủ đề bên dưới để cá nhân hóa feed.
          </p>
        ) : (
          <ul className="rec-list">
            {candidates.map((candidate) => (
              <li key={`${candidate.pool}-${candidate.articleId}`} className="rec-card">
                <p style={{ margin: "0 0 4px" }}>
                  <span className="rec-pool">{poolLabels[candidate.pool]}</span>
                </p>
                <p style={{ margin: "0 0 8px" }}>
                  Bài viết đề xuất <code>{candidate.articleId.slice(0, 8)}</code>
                </p>
                <details>
                  <summary>Vì sao tôi thấy tin này?</summary>
                  <p style={{ color: "var(--gray)", margin: "8px 0 0" }}>{candidate.reason}</p>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="topics-manage-heading">
        <h2 id="topics-manage-heading">Theo dõi / Ẩn chủ đề</h2>
        <ul className="topic-manage-list">
          {primaryNav.map((topic) => (
            <li key={topic.href} className="topic-manage-row">
              <span>{topic.label}</span>
              <span style={{ display: "flex", gap: 8 }}>
                <FollowTopicButton topicId={topic.href} topicLabel={topic.label} />
                <HideTopicButton topicId={topic.href} topicLabel={topic.label} />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
