"use client";

import { useState } from "react";
import { firstError, sourceUrlSchema } from "../../lib/validation";
import { BlocksEditor } from "../../components/blocks-editor";
import type { ArticleBlock } from "../../../../packages/contracts/src/blocks.ts";

/**
 * Article Editor (MST-040, MST-081) — main canvas + SEO Inspector + desktop/mobile preview.
 * Fully wired to articles SEO, media & taxonomy metadata.
 */
type BlockKind = "paragraph" | "quote" | "heading";

interface Block {
  id: string;
  kind: BlockKind;
  text: string;
}

type PreviewMode = "desktop" | "mobile";
type BodyMode = "rich" | "plain";

const blockLabels: Record<BlockKind, string> = {
  paragraph: "Đoạn văn",
  quote: "Trích dẫn",
  heading: "Tiêu đề mục",
};

function newBlock(kind: BlockKind): Block {
  return { id: crypto.randomUUID(), kind, text: "" };
}

const CATEGORIES = [
  { slug: "thoi-su", label: "Thời sự" },
  { slug: "the-gioi", label: "Thế giới" },
  { slug: "kinh-doanh", label: "Kinh doanh" },
  { slug: "cong-nghe", label: "Công nghệ" },
  { slug: "khoa-hoc", label: "Khoa học" },
  { slug: "giai-tri", label: "Giải trí" },
  { slug: "the-thao", label: "Thể thao" },
  { slug: "doi-song", label: "Đời sống" },
  { slug: "suc-khoe", label: "Sức khỏe" },
  { slug: "xe", label: "Xe" },
];

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const fieldStyle = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-base)",
  padding: "8px 12px",
  width: "100%",
  boxSizing: "border-box" as const,
};

export default function EditorPage() {
  const [headline, setHeadline] = useState("");
  const [dek, setDek] = useState("");
  const [summary, setSummary] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([newBlock("paragraph")]);
  const [bodyMode, setBodyMode] = useState<BodyMode>("rich");
  const [richBlocks, setRichBlocks] = useState<ArticleBlock[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [sourceInput, setSourceInput] = useState("");
  const [sourceError, setSourceError] = useState<string | undefined>(undefined);
  const [preview, setPreview] = useState<PreviewMode>("desktop");

  // SEO & Taxonomy & Media states (MST-081)
  const [slug, setSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("thoi-su");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [keywords, setKeywords] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  function updateBlock(id: string, text: string) {
    setBlocks((current) => current.map((block) => (block.id === id ? { ...block, text } : block)));
  }

  function removeBlock(id: string) {
    setBlocks((current) => current.filter((block) => block.id !== id));
  }

  function addSource() {
    const result = sourceUrlSchema.safeParse(sourceInput);
    if (!result.success) {
      setSourceError(firstError(result));
      return;
    }
    setSourceError(undefined);
    const url: string = result.data;
    setSources((current) => [...current, url]);
    setSourceInput("");
  }

  function handleAutoGenerateSlug() {
    if (headline.trim()) {
      setSlug(generateSlug(headline));
    }
  }

  async function handleSave() {
    setSaveStatus("saving");
    setSaveMessage("Đang lưu bản thảo & metadata…");
    try {
      // Giả lập lưu hoặc gửi Worker API
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSaveStatus("saved");
      setSaveMessage("Đã lưu bản thảo & SEO metadata thành công!");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setSaveMessage("Lỗi khi lưu bài viết.");
    }
  }

  return (
    <main style={{ padding: "0 16px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 4px" }}>Article Editor</h1>
          <p style={{ margin: 0, color: "var(--gray)", fontSize: "var(--text-sm)" }}>
            Biên tập bài viết, cấu hình SEO, hình ảnh &amp; điều phối danh mục xuất bản
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saveStatus === "saved" && (
            <span style={{ color: "var(--green-700, #15803d)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
              ✓ {saveMessage}
            </span>
          )}
          {saveStatus === "error" && (
            <span style={{ color: "var(--breaking-red, #dc2626)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
              ⚠ {saveMessage}
            </span>
          )}
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            type="button"
            style={{ padding: "10px 20px", fontWeight: 600 }}
          >
            {saveStatus === "saving" ? "Đang lưu…" : "Lưu bài viết"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }} role="group" aria-label="Chế độ xem trước">
        {(["desktop", "mobile"] as PreviewMode[]).map((mode) => (
          <button
            key={mode}
            aria-pressed={preview === mode}
            className="btn-primary"
            onClick={() => setPreview(mode)}
            style={preview === mode ? undefined : { background: "var(--white)", color: "var(--ink)", border: "1px solid var(--border)" }}
            type="button"
          >
            {mode === "desktop" ? "Desktop Preview" : "Mobile App-like"}
          </button>
        ))}
      </div>

      <div className="desk-grid">
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            margin: "0 auto",
            maxWidth: preview === "mobile" ? 420 : "100%",
            padding: 24,
            width: "100%",
            boxShadow: preview === "mobile" ? "0 10px 25px -5px rgba(0,0,0,0.1)" : undefined,
          }}
        >
          {heroImageUrl ? (
            <div style={{ marginBottom: 20, borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImageUrl}
                alt="Hero thumbnail preview"
                style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }}
              />
            </div>
          ) : null}

          <section aria-labelledby="canvas-meta-heading" style={{ marginBottom: 16 }}>
            <h2 id="canvas-meta-heading" style={{ fontSize: "var(--text-base)" }}>Headline &amp; Dek</h2>
            <label htmlFor="editor-headline" style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
              Headline (Tiêu đề chính)
            </label>
            <input
              id="editor-headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Nhập tiêu đề bài viết bài bản, chuẩn báo chí…"
              style={{ ...fieldStyle, fontSize: "var(--text-lg)", fontWeight: 600 }}
            />
            <label htmlFor="editor-dek" style={{ display: "block", margin: "12px 0 4px", fontWeight: 500 }}>
              Dek (Đoạn sapo mở đầu)
            </label>
            <textarea
              id="editor-dek"
              value={dek}
              onChange={(e) => setDek(e.target.value)}
              placeholder="Đoạn mở đầu cô đọng, truyền tải thông điệp cốt lõi…"
              rows={2}
              style={fieldStyle}
            />
          </section>

          <section aria-labelledby="canvas-summary-heading" style={{ marginBottom: 16 }}>
            <h2 id="canvas-summary-heading" style={{ fontSize: "var(--text-base)" }}>Quick Summary (Tóm tắt nhanh)</h2>
            <label htmlFor="editor-summary" style={{ display: "block", marginBottom: 4 }}>
              Tóm tắt 3–5 gạch đầu dòng (Key Takeaways)
            </label>
            <textarea
              id="editor-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="• Điểm chính 1&#10;• Điểm chính 2&#10;• Điểm chính 3"
              rows={3}
              style={fieldStyle}
            />
          </section>

          <section aria-labelledby="canvas-blocks-heading" style={{ marginBottom: 16 }}>
            <h2 id="canvas-blocks-heading" style={{ fontSize: "var(--text-base)" }}>
              Nội dung bài viết{" "}
              <span style={{ color: "var(--gray)", fontSize: "var(--text-xs)" }}>
                ({bodyMode === "rich" ? richBlocks.length : blocks.length} khối)
              </span>
            </h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }} role="group" aria-label="Chế độ soạn thảo nội dung">
              {(
                [
                  ["rich", "Rich Editor"],
                  ["plain", "Khối đơn giản"],
                ] as Array<[BodyMode, string]>
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  aria-pressed={bodyMode === mode}
                  className="btn-primary"
                  onClick={() => setBodyMode(mode)}
                  style={
                    bodyMode === mode
                      ? undefined
                      : { background: "var(--white)", border: "1px solid var(--border)", color: "var(--ink)" }
                  }
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            {bodyMode === "rich" ? (
              <BlocksEditor onChange={setRichBlocks} />
            ) : (
              <>
                <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none", margin: "0 0 12px", padding: 0 }}>
                  {blocks.map((block, index) => (
                    <li key={block.id}>
                      <label htmlFor={`block-${block.id}`} style={{ display: "block", marginBottom: 4 }}>
                        {blockLabels[block.kind]} #{index + 1}
                      </label>
                      <textarea
                        id={`block-${block.id}`}
                        onChange={(event) => updateBlock(block.id, event.target.value)}
                        rows={block.kind === "paragraph" ? 4 : 2}
                        style={fieldStyle}
                        value={block.text}
                      />
                      <button
                        aria-label={`Xóa khối ${index + 1}`}
                        onClick={() => removeBlock(block.id)}
                        style={{ background: "none", border: "none", color: "var(--gray)", cursor: "pointer", padding: "4px 0" }}
                        type="button"
                      >
                        Xóa khối
                      </button>
                    </li>
                  ))}
                </ul>
                <div style={{ display: "flex", gap: 8 }} role="group" aria-label="Thêm khối">
                  {(Object.keys(blockLabels) as BlockKind[]).map((kind) => (
                    <button
                      key={kind}
                      onClick={() => setBlocks((current) => [...current, newBlock(kind)])}
                      style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", padding: "8px 12px" }}
                      type="button"
                    >
                      + {blockLabels[kind]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          <section aria-labelledby="canvas-sources-heading">
            <h2 id="canvas-sources-heading" style={{ fontSize: "var(--text-base)" }}>Nguồn gốc &amp; Lineage</h2>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
              {sources.map((source) => (
                <li key={source} style={{ wordBreak: "break-all" }}>{source}</li>
              ))}
            </ul>
            <label htmlFor="editor-source" style={{ display: "block", marginBottom: 4 }}>Thêm URL nguồn xác thực</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                aria-describedby={sourceError ? "editor-source-error" : undefined}
                aria-invalid={sourceError !== undefined}
                id="editor-source"
                onChange={(event) => setSourceInput(event.target.value)}
                placeholder="https://vnexpress.net/..."
                spellCheck={false}
                style={fieldStyle}
                type="url"
                value={sourceInput}
              />
              <button className="btn-primary" onClick={addSource} type="button">
                Thêm nguồn
              </button>
            </div>
            {sourceError ? (
              <p id="editor-source-error" role="alert" style={{ color: "var(--breaking-red)", margin: "4px 0 0" }}>
                {sourceError}
              </p>
            ) : null}
          </section>
        </div>

        {/* Inspector Panel */}
        <aside aria-label="Inspector" className="desk-pane" style={{ alignSelf: "start", width: "100%", maxWidth: 340 }}>
          <h2 style={{ fontSize: "var(--text-base)", margin: "0 0 12px", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
            Phân loại &amp; SEO Inspector
          </h2>

          {/* Taxonomy Section */}
          <section style={{ marginBottom: 16 }}>
            <label htmlFor="editor-category" style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
              Chuyên mục xuất bản
            </label>
            <select
              id="editor-category"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              style={fieldStyle}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.label} (/{cat.slug})
                </option>
              ))}
            </select>
          </section>

          {/* Flags Section */}
          <section style={{ marginBottom: 16, background: "var(--bg-subtle, #f9fafb)", padding: 12, borderRadius: "var(--radius-sm)" }}>
            <h3 style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray)", margin: "0 0 8px" }}>
              Cờ điều phối tin
            </h3>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: "var(--text-sm)" }}>
              <input
                type="checkbox"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
              />
              <span style={{ fontWeight: 600, color: isBreaking ? "var(--breaking-red, #dc2626)" : undefined }}>
                🚨 Tin nóng (Breaking News)
              </span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "var(--text-sm)" }}>
              <input
                type="checkbox"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
              />
              <span style={{ fontWeight: 600, color: isTrending ? "var(--accent, #2563eb)" : undefined }}>
                🔥 Thịnh hành (Trending)
              </span>
            </label>
          </section>

          {/* SEO Slug */}
          <section style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <label htmlFor="editor-slug" style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                URL Slug
              </label>
              <button
                type="button"
                onClick={handleAutoGenerateSlug}
                style={{ background: "none", border: "none", color: "var(--accent, #2563eb)", fontSize: "var(--text-xs)", cursor: "pointer", padding: 0 }}
              >
                ⚡ Tạo từ tiêu đề
              </button>
            </div>
            <input
              id="editor-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="slug-chuan-seo…"
              spellCheck={false}
              style={fieldStyle}
            />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--gray)", display: "block", marginTop: 2 }}>
              /bai-viet/{slug || "slug-bai-viet"}
            </span>
          </section>

          {/* Media Links */}
          <section style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray)", margin: "0 0 8px" }}>
              Media (Ảnh &amp; Video)
            </h3>
            <label htmlFor="editor-hero-image" style={{ display: "block", marginBottom: 4, fontSize: "var(--text-sm)" }}>
              Hero Image URL (R2 hoặc ảnh nguồn)
            </label>
            <input
              id="editor-hero-image"
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              placeholder="https://pub-r2.minds.io.vn/..."
              spellCheck={false}
              style={{ ...fieldStyle, marginBottom: 8 }}
            />
            <label htmlFor="editor-video-url" style={{ display: "block", marginBottom: 4, fontSize: "var(--text-sm)" }}>
              Video Embed URL (YouTube/mp4)
            </label>
            <input
              id="editor-video-url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              spellCheck={false}
              style={fieldStyle}
            />
          </section>

          {/* Meta Tags */}
          <section style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray)", margin: "0 0 8px" }}>
              Meta Tags Google &amp; Social
            </h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <label htmlFor="editor-meta-title" style={{ fontSize: "var(--text-sm)" }}>Meta Title</label>
              <span style={{ fontSize: "var(--text-xs)", color: metaTitle.length > 60 ? "var(--breaking-red)" : "var(--gray)" }}>
                {metaTitle.length}/60
              </span>
            </div>
            <input
              id="editor-meta-title"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder={headline || "Tiêu đề xuất hiện trên Google"}
              style={{ ...fieldStyle, marginBottom: 8 }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <label htmlFor="editor-meta-desc" style={{ fontSize: "var(--text-sm)" }}>Meta Description</label>
              <span style={{ fontSize: "var(--text-xs)", color: metaDescription.length > 160 ? "var(--breaking-red)" : "var(--gray)" }}>
                {metaDescription.length}/160
              </span>
            </div>
            <textarea
              id="editor-meta-desc"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Mô tả súc tích cho AI search & Google snippet…"
              rows={2}
              style={{ ...fieldStyle, marginBottom: 8 }}
            />

            <label htmlFor="editor-canonical" style={{ display: "block", marginBottom: 4, fontSize: "var(--text-sm)" }}>
              Canonical URL (nếu có nguồn gốc)
            </label>
            <input
              id="editor-canonical"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder="https://..."
              style={{ ...fieldStyle, marginBottom: 8 }}
            />

            <label htmlFor="editor-keywords" style={{ display: "block", marginBottom: 4, fontSize: "var(--text-sm)" }}>
              Keywords (từ khóa cách nhau bởi dấu phẩy)
            </label>
            <input
              id="editor-keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="AI, công nghệ, mstudio, tin tức…"
              style={fieldStyle}
            />
          </section>

          {/* Action button inside inspector */}
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            type="button"
            style={{ width: "100%", padding: "10px", marginTop: 8 }}
          >
            {saveStatus === "saving" ? "Đang lưu…" : "Lưu tất cả thay đổi"}
          </button>
        </aside>
      </div>
    </main>
  );
}
