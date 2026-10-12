"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import type { ArticleBlock } from "../../../packages/contracts/src/blocks.ts";
import { blocksToTiptapDoc, tiptapDocToBlocks } from "../lib/blocks";

/**
 * Blocks editor (FU-05) — Tiptap headless, serialize sang ArticleBlock[]
 * (packages/contracts) chứ không giữ HTML string. Chỉ state local:
 * persistence theo revision API (MST-041) là follow-up.
 */
export interface BlocksEditorProps {
  /** Seed editor từ blocks đã lưu (draft mở lại). */
  initialBlocks?: ArticleBlock[];
  onChange?: (blocks: ArticleBlock[]) => void;
  editorId?: string;
}

interface ToolButtonProps {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}

function ToolButton({
  active = false,
  children,
  disabled = false,
  label,
  onClick,
}: ToolButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className="blocks-editor__btn"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function promptForUrl(previous?: string): string | undefined {
  const value = window.prompt("Nhập URL (http/https):", previous ?? "https://");
  if (value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function BlocksEditor({
  initialBlocks,
  onChange,
  editorId = "blocks-editor",
}: BlocksEditorProps) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const [jsonPreview, setJsonPreview] = useState<string>(() =>
    JSON.stringify(initialBlocks ?? [], null, 2),
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          // Code block / horizontal rule ngoài scope FU-05 — không emit node lạ.
          codeBlock: false,
          horizontalRule: false,
          link: {
            autolink: true,
            defaultProtocol: "https",
            openOnClick: false,
          },
        }),
        Image.configure({ allowBase64: false }),
      ],
      content: blocksToTiptapDoc(initialBlocks ?? []),
      editorProps: {
        attributes: {
          "aria-label": "Nội dung bài viết",
          class: "blocks-editor__surface",
          spellcheck: "true",
        },
      },
      onUpdate: ({ editor: current }) => {
        const blocks = tiptapDocToBlocks(current.getJSON());
        setJsonPreview(JSON.stringify(blocks, null, 2));
        onChangeRef.current?.(blocks);
      },
    },
    [],
  );

  const toolbar = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      isBold: current?.isActive("bold") ?? false,
      isItalic: current?.isActive("italic") ?? false,
      isStrike: current?.isActive("strike") ?? false,
      isBullet: current?.isActive("bulletList") ?? false,
      isOrdered: current?.isActive("orderedList") ?? false,
      isQuote: current?.isActive("blockquote") ?? false,
      isH2: current?.isActive("heading", { level: 2 }) ?? false,
      isH3: current?.isActive("heading", { level: 3 }) ?? false,
      isLink: current?.isActive("link") ?? false,
      canUndo: current?.can().chain().focus().undo().run() ?? false,
      canRedo: current?.can().chain().focus().redo().run() ?? false,
    }),
  });

  const state = toolbar ?? {
    isBold: false,
    isItalic: false,
    isStrike: false,
    isBullet: false,
    isOrdered: false,
    isQuote: false,
    isH2: false,
    isH3: false,
    isLink: false,
    canUndo: false,
    canRedo: false,
  };

  function run(action: (chain: ReturnType<Editor["chain"]>) => void) {
    if (!editor) return;
    action(editor.chain().focus());
  }

  function toggleLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = promptForUrl(previous);
    if (href === undefined) {
      if (previous) run((chain) => chain.unsetLink().run());
      return;
    }
    run((chain) => chain.extendMarkRange("link").setLink({ href }).run());
  }

  function insertImage() {
    if (!editor) return;
    const src = promptForUrl();
    if (src === undefined) return;
    const alt = window.prompt("Mô tả ảnh (alt, tùy chọn):", "") ?? "";
    const attrs: { src: string; alt?: string } = { src };
    const trimmedAlt = alt.trim();
    if (trimmedAlt.length > 0) attrs.alt = trimmedAlt;
    run((chain) => chain.setImage(attrs).run());
  }

  return (
    <div className="blocks-editor">
      <div
        aria-label="Thanh công cụ soạn thảo"
        className="blocks-editor__toolbar"
        role="toolbar"
      >
        <ToolButton
          active={state.isH2}
          disabled={!editor}
          label="Tiêu đề H2"
          onClick={() => run((chain) => chain.toggleHeading({ level: 2 }).run())}
        >
          H2
        </ToolButton>
        <ToolButton
          active={state.isH3}
          disabled={!editor}
          label="Tiêu đề H3"
          onClick={() => run((chain) => chain.toggleHeading({ level: 3 }).run())}
        >
          H3
        </ToolButton>
        <ToolButton
          active={state.isBullet}
          disabled={!editor}
          label="Danh sách gạch đầu dòng"
          onClick={() => run((chain) => chain.toggleBulletList().run())}
        >
          • Danh sách
        </ToolButton>
        <ToolButton
          active={state.isOrdered}
          disabled={!editor}
          label="Danh sách đánh số"
          onClick={() => run((chain) => chain.toggleOrderedList().run())}
        >
          1. Danh sách
        </ToolButton>
        <ToolButton
          active={state.isQuote}
          disabled={!editor}
          label="Trích dẫn"
          onClick={() => run((chain) => chain.toggleBlockquote().run())}
        >
          Trích dẫn
        </ToolButton>
        <ToolButton
          active={state.isBold}
          disabled={!editor}
          label="Đậm"
          onClick={() => run((chain) => chain.toggleBold().run())}
        >
          Đậm
        </ToolButton>
        <ToolButton
          active={state.isItalic}
          disabled={!editor}
          label="Nghiêng"
          onClick={() => run((chain) => chain.toggleItalic().run())}
        >
          Nghiêng
        </ToolButton>
        <ToolButton
          active={state.isStrike}
          disabled={!editor}
          label="Gạch ngang"
          onClick={() => run((chain) => chain.toggleStrike().run())}
        >
          Gạch ngang
        </ToolButton>
        <ToolButton
          active={state.isLink}
          disabled={!editor}
          label="Liên kết"
          onClick={toggleLink}
        >
          Liên kết
        </ToolButton>
        <ToolButton disabled={!editor} label="Chèn ảnh" onClick={insertImage}>
          Ảnh
        </ToolButton>
        <ToolButton
          disabled={!state.canUndo}
          label="Hoàn tác"
          onClick={() => run((chain) => chain.undo().run())}
        >
          Hoàn tác
        </ToolButton>
        <ToolButton
          disabled={!state.canRedo}
          label="Làm lại"
          onClick={() => run((chain) => chain.redo().run())}
        >
          Làm lại
        </ToolButton>
      </div>

      <EditorContent editor={editor} id={editorId} />

      <details className="blocks-editor__json">
        <summary>Blocks JSON (dạng xuất bản)</summary>
        <pre data-testid="blocks-json">{jsonPreview}</pre>
      </details>
    </div>
  );
}
