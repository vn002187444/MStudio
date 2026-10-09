/**
 * AI Desk (MST-032) — agent status, history, failure view, generate-draft action.
 * Shapes mirror packages/contracts agent.ts (TODO: import trực tiếp khi MST-002
 * wire workspace dep). Chưa có endpoint kích hoạt/trigger từ backend nên nút
 * Generate ở trạng thái disabled trung thực + ghi rõ follow-up.
 */
type AgentRunStatus = "pending" | "running" | "succeeded" | "failed";

interface AgentRunRow {
  id: string;
  storyId?: string;
  type: string;
  promptVersion: string;
  model: string;
  status: AgentRunStatus;
  errorCode?: string;
  errorMessage?: string;
  attempt: number;
  maxAttempts: number;
  createdAt: string;
}

// Chưa có GET /agent-runs — giữ empty cho đến khi backend mở endpoint (contract freeze trước).
const runs: AgentRunRow[] = [];

const statusOrder: AgentRunStatus[] = ["running", "pending", "failed", "succeeded"];

export default function AiDeskPage() {
  const counts = new Map<AgentRunStatus, number>(
    statusOrder.map((status) => [status, runs.filter((run) => run.status === status).length]),
  );

  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>AI Desk</h1>
      <section aria-labelledby="agent-status-heading" style={{ marginBottom: 24 }}>
        <h2 id="agent-status-heading" style={{ fontSize: "var(--text-base)", margin: "0 0 8px" }}>
          Trạng thái agent
        </h2>
        <ul style={{ display: "flex", gap: 16, listStyle: "none", margin: 0, padding: 0 }}>
          {statusOrder.map((status) => (
            <li key={status}>
              {status}: {counts.get(status) ?? 0}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="agent-history-heading" style={{ marginBottom: 24 }}>
        <h2 id="agent-history-heading" style={{ fontSize: "var(--text-base)", margin: "0 0 8px" }}>
          Lịch sử chạy
        </h2>
        {runs.length === 0 ? (
          <p role="status" style={{ color: "var(--gray)", margin: 0 }}>
            Chưa có agent run nào — workflow verification/writer (MST-031) sẽ ghi lại tại đây.
          </p>
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left" }}>Loại</th>
                <th scope="col" style={{ textAlign: "left" }}>Model</th>
                <th scope="col" style={{ textAlign: "left" }}>Trạng thái</th>
                <th scope="col" style={{ textAlign: "left" }}>Lỗi</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td>{run.type}</td>
                  <td>{run.model}</td>
                  <td>{run.status}</td>
                  <td>{run.status === "failed" ? (run.errorCode ?? "unknown") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="agent-failure-heading" style={{ marginBottom: 24 }}>
        <h2 id="agent-failure-heading" style={{ fontSize: "var(--text-base)", margin: "0 0 8px" }}>
          Lỗi cần xem
        </h2>
        <p role="status" style={{ color: "var(--gray)", margin: 0 }}>
          Run thất bại sẽ hiện error code/message và số lần thử tại đây.
        </p>
      </section>

      <section aria-labelledby="generate-draft-heading">
        <h2 id="generate-draft-heading" style={{ fontSize: "var(--text-base)", margin: "0 0 8px" }}>
          Tạo bản thảo
        </h2>
        <button className="btn-primary" disabled type="button">
          Generate draft
        </button>
        <p style={{ color: "var(--gray)" }}>
          Nút kích hoạt khi backend mở endpoint trigger writer (follow-up sau MST-031).
        </p>
      </section>
    </main>
  );
}
