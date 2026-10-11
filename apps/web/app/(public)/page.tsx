import { apiBaseUrl } from "../../lib/api";

/**
 * Trang chủ editorial (MST-012 shell + MST-042 templates).
 * Dữ liệu bài published từ GET /articles (mới nhất trước).
 */
interface PublishedArticle {
  id: string;
  storyId: string;
  status: string;
  title: string;
  summary?: string;
  updatedAt: string;
  createdAt: string;
}

interface ArticlesResponse {
  rows: PublishedArticle[];
  nextCursor?: { createdAt: string; id: string };
}

async function fetchLatest(limit = 10): Promise<PublishedArticle[]> {
  try {
    const response = await fetch(`${apiBaseUrl()}/articles?limit=${limit}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as ArticlesResponse;
    return Array.isArray(payload.rows) ? payload.rows : [];
  } catch {
    return [];
  }
}

export default async function PublicHomePage() {
  const articles = await fetchLatest(10);
  const [hero, ...rest] = articles;
  const rail = rest.slice(0, 2);
  const latest = rest.slice(2);

  return (
    <main className="home-main" id="main-content">
      <h1 className="visually-hidden">MStudio Channel — trang chủ</h1>

      <section aria-labelledby="hero-heading" className="hero-grid">
        <article className="hero-main">
          {hero ? (
            <>
              <h2 id="hero-heading">
                <a href={`/bai-viet/${hero.id}`}>{hero.title}</a>
              </h2>
              {hero.summary ? <p>{hero.summary}</p> : null}
            </>
          ) : (
            <>
              <h2 id="hero-heading">Tin nổi bật</h2>
              <p role="status">Chưa có bài xuất bản.</p>
            </>
          )}
        </article>
        <aside aria-label="Tin thứ cấp" className="hero-rail">
          <h2>Tin thứ cấp</h2>
          {rail.length === 0 ? (
            <p role="status">Rail thứ cấp sẽ hiển thị khi có bài xuất bản.</p>
          ) : (
            <ul>
              {rail.map((article) => (
                <li key={article.id}>
                  <a href={`/bai-viet/${article.id}`}>{article.title}</a>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>

      <div className="home-columns">
        <section aria-labelledby="latest-heading">
          <h2 id="latest-heading">Mới nhất</h2>
          {latest.length === 0 && !hero ? (
            <p role="status">Feed mới nhất sẽ hiển thị khi có bài xuất bản.</p>
          ) : (
            <ul>
              {articles.slice(hero ? 3 : 0).map((article) => (
                <li key={article.id}>
                  <a href={`/bai-viet/${article.id}`}>{article.title}</a>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside aria-label="Modules sidebar" className="home-sidebar">
          <section aria-labelledby="topics-heading">
            <h2 id="topics-heading">Chủ đề theo dõi</h2>
            <p role="status">Follow/Hide (MST-062) sẽ kích hoạt module này.</p>
          </section>
          <section aria-labelledby="picks-heading">
            <h2 id="picks-heading">Lựa chọn biên tập</h2>
            <p role="status">Editorial picks sẽ hiển thị khi có bài xuất bản.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
