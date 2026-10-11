"use client";

import { useState } from "react";
import { firstError, sourceUrlSchema } from "../../lib/validation";

/**
 * Article Editor (MST-040) — main canvas + inspector + desktop/mobile preview.
 * Client boundary: editor interactions only. Chưa nối persistence (MST-041
 * owns revision API) — mọi thay đổi là local state, autosave debounce là
 * follow-up khi endpoint sẵn sàng.
 */
type BlockKind = "paragraph" | "quote" | "heading";

interface Block {
  id: string;
  kind: BlockKind;
  text: string;
}

type PreviewMode = "desktop" | "mobile";

const blockLabels: Record<BlockKind, string> = {
  paragraph: "Đoạn văn",
  quote: "Trích dẫn",
  heading: "Tiêu đề mục",
};

function newBlock(kind: BlockKind): Block {
  return { id: crypto.randomUUID(), kind, text: "" };
}

const fieldStyle = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-base)",
  padding: "8px 12px",
  width: "100%",
} as const;

export default function EditorPage() {
  const [blocks, setBlocks] = useState<Block[]>([newBlock("paragraph")]);
  const [sources, setSources] = useState<string[]>([]);
  const [sourceInput, setSourceInput] = useState("");
  const [sourceError, setSourceError] = useState<string | undefined>(undefined);
  const [preview, setPreview] = useState<PreviewMode>("desktop");

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

  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>Article Editor</h1>
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
            {mode === "desktop" ? "Desktop" : "Mobile"}
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
            maxWidth: preview === "mobile" ? 390 : "100%",
            padding: 20,
            width: "100%",
          }}
        >
          <section aria-labelledby="canvas-meta-heading" style={{ marginBottom: 16 }}>
            <h2 id="canvas-meta-heading" style={{ fontSize: "var(--text-base)" }}>Headline &amp; Dek</h2>
            <label htmlFor="editor-headline" style={{ display: "block", marginBottom: 4 }}>Headline</label>
            <input id="editor-headline" defaultValue="" placeholder="Tiêu đề bài viết…" style={fieldStyle} />
            <label htmlFor="editor-dek" style={{ display: "block", margin: "12px 0 4px" }}>Dek</label>
            <textarea id="editor-dek" defaultValue="" placeholder="Đoạn mở đầu ngắn…" rows={2} style={fieldStyle} />
          </section>

          <section aria-labelledby="canvas-summary-heading" style={{ marginBottom: 16 }}>
            <h2 id="canvas-summary-heading" style={{ fontSize: "var(--text-base)" }}>Quick Summary</h2>
            <label htmlFor="editor-summary" style={{ display: "block", marginBottom: 4 }}>Tóm tắt nhanh</label>
            <textarea id="editor-summary" defaultValue="" placeholder="3–5 gạch đầu dòng…" rows={3} style={fieldStyle} />
          </section>

          <section aria-labelledby="canvas-blocks-heading" style={{ marginBottom: 16 }}>
            <h2 id="canvas-blocks-heading" style={{ fontSize: "var(--text-base)" }}>
              Rich blocks <span style={{ color: "var(--gray)" }}>({blocks.length})</span>
            </h2>
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
          </section>

          <section aria-labelledby="canvas-sources-heading">
            <h2 id="canvas-sources-heading" style={{ fontSize: "var(--text-base)" }}>Sources</h2>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
              {sources.map((source) => (
                <li key={source}>{source}</li>
              ))}
            </ul>
            <label htmlFor="editor-source" style={{ display: "block", marginBottom: 4 }}>Thêm nguồn (URL)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                aria-describedby={sourceError ? "editor-source-error" : undefined}
                aria-invalid={sourceError !== undefined}
                id="editor-source"
                onChange={(event) => setSourceInput(event.target.value)}
                placeholder="https://…"
                spellCheck={false}
                style={fieldStyle}
                type="url"
                value={sourceInput}
              />
              <button className="btn-primary" onClick={addSource} type="button">
                Thêm
              </button>
            </div>
            {sourceError ? (
              <p id="editor-source-error" role="alert" style={{ color: "var(--breaking-red)", margin: "4px 0 0" }}>
                {sourceError}
              </p>
            ) : null}
          </section>
        </div>

        <aside aria-label="Inspector" className="desk-pane" style={{ alignSelf: "start" }}>
          <h2 style={{ fontSize: "var(--text-base)", margin: "0 0 8px" }}>Inspector</h2>
          <section aria-labelledby="insp-content-heading" style={{ marginBottom: 12 }}>
            <h3 id="insp-content-heading" style={{ fontSize: "var(--text-sm)" }}>Content</h3>
            <p role="status" style={{ color: "var(--gray)", margin: 0 }}>{blocks.length} khối, {sources.length} nguồn.</p>
          </section>
          <section aria-labelledby="insp-seo-heading" style={{ marginBottom: 12 }}>
            <h3 id="insp-seo-heading" style={{ fontSize: "var(--text-sm)" }}>SEO</h3>
            <label htmlFor="editor-slug" style={{ display: "block", marginBottom: 4 }}>Slug</label>
            <input id="editor-slug" defaultValue="" placeholder="slug-bai-viet…" spellCheck={false} style={fieldStyle} />
          </section>
          <section aria-labelledby="insp-history-heading">
            <h3 id="insp-history-heading" style={{ fontSize: "var(--text-sm)" }}>History</h3>
            <p role="status" style={{ color: "var(--gray)", margin: 0 }}>Revision history (MST-041) sẽ hiển thị tại đây.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
