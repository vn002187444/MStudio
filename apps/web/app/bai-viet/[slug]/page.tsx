import type { Metadata } from "next";
import { ArticleHero } from "../../../components/article/article-hero";
import { SourceBlock } from "../../../components/article/source-block";

/**
 * Article template (MST-042) — thứ tự đọc mobile-first theo PLAN:
 * category -> headline -> dek -> source/time -> hero -> Quick Summary ->
 * body -> context/timeline -> sources -> related.
 * Chưa nối dữ liệu xuất bản (MST-041) nên render empty state + noindex
 * (tránh index shell rỗng; gỡ khi có bài thật).
 */
export const metadata: Metadata = {
  title: "Bài viết | MStudio Channel",
  description: "Mẫu bài viết MStudio Channel — nội dung xuất bản sẽ hiển thị tại đây.",
  robots: { index: false, follow: false },
};

export default function ArticlePage() {
  return (
    <main className="article-main" id="main-content">
      <p style={{ color: "var(--gray)", margin: "0 0 4px" }}>Chuyên mục</p>
      <h1 style={{ fontSize: "var(--text-4xl)", margin: "0 0 8px" }}>Tiêu đề bài viết</h1>
      <p style={{ color: "var(--gray)", margin: "0 0 8px" }}>
        Dek của bài viết — một đến hai câu tóm tắt.
      </p>
      <p style={{ color: "var(--gray)", margin: "0 0 24px" }}>
        Nguồn · thời gian xuất bản sẽ hiển thị cùng story meta (MST-041).
      </p>

      <ArticleHero seed="article-template" />

      <section aria-labelledby="article-summary-heading">
        <h2 id="article-summary-heading">Quick Summary</h2>
        <p role="status" style={{ color: "var(--gray)" }}>
          Tóm tắt nhanh sẽ hiển thị khi bài được xuất bản.
        </p>
      </section>

      <section aria-labelledby="article-body-heading">
        <h2 id="article-body-heading">Nội dung</h2>
        <p role="status" style={{ color: "var(--gray)" }}>
          Rich blocks (đoạn văn, trích dẫn, timeline, context) sẽ hiển thị tại đây.
        </p>
      </section>

      <SourceBlock sources={[]} />

      <section aria-labelledby="article-related-heading">
        <h2 id="article-related-heading">Tin liên quan</h2>
        <p role="status" style={{ color: "var(--gray)" }}>
          Liên kết nội bộ theo entity/topic (MST-050) sẽ hiển thị tại đây.
        </p>
      </section>
    </main>
  );
}
