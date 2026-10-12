import { apiBaseUrl } from "../../../lib/api";

export default async function ApiDebugPage() {
  let baseUrl = "";
  let fetchResult = "";
  let fetchStatus = 0;
  let fetchError = "";

  try {
    baseUrl = apiBaseUrl();
    const res = await fetch(`${baseUrl}/articles/71f883bc-c984-4af5-b8c3-12bcf43a71e9`, {
      cache: "no-store",
    });
    fetchStatus = res.status;
    const text = await res.text();
    fetchResult = text.slice(0, 500);
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e);
  }

  return (
    <main style={{ padding: 24, fontFamily: "monospace" }}>
      <h1>API Debug</h1>
      <p>baseUrl: {baseUrl}</p>
      <p>fetchStatus: {fetchStatus}</p>
      <p>fetchError: {fetchError}</p>
      <p>fetchResult: {fetchResult}</p>
    </main>
  );
}
