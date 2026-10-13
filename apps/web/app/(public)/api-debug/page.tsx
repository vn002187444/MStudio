import { apiBaseUrl } from "../../../lib/api";

export const dynamic = "force-dynamic";

export default async function ApiDebugPage() {
  let baseUrl = "";
  let fetchResult = "";
  let fetchStatus = 0;
  let fetchError = "";

  try {
    baseUrl = apiBaseUrl();
    const res = await fetch(`${baseUrl}/articles?limit=5`, {
      cache: "no-store",
    });
    fetchStatus = res.status;
    const text = await res.text();
    fetchResult = text.slice(0, 1000);
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e);
  }

  return (
    <main style={{ padding: 24, fontFamily: "monospace" }}>
      <h1>API Debug Diagnostics</h1>
      <p><strong>baseUrl:</strong> {baseUrl}</p>
      <p><strong>fetchStatus:</strong> {fetchStatus}</p>
      <p><strong>fetchError:</strong> {fetchError}</p>
      <pre style={{ background: "#f1f5f9", padding: 12, borderRadius: 6, overflowX: "auto" }}>
        {fetchResult}
      </pre>
    </main>
  );
}
