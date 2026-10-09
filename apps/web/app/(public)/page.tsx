/**
 * Trang chủ editorial shell (MST-012).
 * Hero + secondary rail, latest feed, sidebar modules — nội dung bài thật ở MST-042.
 */
export default function PublicHomePage() {
  return (
    <main className="home-main" id="main-content">
      <h1 className="visually-hidden">MStudio Channel — trang chủ</h1>

      <section aria-labelledby="hero-heading" className="hero-grid">
        <article className="hero-main">
          <h2 id="hero-heading">Tin nổi bật</h2>
          <p role="status">Bài viết xuất bản (MST-042) sẽ hiển thị tại đây.</p>
        </article>
        <aside aria-label="Tin thứ cấp" className="hero-rail">
          <h2>Tin thứ cấp</h2>
          <p role="status">Rail thứ cấp sẽ hiển thị khi có bài xuất bản.</p>
        </aside>
      </section>

      <div className="home-columns">
        <section aria-labelledby="latest-heading">
          <h2 id="latest-heading">Mới nhất</h2>
          <p role="status">Feed mới nhất sẽ hiển thị khi có bài xuất bản (MST-042).</p>
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
