import { StoryClusters } from "../../components/story-clusters";

/**
 * Story Clusters — nhóm article theo storyId. Chưa có GET /stories nên
 * aggregate từ các status queue + published list (xem components).
 */
export default function ClustersPage() {
  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>
        Story Clusters
      </h1>
      <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
        Các cụm tin theo story: bài chính, số bài con và trạng thái pipeline.
      </p>
      <StoryClusters />
    </main>
  );
}
