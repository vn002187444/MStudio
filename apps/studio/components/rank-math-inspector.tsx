"use client";

import React, { useState, useMemo } from "react";

export interface RankMathInspectorProps {
  headline: string;
  dek: string;
  summary: string;
  bodyText: string;
  headings: Array<{ level: number; text: string }>;
  images: Array<{ src: string; alt?: string }>;
  links: string[];
  slug: string;
  focusKeyword: string;
  onFocusKeywordChange: (keyword: string) => void;
  metaTitle: string;
  metaDescription: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  onHeroImageAltChange?: (alt: string) => void;
}

interface CheckResult {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  points: number;
  maxPoints: number;
  detail: string;
  recommendation?: string;
}

export function RankMathInspector({
  headline,
  dek,
  summary,
  bodyText,
  headings,
  images,
  links,
  slug,
  focusKeyword,
  onFocusKeywordChange,
  metaTitle,
  metaDescription,
  heroImageUrl,
  heroImageAlt,
  onHeroImageAltChange,
}: RankMathInspectorProps) {
  const [serpMode, setSerpMode] = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"checklist" | "serp">("checklist");

  // Combined full article text
  const fullText = useMemo(() => {
    return [headline, dek, summary, bodyText].filter(Boolean).join(" ");
  }, [headline, dek, summary, bodyText]);

  // Clean words array
  const words = useMemo(() => {
    const raw = fullText.trim();
    if (!raw) return [];
    return raw.split(/\s+/).filter(Boolean);
  }, [fullText]);

  const wordCount = words.length;

  // Compute SEO scoring tests
  const { score, checks, passedCount, warnCount, failCount, keywordDensity, internalLinkCount } =
    useMemo(() => {
      const kw = focusKeyword.trim().toLowerCase();
      const checksList: CheckResult[] = [];

      // 1. Tiêu đề chứa Focus Keyword (50-60 chars) (15 pts)
      const effectiveTitle = (metaTitle || headline).trim();
      const titleLower = effectiveTitle.toLowerCase();
      let titlePoints = 0;
      let titleStatus: "pass" | "warn" | "fail" = "fail";
      let titleDetail = "";

      if (!kw) {
        titleStatus = "fail";
        titleDetail = "Chưa nhập từ khóa chính (Focus Keyword).";
      } else if (!titleLower.includes(kw)) {
        titleStatus = "fail";
        titleDetail = `Tiêu đề chưa chứa từ khóa "${focusKeyword}".`;
      } else {
        titlePoints += 10;
        const charLen = effectiveTitle.length;
        if (charLen >= 50 && charLen <= 60) {
          titlePoints += 5;
          titleStatus = "pass";
          titleDetail = `Từ khóa xuất hiện trong tiêu đề. Độ dài lý tưởng (${charLen}/60 ký tự).`;
        } else if (charLen >= 40 && charLen <= 65) {
          titlePoints += 3;
          titleStatus = "pass";
          titleDetail = `Từ khóa có trong tiêu đề. Độ dài chấp nhận (${charLen} ký tự, khuyến nghị 50-60).`;
        } else {
          titleStatus = "warn";
          titleDetail = `Từ khóa có trong tiêu đề nhưng độ dài chưa tối ưu (${charLen} ký tự, khuyến nghị 50-60).`;
        }
      }

      checksList.push({
        id: "title-kw",
        label: "Tiêu đề chứa từ khóa & độ dài chuẩn",
        status: titleStatus,
        points: titlePoints,
        maxPoints: 15,
        detail: titleDetail,
        recommendation: "Đảm bảo tiêu đề chứa chính xác từ khóa và nằm trong khoảng 50–60 ký tự.",
      });

      // 2. Sapo/mở đầu chứa Focus Keyword (15 pts)
      const introText = [dek, summary, bodyText.slice(0, 300)].filter(Boolean).join(" ").toLowerCase();
      let introPoints = 0;
      let introStatus: "pass" | "warn" | "fail" = "fail";
      let introDetail = "";

      if (!kw) {
        introStatus = "fail";
        introDetail = "Chưa nhập từ khóa chính.";
      } else if (introText.includes(kw)) {
        introPoints = 15;
        introStatus = "pass";
        introDetail = `Từ khóa chính "${focusKeyword}" xuất hiện ngay đoạn mở đầu/Sapo.`;
      } else {
        introStatus = "fail";
        introDetail = `Đoạn Sapo mở đầu chưa chứa từ khóa chính "${focusKeyword}".`;
      }

      checksList.push({
        id: "intro-kw",
        label: "Sapo / Đoạn mở đầu chứa từ khóa",
        status: introStatus,
        points: introPoints,
        maxPoints: 15,
        detail: introDetail,
        recommendation: "Đặt từ khóa chính trong 1-2 câu đầu tiên của đoạn Sapo để Google & độc giả hiểu ngay chủ đề.",
      });

      // 3. Mật độ từ khóa Keyword Density (1.0 - 2.5%) (15 pts)
      let density = 0;
      let kwOccurrences = 0;
      let densityPoints = 0;
      let densityStatus: "pass" | "warn" | "fail" = "fail";
      let densityDetail = "";

      if (kw && wordCount > 0) {
        const kwWords = kw.split(/\s+/).filter(Boolean).length;
        // Count non-overlapping occurrences
        const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        const matches = fullText.match(regex);
        kwOccurrences = matches ? matches.length : 0;
        density = (kwOccurrences * kwWords) / wordCount * 100;

        if (density >= 1.0 && density <= 2.5) {
          densityPoints = 15;
          densityStatus = "pass";
          densityDetail = `Mật độ đạt ${density.toFixed(2)}% (${kwOccurrences} lần / ${wordCount} từ) - Chuẩn Rank Math vàng!`;
        } else if (density >= 0.5 && density < 1.0) {
          densityPoints = 8;
          densityStatus = "warn";
          densityDetail = `Mật độ ${density.toFixed(2)}% (${kwOccurrences} lần) hơi thấp. Khuyến nghị đạt từ 1.0% - 2.5%.`;
        } else if (density > 2.5 && density <= 3.5) {
          densityPoints = 8;
          densityStatus = "warn";
          densityDetail = `Mật độ ${density.toFixed(2)}% (${kwOccurrences} lần) hơi dày. Cẩn thận nhồi nhét từ khóa.`;
        } else if (density > 3.5) {
          densityPoints = 0;
          densityStatus = "fail";
          densityDetail = `Mật độ quá cao ${density.toFixed(2)}% (${kwOccurrences} lần)! Nguy cơ bị Google phạt nhồi từ khóa.`;
        } else {
          densityPoints = 0;
          densityStatus = "fail";
          densityDetail = `Mật độ 0% (từ khóa chưa xuất hiện trong thân bài viết).`;
        }
      } else {
        densityDetail = "Cần nhập từ khóa và nội dung bài viết để tính mật độ.";
      }

      checksList.push({
        id: "kw-density",
        label: "Mật độ từ khóa (Keyword Density 1.0% - 2.5%)",
        status: densityStatus,
        points: densityPoints,
        maxPoints: 15,
        detail: densityDetail,
        recommendation: "Phân bổ từ khóa tự nhiên trong các đoạn văn với mật độ chuẩn 1.0% – 2.5%.",
      });

      // 4. Cấu trúc H2/H3 (15 pts)
      let headingPoints = 0;
      let headingStatus: "pass" | "warn" | "fail" = "fail";
      let headingDetail = "";
      const hCount = headings.length;
      const hWithKw = kw ? headings.filter((h) => h.text.toLowerCase().includes(kw)).length : 0;

      if (hCount === 0) {
        headingStatus = "fail";
        headingDetail = "Bài viết chưa có thẻ tiêu đề phụ (H2 hoặc H3).";
      } else if (hWithKw > 0) {
        headingPoints = 15;
        headingStatus = "pass";
        headingDetail = `Có ${hCount} thẻ Heading (${headings.map(h => `H${h.level}`).join(", ")}) và có chứa từ khóa chính.`;
      } else {
        headingPoints = 10;
        headingStatus = "warn";
        headingDetail = `Có ${hCount} thẻ Heading, nhưng chưa thẻ nào chứa từ khóa chính "${focusKeyword}".`;
      }

      checksList.push({
        id: "heading-structure",
        label: "Cấu trúc Heading H2/H3 phân đoạn",
        status: headingStatus,
        points: headingPoints,
        maxPoints: 15,
        detail: headingDetail,
        recommendation: "Sử dụng các thẻ H2/H3 để chia mạch bài viết và chèn từ khóa chính vào ít nhất một tiêu đề mục.",
      });

      // 5. Độ dài bài viết (> 300 từ) (15 pts)
      let lengthPoints = 0;
      let lengthStatus: "pass" | "warn" | "fail" = "fail";
      let lengthDetail = "";

      if (wordCount >= 600) {
        lengthPoints = 15;
        lengthStatus = "pass";
        lengthDetail = `Bài viết sâu sắc, đạt ${wordCount} từ (vượt chuẩn 600 từ cho tin phân tích).`;
      } else if (wordCount >= 300) {
        lengthPoints = 15;
        lengthStatus = "pass";
        lengthDetail = `Độ dài bài viết đạt ${wordCount} từ (đạt chuẩn tối thiểu > 300 từ).`;
      } else if (wordCount >= 150) {
        lengthPoints = 8;
        lengthStatus = "warn";
        lengthDetail = `Bài viết hiện có ${wordCount} từ. Còn thiếu ${300 - wordCount} từ để đạt chuẩn SEO tối thiểu.`;
      } else {
        lengthPoints = 0;
        lengthStatus = "fail";
        lengthDetail = `Bài viết quá ngắn (${wordCount} từ). Chuẩn SEO báo chí khuyến nghị > 300 từ.`;
      }

      checksList.push({
        id: "content-length",
        label: "Độ dài nội dung bài viết (> 300 từ)",
        status: lengthStatus,
        points: lengthPoints,
        maxPoints: 15,
        detail: lengthDetail,
        recommendation: "Mở rộng góc nhìn hoặc thêm dẫn chứng để bài viết đạt trên 300 - 600 từ chất lượng.",
      });

      // 6. Ảnh đại diện có thẻ ALT (10 pts)
      let altPoints = 0;
      let altStatus: "pass" | "warn" | "fail" = "fail";
      let altDetail = "";

      const allImages = [...images];
      if (heroImageUrl) {
        allImages.unshift({ src: heroImageUrl, alt: heroImageAlt });
      }

      if (allImages.length === 0) {
        altStatus = "fail";
        altDetail = "Bài viết chưa có ảnh đại diện (Hero image) hoặc ảnh minh họa.";
      } else {
        const imagesWithAlt = allImages.filter((img) => img.alt && img.alt.trim().length > 0);
        const hasKwInAlt = kw ? imagesWithAlt.some((img) => img.alt?.toLowerCase().includes(kw)) : false;

        if (imagesWithAlt.length === allImages.length && hasKwInAlt) {
          altPoints = 10;
          altStatus = "pass";
          altDetail = `Tất cả ảnh (${allImages.length} ảnh) đều có thẻ ALT và chứa từ khóa chính.`;
        } else if (imagesWithAlt.length === allImages.length) {
          altPoints = 7;
          altStatus = "pass";
          altDetail = `Tất cả ${allImages.length} ảnh có thẻ ALT, nhưng chưa ảnh nào chứa từ khóa "${focusKeyword}".`;
        } else if (imagesWithAlt.length > 0) {
          altPoints = 4;
          altStatus = "warn";
          altDetail = `${imagesWithAlt.length}/${allImages.length} ảnh có thẻ ALT. Còn ảnh thiếu mô tả.`;
        } else {
          altPoints = 0;
          altStatus = "fail";
          altDetail = `Ảnh đại diện hoặc ảnh minh họa chưa có thuộc tính ALT (Alternative Text).`;
        }
      }

      checksList.push({
        id: "image-alt",
        label: "Ảnh đại diện & hình ảnh có thẻ ALT",
        status: altStatus,
        points: altPoints,
        maxPoints: 10,
        detail: altDetail,
        recommendation: "Điền văn bản thay thế (ALT text) mô tả rõ nội dung bức ảnh và nên chứa từ khóa chính.",
      });

      // 7. Liên kết nội bộ (Internal link) (10 pts)
      let linkPoints = 0;
      let linkStatus: "pass" | "warn" | "fail" = "fail";
      let linkDetail = "";

      const internalLinks = links.filter((l) => {
        if (!l) return false;
        return (
          l.startsWith("/") ||
          l.includes("minds.io.vn") ||
          l.includes("mstudio.vn") ||
          l.includes("localhost")
        );
      });

      if (internalLinks.length >= 1) {
        linkPoints = 10;
        linkStatus = "pass";
        linkDetail = `Có ${internalLinks.length} liên kết nội bộ trong bài (Internal Links).`;
      } else if (links.length > 0) {
        linkPoints = 4;
        linkStatus = "warn";
        linkDetail = `Có ${links.length} liên kết ngoài nhưng chưa có liên kết nội bộ (Internal Link).`;
      } else {
        linkPoints = 0;
        linkStatus = "fail";
        linkDetail = "Chưa có liên kết nội bộ nào dẫn đến các bài viết hoặc chủ đề liên quan.";
      }

      checksList.push({
        id: "internal-links",
        label: "Liên kết nội bộ (Internal Links)",
        status: linkStatus,
        points: linkPoints,
        maxPoints: 10,
        detail: linkDetail,
        recommendation: "Chèn ít nhất 1–2 link dẫn sang bài viết cùng chùm chủ đề trên MStudio Channel.",
      });

      // 8. Readability score (Điểm dễ đọc) (5 pts)
      let readPoints = 0;
      let readStatus: "pass" | "warn" | "fail" = "fail";
      let readDetail = "";

      // Split sentences
      const sentences = fullText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const sentenceCount = sentences.length;
      const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;

      if (sentenceCount === 0 || wordCount < 50) {
        readStatus = "warn";
        readDetail = "Cần thêm văn bản để tính toán độ mạch lạc của câu.";
      } else if (avgWordsPerSentence <= 22) {
        readPoints = 5;
        readStatus = "pass";
        readDetail = `Câu ngắn gọn, mạch lạc (trung bình ${avgWordsPerSentence.toFixed(1)} từ/câu, lý tưởng < 22).`;
      } else if (avgWordsPerSentence <= 28) {
        readPoints = 3;
        readStatus = "warn";
        readDetail = `Độ dài câu vừa phải (${avgWordsPerSentence.toFixed(1)} từ/câu). Cân nhắc ngắt bớt câu dài.`;
      } else {
        readPoints = 1;
        readStatus = "fail";
        readDetail = `Câu văn quá dài (${avgWordsPerSentence.toFixed(1)} từ/câu). Độc giả di động sẽ khó theo dõi.`;
      }

      checksList.push({
        id: "readability",
        label: "Điểm dễ đọc & cấu trúc câu (Readability)",
        status: readStatus,
        points: readPoints,
        maxPoints: 5,
        detail: readDetail,
        recommendation: "Giữ câu dưới 20–25 từ và dùng từ ngữ sáng rõ, phân tách đoạn mạch lạc.",
      });

      // Total points
      const totalScore = checksList.reduce((acc, c) => acc + c.points, 0);
      const passed = checksList.filter((c) => c.status === "pass").length;
      const warned = checksList.filter((c) => c.status === "warn").length;
      const failed = checksList.filter((c) => c.status === "fail").length;

      return {
        score: Math.min(100, Math.max(0, totalScore)),
        checks: checksList,
        passedCount: passed,
        warnCount: warned,
        failCount: failed,
        keywordDensity: density,
        internalLinkCount: internalLinks.length,
      };
    }, [
      focusKeyword,
      headline,
      metaTitle,
      dek,
      summary,
      bodyText,
      fullText,
      wordCount,
      headings,
      images,
      heroImageUrl,
      heroImageAlt,
      links,
    ]);

  // Score Badge Color & Status
  const scoreTheme = useMemo(() => {
    if (score >= 80) {
      return {
        bg: "rgba(22, 163, 106, 0.12)",
        border: "rgba(22, 163, 106, 0.4)",
        text: "#15803d",
        label: "Xuất sắc",
        description: "Bài viết chuẩn Rank Math SEO Pro, sẵn sàng xếp hạng cao!",
      };
    }
    if (score >= 50) {
      return {
        bg: "rgba(234, 179, 8, 0.12)",
        border: "rgba(234, 179, 8, 0.4)",
        text: "#b45309",
        label: "Khá / Cần cải thiện",
        description: "Có thể tối ưu thêm một vài tiêu chí để đạt điểm tối đa.",
      };
    }
    return {
      bg: "rgba(220, 38, 38, 0.12)",
      border: "rgba(220, 38, 38, 0.4)",
      text: "#b91c1c",
      label: "Cần khắc phục",
      description: "Nhiều tiêu chí SEO On-page chưa đạt yêu cầu.",
    };
  }, [score]);

  const displaySnippetTitle = metaTitle || headline || "Tiêu đề bài viết hiển thị trên Google";
  const displaySnippetDesc =
    metaDescription ||
    dek ||
    summary ||
    bodyText.slice(0, 150) ||
    "Mô tả bài viết súc tích, tóm tắt các điểm nổi bật để tăng tỷ lệ click (CTR) trên công cụ tìm kiếm Google...";
  const displaySnippetSlug = slug || "tieu-de-bai-viet-chuan-seo";

  return (
    <div
      className="rank-math-inspector"
      style={{
        background: "var(--white, #ffffff)",
        border: "1px solid var(--border, #e5e7eb)",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Inspector Header with Realtime Rank Math Score */}
      <div
        style={{
          padding: "16px",
          background: scoreTheme.bg,
          borderBottom: `1px solid ${scoreTheme.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Animated Score Ring / Pill */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--white, #fff)",
              border: `3px solid ${scoreTheme.text}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: scoreTheme.text,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 9, opacity: 0.7, textTransform: "uppercase" }}>/100</span>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.02em" }}>
                RANK MATH SEO
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 999,
                  background: scoreTheme.text,
                  color: "#fff",
                  textTransform: "uppercase",
                }}
              >
                {scoreTheme.label}
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--gray, #6b7280)", lineHeight: 1.3 }}>
              {scoreTheme.description}
            </p>
          </div>
        </div>

        {/* Quick Check Stats Pills */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <span
            title="Đạt chuẩn"
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: 6,
              background: "#dcfce7",
              color: "#166534",
            }}
          >
            ✓ {passedCount}
          </span>
          <span
            title="Cần lưu ý"
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: 6,
              background: "#fef9c3",
              color: "#854d0e",
            }}
          >
            ! {warnCount}
          </span>
          <span
            title="Lỗi"
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: 6,
              background: "#fee2e2",
              color: "#991b1b",
            }}
          >
            ✕ {failCount}
          </span>
        </div>
      </div>

      {/* Focus Keyword Input Field (Linear / Apple styled) */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border, #e5e7eb)", background: "#fafafa" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label
            htmlFor="rank-math-focus-kw"
            style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#374151" }}
          >
            🎯 Focus Keyword (Từ khóa chính)
          </label>
          {keywordDensity > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: keywordDensity >= 1 && keywordDensity <= 2.5 ? "#15803d" : "#b45309" }}>
              Mật độ: {keywordDensity.toFixed(2)}%
            </span>
          )}
        </div>
        <div style={{ position: "relative" }}>
          <input
            id="rank-math-focus-kw"
            type="text"
            value={focusKeyword}
            onChange={(e) => onFocusKeywordChange(e.target.value)}
            placeholder="Ví dụ: AI Agent, thị trường bán lẻ, VinFast..."
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 14,
              borderRadius: 8,
              border: "1px solid var(--border, #d1d5db)",
              background: "#fff",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s ease",
            }}
          />
        </div>

        {/* Hero Image ALT field directly inside inspector if hero image is present */}
        {heroImageUrl ? (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border, #e5e7eb)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <label htmlFor="rank-math-hero-alt" style={{ fontSize: 11, fontWeight: 600, color: "#4b5563" }}>
                🖼️ Thẻ ALT ảnh đại diện (Hero Image ALT)
              </label>
              <span style={{ fontSize: 10, color: heroImageAlt ? "#15803d" : "#dc2626" }}>
                {heroImageAlt ? "✓ Đã có ALT" : "⚠ Chưa có ALT"}
              </span>
            </div>
            <input
              id="rank-math-hero-alt"
              type="text"
              value={heroImageAlt || ""}
              onChange={(e) => onHeroImageAltChange?.(e.target.value)}
              placeholder="Mô tả bức ảnh có chứa từ khóa chính..."
              style={{
                width: "100%",
                padding: "6px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid var(--border, #d1d5db)",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>
        ) : null}
      </div>

      {/* Navigation Tabs: Checklist vs SERP Preview */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border, #e5e7eb)",
          background: "#f9fafb",
          padding: "4px 8px 0",
          gap: 4,
        }}
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "checklist"}
          onClick={() => setActiveTab("checklist")}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            background: activeTab === "checklist" ? "#fff" : "transparent",
            color: activeTab === "checklist" ? "#111827" : "#6b7280",
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            borderBottom: activeTab === "checklist" ? "2px solid #2563eb" : "2px solid transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span>📋 Kiểm tra On-Page ({checks.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "serp"}
          onClick={() => setActiveTab("serp")}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            background: activeTab === "serp" ? "#fff" : "transparent",
            color: activeTab === "serp" ? "#111827" : "#6b7280",
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            borderBottom: activeTab === "serp" ? "2px solid #2563eb" : "2px solid transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span>🔍 Google SERP Preview</span>
        </button>
      </div>

      {/* Tab 1: Rank Math On-Page Checklist */}
      {activeTab === "checklist" && (
        <div style={{ padding: "12px 16px" }}>
          {/* Quick Metrics Strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginBottom: 14,
              textAlign: "center",
            }}
          >
            <div style={{ background: "#f3f4f6", padding: "8px 4px", borderRadius: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{wordCount}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Số từ ({wordCount >= 300 ? "Đạt" : "Thiếu"})</div>
            </div>
            <div style={{ background: "#f3f4f6", padding: "8px 4px", borderRadius: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{headings.length}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Thẻ H2/H3</div>
            </div>
            <div style={{ background: "#f3f4f6", padding: "8px 4px", borderRadius: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{internalLinkCount}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Link nội bộ</div>
            </div>
          </div>

          {/* Checklist Items */}
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {checks.map((item) => {
              const icon = item.status === "pass" ? "✓" : item.status === "warn" ? "!" : "✕";
              const iconBg = item.status === "pass" ? "#16a34a" : item.status === "warn" ? "#d97706" : "#dc2626";

              return (
                <li
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: item.status === "pass" ? "#f0fdf4" : item.status === "warn" ? "#fffbeb" : "#fef2f2",
                    border: `1px solid ${
                      item.status === "pass" ? "#bbf7d0" : item.status === "warn" ? "#fde68a" : "#fecaca"
                    }`,
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: iconBg,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {icon}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1f2937" }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: iconBg, marginLeft: 6 }}>
                        {item.points}/{item.maxPoints} đ
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#4b5563", lineHeight: 1.35 }}>
                      {item.detail}
                    </p>
                    {item.status !== "pass" && item.recommendation && (
                      <p style={{ margin: "4px 0 0", fontSize: 10, color: "#6b7280", fontStyle: "italic" }}>
                        💡 {item.recommendation}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Tab 2: Google SERP Preview (Desktop & Mobile) */}
      {activeTab === "serp" && (
        <div style={{ padding: "16px" }}>
          {/* Mode Switcher */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>
              Xem trước kết quả tìm kiếm Google:
            </span>
            <div
              style={{
                display: "inline-flex",
                background: "#f3f4f6",
                padding: 2,
                borderRadius: 8,
                border: "1px solid var(--border, #e5e7eb)",
              }}
            >
              <button
                type="button"
                onClick={() => setSerpMode("desktop")}
                style={{
                  border: "none",
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 6,
                  cursor: "pointer",
                  background: serpMode === "desktop" ? "#fff" : "transparent",
                  color: serpMode === "desktop" ? "#111827" : "#6b7280",
                  boxShadow: serpMode === "desktop" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                🖥️ Desktop
              </button>
              <button
                type="button"
                onClick={() => setSerpMode("mobile")}
                style={{
                  border: "none",
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 6,
                  cursor: "pointer",
                  background: serpMode === "mobile" ? "#fff" : "transparent",
                  color: serpMode === "mobile" ? "#111827" : "#6b7280",
                  boxShadow: serpMode === "mobile" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                📱 Mobile
              </button>
            </div>
          </div>

          {/* Desktop SERP Container */}
          {serpMode === "desktop" && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #dfe1e5",
                borderRadius: 12,
                padding: 16,
                fontFamily: "Arial, sans-serif",
                boxShadow: "0 1px 6px rgba(32,33,36,0.12)",
              }}
            >
              {/* Site Identifier */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#090909",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  M
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 600, color: "#202124" }}>MStudio Channel</div>
                  <div style={{ fontSize: 12, color: "#4d5156" }}>
                    https://mstudio.vn › bai-viet › {displaySnippetSlug}
                  </div>
                </div>
              </div>

              {/* Title Link */}
              <h3
                style={{
                  fontSize: 20,
                  lineHeight: 1.3,
                  fontWeight: 400,
                  color: "#1a0dab",
                  margin: "6px 0 4px",
                  cursor: "pointer",
                  wordBreak: "break-word",
                }}
              >
                {displaySnippetTitle}
              </h3>

              {/* Snippet Description */}
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.58,
                  color: "#4d5156",
                  margin: 0,
                  wordBreak: "break-word",
                }}
              >
                {displaySnippetDesc}
              </p>
            </div>
          )}

          {/* Mobile SERP Container */}
          {serpMode === "mobile" && (
            <div
              style={{
                maxWidth: 360,
                margin: "0 auto",
                background: "#ffffff",
                border: "1px solid #dfe1e5",
                borderRadius: 16,
                padding: 14,
                fontFamily: "Roboto, -apple-system, sans-serif",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              }}
            >
              {/* Header Bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "#090909",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  M
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#202124" }}>MStudio Channel</div>
                  <div style={{ fontSize: 11, color: "#5f6368" }}>mstudio.vn</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4
                    style={{
                      fontSize: 16,
                      lineHeight: 1.35,
                      fontWeight: 500,
                      color: "#1558d6",
                      margin: "0 0 4px",
                    }}
                  >
                    {displaySnippetTitle}
                  </h4>
                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.45,
                      color: "#4d5156",
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {displaySnippetDesc}
                  </p>
                </div>

                {heroImageUrl ? (
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 10,
                      overflow: "hidden",
                      border: "1px solid #eee",
                      flexShrink: 0,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroImageUrl}
                      alt={heroImageAlt || "Snippet thumbnail"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Snippet Length Counter Warnings */}
          <div
            style={{
              marginTop: 14,
              padding: 10,
              background: "#f9fafb",
              borderRadius: 8,
              border: "1px solid var(--border, #e5e7eb)",
              fontSize: 11,
              color: "#4b5563",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>Độ dài Tiêu đề SEO (Meta Title):</span>
              <span style={{ fontWeight: 700, color: displaySnippetTitle.length > 60 ? "#dc2626" : "#15803d" }}>
                {displaySnippetTitle.length}/60 ký tự {displaySnippetTitle.length > 60 ? "(Quá dài)" : ""}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Độ dài Mô tả SEO (Meta Description):</span>
              <span style={{ fontWeight: 700, color: displaySnippetDesc.length > 160 ? "#dc2626" : "#15803d" }}>
                {displaySnippetDesc.length}/160 ký tự {displaySnippetDesc.length > 160 ? "(Quá dài)" : ""}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
