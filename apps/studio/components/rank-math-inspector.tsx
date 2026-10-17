"use client";

import { useMemo, useState } from "react";
import type { ArticleBlock } from "../../../packages/contracts/src/blocks.ts";

export interface RankMathInspectorProps {
  title: string;
  slug: string;
  summary: string;
  focusKeyword: string;
  blocks: ArticleBlock[];
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function calculateScore(props: RankMathInspectorProps) {
  let score = 0;
  const items = [];

  // 1. Tiêu đề chứa Focus Keyword (15 điểm)
  const titleHasKeyword =
    props.focusKeyword &&
    props.title.toLowerCase().includes(props.focusKeyword.toLowerCase());
  if (titleHasKeyword) {
    score += 15;
    items.push({
      id: "title_keyword",
      label: "Tiêu đề chứa Focus Keyword",
      status: "pass",
      points: 15,
      maxPoints: 15,
      detail: "Tuyệt vời! Focus Keyword xuất hiện trong tiêu đề SEO.",
    });
  } else {
    items.push({
      id: "title_keyword",
      label: "Tiêu đề chứa Focus Keyword",
      status: "fail",
      points: 0,
      maxPoints: 15,
      detail: "Tiêu đề của bạn chưa chứa Focus Keyword.",
      recommendation: "Hãy thêm từ khóa chính vào phần đầu của tiêu đề.",
    });
  }

  // 2. Độ dài Tiêu đề SEO 50-60 ký tự (10 điểm)
  const titleLen = props.title.length;
  if (titleLen >= 50 && titleLen <= 60) {
    score += 10;
    items.push({
      id: "title_length",
      label: "Độ dài Tiêu đề chuẩn",
      status: "pass",
      points: 10,
      maxPoints: 10,
      detail: `Tiêu đề có độ dài ${titleLen} ký tự (Chuẩn: 50-60).`,
    });
  } else {
    items.push({
      id: "title_length",
      label: "Độ dài Tiêu đề chuẩn",
      status: "warning",
      points: 5,
      maxPoints: 10,
      detail: `Tiêu đề có độ dài ${titleLen} ký tự (Nên từ 50-60).`,
      recommendation: titleLen < 50 ? "Tiêu đề quá ngắn." : "Tiêu đề quá dài.",
    });
  }

  // 3. Độ dài Mô tả (10 điểm)
  const descLen = props.summary.length;
  if (descLen >= 120 && descLen <= 160) {
    score += 10;
    items.push({
      id: "desc_length",
      label: "Độ dài Mô tả chuẩn",
      status: "pass",
      points: 10,
      maxPoints: 10,
      detail: `Mô tả có độ dài ${descLen} ký tự (Chuẩn: 120-160).`,
    });
  } else {
    items.push({
      id: "desc_length",
      label: "Độ dài Mô tả chuẩn",
      status: "warning",
      points: 5,
      maxPoints: 10,
      detail: `Mô tả có độ dài ${descLen} ký tự (Nên từ 120-160).`,
    });
  }

  // 4. Focus Keyword trong Sapo/Mô tả (15 điểm)
  const descHasKeyword =
    props.focusKeyword &&
    props.summary.toLowerCase().includes(props.focusKeyword.toLowerCase());
  if (descHasKeyword) {
    score += 15;
    items.push({
      id: "desc_keyword",
      label: "Mô tả chứa Focus Keyword",
      status: "pass",
      points: 15,
      maxPoints: 15,
      detail: "Focus Keyword đã xuất hiện trong mô tả bài viết.",
    });
  } else {
    items.push({
      id: "desc_keyword",
      label: "Mô tả chứa Focus Keyword",
      status: "fail",
      points: 0,
      maxPoints: 15,
      detail: "Mô tả chưa chứa Focus Keyword.",
    });
  }

  // Khai thác nội dung Blocks
  let fullText = "";
  let hasHeadingWithKeyword = false;
  let hasImageWithAlt = false;

  props.blocks.forEach((b) => {
    if (b.type === "paragraph" || b.type === "heading") {
      const text = b.content.map((c) => c.text).join(" ");
      fullText += text + " ";
      if (
        b.type === "heading" &&
        props.focusKeyword &&
        text.toLowerCase().includes(props.focusKeyword.toLowerCase())
      ) {
        hasHeadingWithKeyword = true;
      }
    }
    if (b.type === "image") {
      if (b.attrs.alt && b.attrs.alt.trim().length > 0) {
        hasImageWithAlt = true;
      }
    }
  });

  // 5. Nội dung đủ dài (> 300 từ) (15 điểm)
  const wordCount = countWords(fullText);
  if (wordCount >= 300) {
    score += 15;
    items.push({
      id: "word_count",
      label: "Độ dài bài viết",
      status: "pass",
      points: 15,
      maxPoints: 15,
      detail: `Bài viết có ${wordCount} từ (Chuẩn: >= 300 từ).`,
    });
  } else {
    items.push({
      id: "word_count",
      label: "Độ dài bài viết",
      status: "fail",
      points: wordCount > 150 ? 5 : 0,
      maxPoints: 15,
      detail: `Bài viết chỉ có ${wordCount} từ (Cần tối thiểu 300 từ).`,
    });
  }

  // 6. Heading chứa Keyword (10 điểm)
  if (hasHeadingWithKeyword) {
    score += 10;
    items.push({
      id: "heading_keyword",
      label: "Heading chứa Keyword",
      status: "pass",
      points: 10,
      maxPoints: 10,
      detail: "Có ít nhất 1 thẻ H2/H3 chứa Focus Keyword.",
    });
  } else {
    items.push({
      id: "heading_keyword",
      label: "Heading chứa Keyword",
      status: "fail",
      points: 0,
      maxPoints: 10,
      detail: "Chưa tìm thấy Focus Keyword trong các thẻ Heading (H2, H3).",
    });
  }

  // 7. Mật độ từ khóa (10 điểm) - lý tưởng: 1-2.5%
  let density = 0;
  if (props.focusKeyword && wordCount > 0) {
    const regex = new RegExp(props.focusKeyword, "gi");
    const matches = fullText.match(regex);
    const kwCount = matches ? matches.length : 0;
    density = (kwCount / wordCount) * 100;
  }
  if (density >= 1 && density <= 2.5) {
    score += 10;
    items.push({
      id: "keyword_density",
      label: "Mật độ từ khóa (1 - 2.5%)",
      status: "pass",
      points: 10,
      maxPoints: 10,
      detail: `Mật độ đạt ${density.toFixed(2)}%. Khá lý tưởng.`,
    });
  } else {
    items.push({
      id: "keyword_density",
      label: "Mật độ từ khóa (1 - 2.5%)",
      status: "warning",
      points: density > 0 ? 5 : 0,
      maxPoints: 10,
      detail: `Mật độ hiện tại: ${density.toFixed(2)}%.`,
      recommendation:
        density === 0
          ? "Từ khóa chưa xuất hiện trong thân bài."
          : density < 1
            ? "Mật độ quá thấp, hãy nhắc lại từ khóa."
            : "Mật độ quá cao, nguy cơ Keyword Stuffing.",
    });
  }

  // 8. Alt Hình ảnh (5 điểm)
  if (hasImageWithAlt || props.heroImageAlt) {
    score += 5;
    items.push({
      id: "image_alt",
      label: "Thẻ ALT cho hình ảnh",
      status: "pass",
      points: 5,
      maxPoints: 5,
      detail: "Tuyệt vời, hình ảnh đã được thiết lập thẻ mô tả ALT.",
    });
  } else {
    items.push({
      id: "image_alt",
      label: "Thẻ ALT cho hình ảnh",
      status: "warning",
      points: 0,
      maxPoints: 5,
      detail: "Chưa tìm thấy thẻ ALT nào cho hình ảnh trong bài.",
    });
  }

  // 9. Slug ngắn gọn chuẩn SEO (10 điểm)
  const slugLen = props.slug.length;
  if (slugLen > 0 && slugLen <= 50) {
    score += 10;
    items.push({
      id: "slug_length",
      label: "URL (Slug) ngắn gọn",
      status: "pass",
      points: 10,
      maxPoints: 10,
      detail: "Đường dẫn (URL) ngắn gọn, chuẩn SEO.",
    });
  } else {
    items.push({
      id: "slug_length",
      label: "URL (Slug) ngắn gọn",
      status: "warning",
      points: 5,
      maxPoints: 10,
      detail: "Đường dẫn (URL) của bạn hơi dài (> 50 ký tự).",
    });
  }

  return { score, items, wordCount };
}

export function RankMathInspector(props: RankMathInspectorProps) {
  const [activeTab, setActiveTab] = useState<"checklist" | "serp">("checklist");
  const [serpMode, setSerpMode] = useState<"desktop" | "mobile">("mobile");

  const { score, items, wordCount } = useMemo(() => calculateScore(props), [props]);

  let scoreColorClass = "text-red-500 hud-border hud-bg";
  if (score >= 80) {
    scoreColorClass = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 glow-meter";
  } else if (score >= 50) {
    scoreColorClass = "text-amber-400 border-amber-500/20 bg-amber-500/5";
  }

  const displaySnippetTitle = props.title || "Tiêu đề bài viết của bạn sẽ hiển thị ở đây";
  const displaySnippetDesc = props.summary || "Đây là phần mô tả ngắn (Meta Description) sẽ xuất hiện trên kết quả tìm kiếm Google.";
  const displaySnippetSlug = props.slug || "duong-dan-bai-viet-chuan-seo";
  const heroImageUrl = props.heroImageUrl;

  return (
    <div className="glass-panel rounded-[var(--bento-radius-outer)] flex flex-col h-[calc(100vh-8rem)]">
      {/* Header HUD */}
      <div className="p-5 border-b border-white/10 shrink-0 bg-white/5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold text-white tracking-wide">SEO SCORER</h2>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${scoreColorClass}`}>
            <span className="text-xl font-bold">{score}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">/ 100</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-white/50">
          <span>Words: <span className="text-white/80">{wordCount}</span></span>
          <span>Focus Keyword: <span className="text-white/80">{props.focusKeyword || "Chưa đặt"}</span></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 shrink-0">
        <button
          onClick={() => setActiveTab("checklist")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === "checklist" ? "text-blue-400 border-b-2 border-blue-400 bg-blue-400/5" : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
        >
          Checklist
        </button>
        <button
          onClick={() => setActiveTab("serp")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === "serp" ? "text-blue-400 border-b-2 border-blue-400 bg-blue-400/5" : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
        >
          SERP Preview
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
        {activeTab === "checklist" && (
          <ul className="flex flex-col gap-3">
            {items.map((item) => {
              let icon = "⚠️";
              let iconBg = "text-amber-400 bg-amber-400/10 border-amber-400/20";
              
              if (item.status === "pass") {
                icon = "✓";
                iconBg = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
              } else if (item.status === "fail") {
                icon = "✕";
                iconBg = "text-red-400 bg-red-400/10 border-red-400/20";
              }

              return (
                <li key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-start gap-3">
                  <span className={`w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-xs font-bold border ${iconBg}`}>
                    {icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-white/90">{item.label}</span>
                      <span className="text-[10px] font-bold text-white/50 px-1.5 py-0.5 bg-white/10 rounded">{item.points}/{item.maxPoints} đ</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed m-0">{item.detail}</p>
                    {item.status !== "pass" && item.recommendation && (
                      <p className="text-[11px] text-amber-400/80 italic mt-1.5">💡 {item.recommendation}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {activeTab === "serp" && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-white/60">Preview Google Search:</span>
              <div className="flex bg-white/5 rounded-lg border border-white/10 p-0.5">
                <button
                  onClick={() => setSerpMode("desktop")}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${
                    serpMode === "desktop" ? "bg-blue-500 text-white" : "text-white/50 hover:text-white"
                  }`}
                >
                  Desktop
                </button>
                <button
                  onClick={() => setSerpMode("mobile")}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${
                    serpMode === "mobile" ? "bg-blue-500 text-white" : "text-white/50 hover:text-white"
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* SERP Mock Container */}
            <div className={`bg-white rounded-xl border border-gray-200 p-4 font-sans text-left shadow-lg ${serpMode === "mobile" ? "max-w-[375px] mx-auto" : "w-full"}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">M</div>
                <div className="leading-tight">
                  <div className="text-[14px] text-[#202124] font-medium">MStudio Channel</div>
                  <div className="text-[12px] text-[#4d5156]">
                    {serpMode === "desktop" ? `https://mstudio.minds.io.vn › bai-viet › ${displaySnippetSlug}` : "mstudio.minds.io.vn"}
                  </div>
                </div>
              </div>

              <div className={`flex gap-4 ${serpMode === "mobile" ? "items-start" : "items-start"}`}>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[20px] text-[#1a0dab] font-normal leading-snug mb-1 cursor-pointer hover:underline truncate md:whitespace-normal">
                    {displaySnippetTitle}
                  </h3>
                  <p className="text-[14px] text-[#4d5156] leading-snug line-clamp-2 md:line-clamp-none m-0">
                    {displaySnippetDesc}
                  </p>
                </div>
                {serpMode === "mobile" && heroImageUrl && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-gray-100 mt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-[11px] text-white/60 space-y-2 mt-4">
              <div className="flex justify-between">
                <span>Độ dài Tiêu đề:</span>
                <span className={`font-bold ${displaySnippetTitle.length > 60 ? "text-red-400" : "text-emerald-400"}`}>
                  {displaySnippetTitle.length}/60 {displaySnippetTitle.length > 60 && "(Dài)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Độ dài Mô tả:</span>
                <span className={`font-bold ${displaySnippetDesc.length > 160 ? "text-red-400" : "text-emerald-400"}`}>
                  {displaySnippetDesc.length}/160 {displaySnippetDesc.length > 160 && "(Dài)"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
