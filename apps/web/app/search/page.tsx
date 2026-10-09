import type { Metadata } from "next";

/**
 * Search UX (MST-051) — form GET giữ state trong URL (?q=), server-rendered.
 * noindex: trang kết quả tìm kiếm không cho index. Phân trang keyset sẵn sàng
 * khi backend mở endpoint search (hiện render empty state trung thực).
 */
export const metadata: Metadata = {
  title: "Tìm kiếm | MStudio Channel",
  description: "Tìm kiếm bài viết, chủ đề, nhân vật trên MStudio Channel.",
  robots: { index: false, follow: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>> | Record<string, string | undefined>;
}) {
  const params = await Promise.resolve(searchParams ?? {});
  const query = (params.q ?? "").trim();

  return (
    <main className="home-main" id="main-content">
      <h1 style={{ fontSize: "var(--text-4xl)", margin: "0 0 16px" }}>Tìm kiếm</h1>
      <form action="/search" method="get" role="search">
        <label htmlFor="search-query" style={{ display: "block", marginBottom: 4 }}>
          Từ khóa
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            autoComplete="off"
            defaultValue={query}
            id="search-query"
            name="q"
            placeholder="Nhập từ khóa…"
            spellCheck={false}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-base)",
              padding: "8px 12px",
              width: "100%",
            }}
            type="search"
          />
          <button className="btn-search" type="submit">
            Tìm
          </button>
        </div>
      </form>

      <section aria-labelledby="search-results-heading" style={{ marginTop: 24 }}>
        <h2 id="search-results-heading">Kết quả</h2>
        {query === "" ? (
          <p role="status" style={{ color: "var(--gray)" }}>
            Nhập từ khóa ở trên để tìm kiếm.
          </p>
        ) : (
          <p role="status" style={{ color: "var(--gray)" }}>
            Chưa có kết quả cho “{query}” — search backend sẽ nối ở giai đoạn discovery.
          </p>
        )}
      </section>
    </main>
  );
}
