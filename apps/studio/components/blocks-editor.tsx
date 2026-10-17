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
 * Blocks editor (MST-110 Hybrid Glassmorphic) — Tiptap headless.
 */
export interface BlocksEditorProps {
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
      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        active
          ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
          : "text-[var(--ink-700)] bg-transparent hover:bg-black/5"
      } ${disabled ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""}`}
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
          class: "blocks-editor-surface prose prose-lg focus:outline-none min-h-[400px] w-full max-w-none p-8",
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
    <div className="blocks-editor bg-white rounded-xl shadow-lg border border-black/5 overflow-hidden flex flex-col relative">
      {/* Floating Glass Ribbon Toolbar */}
      <div
        aria-label="Thanh công cụ soạn thảo"
        className="sticky top-0 z-10 w-full flex flex-wrap items-center gap-2 p-3 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm"
        role="toolbar"
      >
        <div className="flex items-center bg-gray-100/50 p-1 rounded-lg gap-1 border border-black/5">
          <ToolButton active={state.isH2} disabled={!editor} label="Tiêu đề H2" onClick={() => run((chain) => chain.toggleHeading({ level: 2 }).run())}>H2</ToolButton>
          <ToolButton active={state.isH3} disabled={!editor} label="Tiêu đề H3" onClick={() => run((chain) => chain.toggleHeading({ level: 3 }).run())}>H3</ToolButton>
        </div>
        
        <div className="w-px h-6 bg-black/10 mx-1" />
        
        <div className="flex items-center bg-gray-100/50 p-1 rounded-lg gap-1 border border-black/5">
          <ToolButton active={state.isBold} disabled={!editor} label="Đậm" onClick={() => run((chain) => chain.toggleBold().run())}>B</ToolButton>
          <ToolButton active={state.isItalic} disabled={!editor} label="Nghiêng" onClick={() => run((chain) => chain.toggleItalic().run())}>I</ToolButton>
          <ToolButton active={state.isStrike} disabled={!editor} label="Gạch ngang" onClick={() => run((chain) => chain.toggleStrike().run())}>S</ToolButton>
        </div>

        <div className="w-px h-6 bg-black/10 mx-1" />

        <div className="flex items-center bg-gray-100/50 p-1 rounded-lg gap-1 border border-black/5">
          <ToolButton active={state.isBullet} disabled={!editor} label="Danh sách gạch đầu dòng" onClick={() => run((chain) => chain.toggleBulletList().run())}>• List</ToolButton>
          <ToolButton active={state.isOrdered} disabled={!editor} label="Danh sách đánh số" onClick={() => run((chain) => chain.toggleOrderedList().run())}>1. List</ToolButton>
          <ToolButton active={state.isQuote} disabled={!editor} label="Trích dẫn" onClick={() => run((chain) => chain.toggleBlockquote().run())}>" Quote</ToolButton>
        </div>

        <div className="w-px h-6 bg-black/10 mx-1" />

        <div className="flex items-center bg-gray-100/50 p-1 rounded-lg gap-1 border border-black/5">
          <ToolButton active={state.isLink} disabled={!editor} label="Liên kết" onClick={toggleLink}>🔗 Link</ToolButton>
          <ToolButton disabled={!editor} label="Chèn ảnh" onClick={insertImage}>🖼️ Image</ToolButton>
        </div>
        
        <div className="ml-auto flex items-center bg-gray-100/50 p-1 rounded-lg gap-1 border border-black/5">
          <ToolButton disabled={!state.canUndo} label="Hoàn tác" onClick={() => run((chain) => chain.undo().run())}>↩</ToolButton>
          <ToolButton disabled={!state.canRedo} label="Làm lại" onClick={() => run((chain) => chain.redo().run())}>↪</ToolButton>
        </div>
      </div>

      <EditorContent editor={editor} id={editorId} className="flex-1 overflow-y-auto bg-[var(--solar-light)]" />

      <details className="mt-4 p-4 border-t border-black/5 bg-gray-50 text-xs font-mono group">
        <summary className="cursor-pointer font-bold text-gray-500 group-hover:text-blue-500 transition-colors">Blocks JSON (Debug Tiptap)</summary>
        <pre data-testid="blocks-json" className="mt-4 p-4 bg-white rounded-lg border border-black/10 shadow-inner overflow-x-auto max-h-64 text-gray-700">{jsonPreview}</pre>
      </details>
    </div>
  );
}
