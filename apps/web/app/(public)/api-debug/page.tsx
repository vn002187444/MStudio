import { apiBaseUrl } from "../../../lib/api";

export const dynamic = "force-dynamic";

export default async function ApiDebugPage() {
  let resCustom = "";
  let statusCustom = 0;
  let errCustom = "";

  let resWorkersDev = "";
  let statusWorkersDev = 0;
  let errWorkersDev = "";

  try {
    const res = await fetch("https://api.mstudio.minds.io.vn/articles?limit=2", { cache: "no-store" });
    statusCustom = res.status;
    resCustom = (await res.text()).slice(0, 500);
  } catch (e) {
    errCustom = e instanceof Error ? e.message : String(e);
  }

  try {
    const res = await fetch("https://mstudio-api.vn002187444.workers.dev/articles?limit=2", { cache: "no-store" });
    statusWorkersDev = res.status;
    resWorkersDev = (await res.text()).slice(0, 500);
  } catch (e) {
    errWorkersDev = e instanceof Error ? e.message : String(e);
  }

  return (
    <main style={{ padding: 24, fontFamily: "monospace" }}>
      <h1>API Debug Diagnostics</h1>
      <h2>1. Custom domain: https://api.mstudio.minds.io.vn</h2>
      <p>Status: {statusCustom}</p>
      <p>Error: {errCustom}</p>
      <pre style={{ background: "#f1f5f9", padding: 12 }}>{resCustom}</pre>

      <h2>2. Workers.dev: https://mstudio-api.vn002187444.workers.dev</h2>
      <p>Status: {statusWorkersDev}</p>
      <p>Error: {errWorkersDev}</p>
      <pre style={{ background: "#f1f5f9", padding: 12 }}>{resWorkersDev}</pre>
    </main>
  );
}
