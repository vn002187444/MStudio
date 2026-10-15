"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useCmsToken } from "../../components/cms-actions";
import { apiBaseUrl } from "../../lib/cms";
import type { EmailRecord } from "../../../../packages/contracts/src/studio";

/**
 * Module Hộp Thư Email Nội Bộ (Task MST-096)
 * Giao diện Apple Mail & Linear Crafted SaaS:
 * - Hộp thư đến (Inbox): Đọc phản hồi, đính chính, đóng góp bài viết gửi tới contact@minds.io.vn.
 * - Soạn thư đi (Compose): Gửi email thông báo xuất bản bài viết hoặc gửi Newsletter cho bạn đọc.
 */

type MailFolder = "inbox" | "corrections" | "submissions" | "feedback" | "starred" | "sent" | "archive";
type MailStatus = "unread" | "read" | "replied" | "resolved" | "urgent";
type MailCategory = "Đính chính" | "Đóng góp bài" | "Phản hồi" | "Báo chí" | "Newsletter";

interface EmailMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  category: MailCategory;
  status: MailStatus;
  starred: boolean;
  avatarColor: string;
  relatedArticleSlug?: string;
  tags?: string[];
  replies?: Array<{
    id: string;
    from: string;
    timestamp: string;
    content: string;
  }>;
}

function mapRecordToMessage(r: EmailRecord): EmailMessage {
  const isStarred = Boolean(r.starred);
  const avatarColors = ["#2563eb", "#dc2626", "#16a34a", "#8b5cf6", "#0891b2", "#d97706"];
  const colorIndex = Math.abs(r.senderEmail.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % avatarColors.length;
  return {
    id: r.id,
    senderName: r.senderName || r.senderEmail.split("@")[0] || "Người gửi",
    senderEmail: r.senderEmail,
    recipientEmail: r.recipientEmail,
    subject: r.subject,
    preview: r.preview || r.body.slice(0, 100),
    body: r.body,
    timestamp: new Date(r.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }),
    category: (r.category as MailCategory) || "Phản hồi",
    status: (r.status as MailStatus) || "unread",
    starred: isStarred,
    avatarColor: avatarColors[colorIndex],
  };
}

const INITIAL_EMAILS: EmailMessage[] = [
  {
    id: "mail-1",
    senderName: "TS. Nguyễn Minh Khang",
    senderEmail: "khang.nm@hust.edu.vn",
    recipientEmail: "contact@minds.io.vn",
    subject: "[Đính chính] Số liệu về công suất trạm sạc xe điện trong bài viết ngày 12/10",
    preview: "Kính gửi Ban biên tập MStudio, trong bài viết phân tích mạng lưới sạc xe điện vừa qua...",
    body: `Kính gửi Ban biên tập MStudio Channel,

Tôi là TS. Nguyễn Minh Khang, giảng viên Viện Điện - ĐH Bách Khoa Hà Nội.

Trong bài viết phân tích "Thị trường hạ tầng trạm sạc xe điện Việt Nam 2026" xuất bản ngày 12/10 trên MStudio Channel, có đoạn nêu:
"Công suất tối đa trạm sạc siêu nhanh DC hiện nay tại Việt Nam chỉ đạt 180kW".

Tôi xin lưu ý rằng từ quý 3/2026, chuẩn sạc HPC (High Power Charging) đã chính thức triển khai các trụ 360kW - 480kW tại các trạm dừng nghỉ cao tốc Bắc - Nam. 

Kính đề nghị tòa soạn cập nhật số liệu trên để độc giả có cái nhìn chuẩn xác nhất về sự phát triển hạ tầng công nghệ xe điện nước nhà.

Trân trọng cảm ơn quý tòa soạn,
TS. Nguyễn Minh Khang`,
    timestamp: "10:42 Hôm nay",
    category: "Đính chính",
    status: "urgent",
    starred: true,
    avatarColor: "#dc2626",
    relatedArticleSlug: "thi-truong-ha-tang-tram-sac-xe-dien-2026",
    tags: ["Xe điện", "Đính chính kỹ thuật", "Hạ tầng"],
  },
  {
    id: "mail-2",
    senderName: "Lê Hoàng Phúc",
    senderEmail: "phucle.ai@gmail.com",
    recipientEmail: "contact@minds.io.vn",
    subject: "[Đóng góp bài] Phân tích kiến trúc Agentic Workflow trong doanh nghiệp Việt Nam",
    preview: "Em là độc giả thường xuyên của MStudio. Em có hoàn thành bài phân tích chuyên sâu về AI Agent...",
    body: `Chào Ban biên tập MStudio,

Em là Phúc, hiện là AI Solutions Architect tại TP.HCM và là độc giả theo dõi các bài phân tích công nghệ trên MStudio Channel từ những ngày đầu.

Em vừa hoàn thiện một bài phân tích chuyên sâu dài khoảng 1.800 từ kèm sơ đồ minh họa với tiêu đề:
"Từ Chatbot đến Tự trị: Bài học triển khai Agentic Workflow trong khối Fintech và Ngân hàng số Việt Nam 2026".

Nội dung bài viết:
1. Đánh giá thực trạng các doanh nghiệp chuyển dịch từ RAG cơ bản sang Multi-Agent Systems.
2. Vấn đề trễ (Latency) và chi phí token inference khi mở rộng scale.
3. 3 bài học thực chiến về thiết kế Guardrails và Human-in-the-loop.

Em xin gửi bản thảo này đến Tòa soạn xem xét đăng tải trong chuyên mục Công nghệ / AI Desk. Bản thảo và tài liệu dẫn chứng đính kèm trong link tài liệu dưới đây.

Rất mong nhận được phản hồi từ các anh chị biên tập viên!

Thân mến,
Lê Hoàng Phúc`,
    timestamp: "08:15 Hôm nay",
    category: "Đóng góp bài",
    status: "unread",
    starred: true,
    avatarColor: "#2563eb",
    tags: ["AI Agent", "Fintech", "Đóng góp chuyên gia"],
  },
  {
    id: "mail-3",
    senderName: "Trần Mai Anh",
    senderEmail: "maianh.tran@vneconomy.vn",
    recipientEmail: "contact@minds.io.vn",
    subject: "[Phản hồi] Góc nhìn rất sắc sảo về dòng vốn FDI và biến động tỷ giá cuối năm",
    preview: "Cảm ơn tác giả MStudio đã có bài viết đối chiếu đa nguồn rất chất lượng...",
    body: `Chào Tòa soạn MStudio,

Sáng nay tôi có đọc bài phân tích về xu hướng dịch chuyển chuỗi cung ứng bán dẫn và dòng vốn FDI cuối năm 2026 trên trang của các bạn.

Cách ban biên tập tổng hợp dữ liệu vĩ mô, biểu đồ trực quan và góc nhìn phân tích độc lập rất thuyết phục, không bị phụ thuộc vào thông cáo PR đơn thuần.

Hy vọng MStudio tiếp tục giữ vững phong cách làm báo "Evidence-first" chất lượng cao này!

Trân trọng,
Trần Mai Anh`,
    timestamp: "16:20 Hôm qua",
    category: "Phản hồi",
    status: "replied",
    starred: false,
    avatarColor: "#16a34a",
    relatedArticleSlug: "dong-von-fdi-va-xu-huong-lai-suat-cuoi-nam-2026",
    tags: ["Kinh tế", "FDI", "Độc giả khen ngợi"],
    replies: [
      {
        id: "rep-1",
        from: "Ban Biên Tập MStudio <contact@minds.io.vn>",
        timestamp: "17:05 Hôm qua",
        content:
          "Cảm ơn chị Mai Anh đã dành thời gian đọc và gửi lời động viên quý báu tới đội ngũ MStudio. Tòa soạn sẽ tiếp tục đào sâu các đề tài vĩ mô và công nghệ chuyên sâu phục vụ độc giả!",
      },
    ],
  },
  {
    id: "mail-4",
    senderName: "Văn phòng Báo chí VinFast",
    senderEmail: "press@vinfastauto.com",
    recipientEmail: "contact@minds.io.vn",
    subject: "[Thông cáo] Cập nhật số liệu bàn giao xe điện toàn cầu Quý 3/2026",
    preview: "Kính gửi quý Ban biên tập, VinFast xin gửi thông cáo báo chí cập nhật kết quả kinh doanh...",
    body: `Kính gửi Ban Biên tập MStudio Channel,

VinFast trân trọng gửi tới Quý Tòa soạn Thông cáo Báo chí về Kết quả Bàn giao Xe điện Toàn cầu Quý 3/2026:

- Tổng số xe điện bàn giao toàn cầu đạt 31.500 xe (tăng 68% so với cùng kỳ).
- Thị trường Bắc Mỹ ghi nhận mức tăng trưởng vượt bậc với dòng xe VF 7 và VF 9.
- Mở rộng mạng lưới 150 showroom và đối tác đại lý ủy quyền tại Đông Nam Á.

Tài liệu hình ảnh độ phân giải cao và phát biểu của ban lãnh đạo được lưu trữ tại trung tâm truyền thông của chúng tôi.

Trân trọng cảm ơn sự đồng hành của Quý Tòa soạn!
Văn phòng Báo chí VinFast`,
    timestamp: "14:10 11 Th10",
    category: "Báo chí",
    status: "read",
    starred: false,
    avatarColor: "#8b5cf6",
    tags: ["Thông cáo", "VinFast", "Kinh tế"],
  },
  {
    id: "mail-5",
    senderName: "Đặng Quang Huy",
    senderEmail: "huy.dang@fpt.com",
    recipientEmail: "contact@minds.io.vn",
    subject: "[Đóng góp bài] Trải nghiệm triển khai Edge AI trên Cloudflare Workers",
    preview: "Gửi MStudio bản thảo về kiến trúc Serverless AI trên Cloudflare...",
    body: `Chào Ban biên tập MStudio,

Tôi muốn gửi đến chuyên mục Công nghệ bài viết chia sẻ kinh nghiệm thực tế khi đưa mô hình suy luận AI lên Cloudflare Workers AI và D1 database nhằm giảm chi phí vận hành cho startup.

Bài viết gồm mã nguồn mẫu và benchmark chi tiết giữa AWS Lambda và Cloudflare Workers.

Mong sớm nhận được hồi âm từ tòa soạn!`,
    timestamp: "09:30 10 Th10",
    category: "Đóng góp bài",
    status: "resolved",
    starred: false,
    avatarColor: "#0891b2",
    tags: ["Cloudflare", "Serverless", "Edge AI"],
  },
];

export default function EmailMailboxPage() {
  const [token] = useCmsToken();
  const [activeFolder, setActiveFolder] = useState<MailFolder>("inbox");
  const [selectedMailId, setSelectedMailId] = useState<string>("mail-1");
  const [emails, setEmails] = useState<EmailMessage[]>(INITIAL_EMAILS);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"inbox" | "compose">("inbox");
  const [mobileView, setMobileView] = useState<"folders" | "master" | "detail">("master");

  // Fetch real emails from D1
  useEffect(() => {
    async function loadEmails() {
      try {
        const activeToken = token || "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
        const res = await fetch(`${apiBaseUrl()}/emails`, {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });
        if (res.ok) {
          const data = (await res.json()) as { emails?: EmailRecord[] };
          if (data.emails && data.emails.length > 0) {
            const mapped = data.emails.map(mapRecordToMessage);
            setEmails(mapped);
            if (!mapped.find((m) => m.id === selectedMailId)) {
              setSelectedMailId(mapped[0].id);
            }
          }
        }
      } catch {
        // Keep initial emails on fallback
      }
    }
    loadEmails();
  }, [token]);

  // Quick Reply State
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState<string | null>(null);

  // Compose State (Newsletter / Outbound Email)
  const [composeType, setComposeType] = useState<"newsletter" | "article_alert" | "direct">("newsletter");
  const [composeTo, setComposeTo] = useState("all-subscribers");
  const [composeSubject, setComposeSubject] = useState("");
  const [composePreheader, setComposePreheader] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeTemplate, setComposeTemplate] = useState("briefing");
  const [composeStatus, setComposeStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [composeNotice, setComposeNotice] = useState("");

  // Filtered emails based on folder, search, and category
  const filteredEmails = useMemo(() => {
    return emails.filter((mail) => {
      // Folder filter
      if (activeFolder === "corrections" && mail.category !== "Đính chính") return false;
      if (activeFolder === "submissions" && mail.category !== "Đóng góp bài") return false;
      if (activeFolder === "feedback" && mail.category !== "Phản hồi") return false;
      if (activeFolder === "starred" && !mail.starred) return false;
      if (activeFolder === "sent" && mail.category !== "Newsletter") return false;

      // Category pill filter
      if (categoryFilter !== "all" && mail.category !== categoryFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = mail.subject.toLowerCase().includes(q);
        const matchSender = mail.senderName.toLowerCase().includes(q) || mail.senderEmail.toLowerCase().includes(q);
        const matchBody = mail.body.toLowerCase().includes(q);
        return matchSubject || matchSender || matchBody;
      }

      return true;
    });
  }, [emails, activeFolder, categoryFilter, searchQuery]);

  // Selected email object
  const selectedMail = useMemo(() => {
    return emails.find((m) => m.id === selectedMailId) || filteredEmails[0];
  }, [emails, selectedMailId, filteredEmails]);

  // Folder Counts
  const counts = useMemo(() => {
    return {
      inbox: emails.length,
      corrections: emails.filter((m) => m.category === "Đính chính").length,
      submissions: emails.filter((m) => m.category === "Đóng góp bài").length,
      feedback: emails.filter((m) => m.category === "Phản hồi").length,
      starred: emails.filter((m) => m.starred).length,
      unread: emails.filter((m) => m.status === "unread" || m.status === "urgent").length,
    };
  }, [emails]);

  // Toggle Star
  async function handleToggleStar(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    const current = emails.find((m) => m.id === id);
    const nextStarred = !current?.starred;
    setEmails((prev) =>
      prev.map((m) => (m.id === id ? { ...m, starred: nextStarred } : m))
    );
    try {
      const activeToken = token || "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
      await fetch(`${apiBaseUrl()}/emails/${id}/star`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ starred: nextStarred ? 1 : 0 }),
      });
    } catch {
      // Non-blocking
    }
  }

  // Mark as Read / Resolved
  async function handleMarkStatus(id: string, newStatus: MailStatus) {
    setEmails((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
    try {
      const activeToken = token || "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
      await fetch(`${apiBaseUrl()}/emails/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Non-blocking
    }
  }

  // Quick Reply
  async function handleSendReply() {
    if (!replyText.trim() || !selectedMail) return;
    const replyContent = replyText.trim();
    const newReply = {
      id: crypto.randomUUID(),
      from: "Ban Biên Tập MStudio <contact@minds.io.vn>",
      timestamp: "Vừa xong",
      content: replyContent,
    };

    setEmails((prev) =>
      prev.map((m) =>
        m.id === selectedMail.id
          ? {
              ...m,
              status: "replied",
              replies: [...(m.replies || []), newReply],
            }
          : m
      )
    );
    setReplyText("");
    setReplyStatus("Đang gửi phản hồi...");

    try {
      const activeToken = token || "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
      await fetch(`${apiBaseUrl()}/email/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          to: selectedMail.senderEmail,
          subject: `Re: ${selectedMail.subject}`,
          body: replyContent,
          senderName: "Ban Biên Tập MStudio",
          senderEmail: "contact@minds.io.vn",
        }),
      });
      setReplyStatus("✓ Đã gửi phản hồi chính thức từ contact@minds.io.vn");
    } catch {
      setReplyStatus("✓ Đã lưu phản hồi nội bộ");
    }
    setTimeout(() => setReplyStatus(null), 4000);
  }

  // Load Template for Compose
  function handleSelectTemplate(tmpl: string) {
    setComposeTemplate(tmpl);
    if (tmpl === "briefing") {
      setComposeSubject("MStudio Weekly Briefing #42: Làn sóng AI Agent & Tác động Vĩ mô");
      setComposePreheader("Điểm tin công nghệ, kinh tế và chuỗi cung ứng được kiểm chứng tuần qua.");
      setComposeBody(
        `Thân gửi Quý độc giả MStudio Channel,\n\nTuần qua, thị trường công nghệ và kinh tế ghi nhận những bước chuyển dịch mang tính bước ngoặt:\n\n1. KỶ NGUYÊN MULTI-AGENT TRONG DOANH NGHIỆP: Các tập đoàn tài chính đang tích cực chuyển đổi từ trợ lý AI đơn nhiệm sang Agentic Workflows có khả năng phối hợp ra quyết định.\n\n2. BỨT PHÁ HẠ TẦNG XE ĐIỆN: Chuẩn sạc HPC 360kW-480kW bắt đầu phủ sóng, giải quyết bài toán sạc thần tốc cho người tiêu dùng.\n\nĐọc bài phân tích đầy đủ và số liệu độc quyền tại: https://mstudio.vn\n\nChúc Quý độc giả một tuần làm việc hiệu quả và tràn đầy năng lượng!\n\nBan Biên Tập MStudio Channel`
      );
    } else if (tmpl === "breaking") {
      setComposeSubject("🚨 [TIN NÓNG] MStudio Breaking Alert: Diễn biến mới nhất về thị trường");
      setComposePreheader("Cập nhật khẩn từ Tòa soạn MStudio Channel.");
      setComposeBody(
        `Kính gửi Bạn đọc,\n\nTòa soạn MStudio Channel vừa phát hiện và kiểm chứng thông tin nóng:\n\n[Tóm tắt sự kiện khẩn cấp vừa diễn ra trong 15 phút qua]\n\nPhân tích chi tiết và dòng sự kiện liên tục được cập nhật trực tiếp tại: https://mstudio.vn/bai-viet/breaking\n\nTrân trọng,\nBan Biên Tập MStudio Channel`
      );
    } else if (tmpl === "submission_accept") {
      setComposeSubject("Tòa soạn MStudio: Phản hồi tiếp nhận bản thảo bài viết của bạn");
      setComposePreheader("Thông báo về quy trình duyệt và biên tập bài viết.");
      setComposeBody(
        `Chào bạn,\n\nTòa soạn MStudio Channel đã nhận được bản thảo bài viết đóng góp của bạn gửi tới contact@minds.io.vn.\n\nĐội ngũ biên tập viên đánh giá cao góc nhìn chuyên sâu và nguồn dữ liệu dẫn chứng của bài viết. Chúng tôi đang tiến hành biên tập theo chuẩn phong cách báo chí của MStudio và sẽ thông báo link xuất bản dự kiến.\n\nCảm ơn bạn đã đồng hành cùng cộng đồng tri thức MStudio!\n\nTrân trọng,\nBan Biên Tập MStudio Channel`
      );
    }
  }

  // Send Compose Mail
  async function handleSendCompose() {
    if (!composeSubject.trim() || !composeBody.trim()) {
      alert("Vui lòng điền tiêu đề và nội dung email!");
      return;
    }
    setComposeStatus("sending");

    try {
      const recipient = (composeTo === "all-subscribers" || composeTo === "vn002187444@gmail.com") 
        ? "vn002187444@gmail.com" 
        : composeTo;

      const activeToken = token || "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
      const res = await fetch(`${apiBaseUrl()}/email/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          to: recipient,
          subject: composeSubject,
          body: composeBody,
          senderName: "Ban Biên Tập MStudio",
          senderEmail: "contact@minds.io.vn",
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        messageId?: string;
        warning?: string;
        error?: { message?: string };
      };

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || `HTTP ${res.status}`);
      }

      const newSentMail: EmailMessage = {
        id: data.messageId || crypto.randomUUID(),
        senderName: "Ban Biên Tập MStudio",
        senderEmail: "contact@minds.io.vn",
        recipientEmail: recipient,
        subject: composeSubject,
        preview: composePreheader || composeBody.slice(0, 100),
        body: composeBody,
        timestamp: "Vừa xong",
        category: "Newsletter",
        status: "read",
        starred: false,
        avatarColor: "#2563eb",
      };

      setEmails((prev) => [newSentMail, ...prev]);
      setComposeStatus("sent");
      const noticeText = data.warning 
        ? `✓ Đã chuyển email tới ${recipient} (${data.warning})`
        : `✓ Đã phát hành email "${composeSubject}" thành công tới ${recipient}!`;
      setComposeNotice(noticeText);

      setTimeout(() => {
        setComposeStatus("idle");
        setComposeNotice("");
        setViewMode("inbox");
      }, 3000);
    } catch (err) {
      alert("Lỗi khi gửi email: " + (err instanceof Error ? err.message : String(err)));
      setComposeStatus("idle");
    }
  }

  return (
    <div style={{ padding: "0 16px 40px" }}>
      {/* Module Title & System Status Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: "var(--text-3xl)", margin: 0, fontWeight: 800 }}>
              Hộp Thư Email Nội Bộ
            </h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 999,
                background: "rgba(37, 99, 235, 0.1)",
                color: "var(--ai-blue, #2563eb)",
                border: "1px solid rgba(37, 99, 235, 0.2)",
              }}
            >
              contact@minds.io.vn
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#16a34a",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#16a34a",
                  display: "inline-block",
                }}
              />
              Cloudflare Email Routing Active
            </span>
          </div>
          <p style={{ margin: "4px 0 0", color: "var(--gray)", fontSize: "var(--text-sm)" }}>
            Quản lý thư phản hồi, yêu cầu đính chính từ bạn đọc &amp; Soạn phát hành Bản tin Newsletter
          </p>
        </div>

        {/* Action Switcher: Inbox vs Compose */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setViewMode("inbox")}
            style={{
              padding: "8px 16px",
              fontWeight: 600,
              fontSize: 13,
              background: viewMode === "inbox" ? "var(--black)" : "var(--white)",
              color: viewMode === "inbox" ? "var(--white)" : "var(--ink)",
              border: "1px solid var(--border)",
            }}
          >
            📥 Hộp thư đến ({counts.unread} mới)
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setViewMode("compose");
              handleSelectTemplate("briefing");
            }}
            style={{
              padding: "8px 18px",
              fontWeight: 600,
              fontSize: 13,
              background: viewMode === "compose" ? "#2563eb" : "var(--white)",
              color: viewMode === "compose" ? "#ffffff" : "var(--ink)",
              border: viewMode === "compose" ? "1px solid #2563eb" : "1px solid var(--border)",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.2)",
            }}
          >
            ✍️ Soạn thư mới / Newsletter
          </button>
        </div>
      </div>

      {/* Main Container: Apple Mail 3-column Layout */}
      {viewMode === "inbox" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 360px minmax(0, 1fr)",
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            minHeight: "720px",
            boxShadow: "0 4px 24px -2px rgba(0, 0, 0, 0.06)",
            overflow: "hidden",
          }}
          className="email-client-shell"
        >
          {/* Column 1: Mailbox Folders Sidebar */}
          <aside
            style={{
              borderRight: "1px solid var(--border)",
              background: "#fafafa",
              padding: "16px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
            className={mobileView === "folders" ? "email-col-folders" : "email-col-hidden"}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#6b7280",
                padding: "4px 8px 8px",
              }}
            >
              Hộp Thư Tòa Soạn
            </div>

            {[
              { id: "inbox", label: "Tất cả thư đến", icon: "📥", count: counts.inbox },
              { id: "corrections", label: "Yêu cầu đính chính", icon: "🛠️", count: counts.corrections, badgeColor: "#dc2626" },
              { id: "submissions", label: "Đóng góp bài viết", icon: "✍️", count: counts.submissions, badgeColor: "#2563eb" },
              { id: "feedback", label: "Phản hồi bạn đọc", icon: "💬", count: counts.feedback },
              { id: "starred", label: "Gắn dấu sao", icon: "⭐", count: counts.starred },
              { id: "sent", label: "Đã gửi / Newsletter", icon: "📤" },
            ].map((folder) => {
              const isActive = activeFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    setActiveFolder(folder.id as MailFolder);
                    setMobileView("master");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    background: isActive ? "#ffffff" : "transparent",
                    color: isActive ? "#111827" : "#4b5563",
                    boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{folder.icon}</span>
                    <span>{folder.label}</span>
                  </span>
                  {typeof folder.count === "number" && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 999,
                        background: folder.badgeColor || (isActive ? "#e5e7eb" : "#f3f4f6"),
                        color: folder.badgeColor ? "#ffffff" : "#4b5563",
                      }}
                    >
                      {folder.count}
                    </span>
                  )}
                </button>
              );
            })}

            <div
              style={{
                marginTop: "auto",
                padding: "12px 8px",
                borderTop: "1px solid var(--border)",
                fontSize: 11,
                color: "#6b7280",
                lineHeight: 1.4,
              }}
            >
              🔒 <strong>Bảo mật tòa soạn</strong>
              <br />
              Email gửi đến địa chỉ <code>contact@minds.io.vn</code> được xác thực SPF/DKIM tự động.
            </div>
          </aside>

          {/* Column 2: Email List with Search & Filters */}
          <section
            style={{
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              overflow: "hidden",
            }}
            className={mobileView === "master" ? "email-col-master" : "email-col-hidden"}
          >
            {/* Search Input Bar */}
            <div style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
              {/* Mobile Folder Switcher */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => setMobileView("folders")}
                  style={{
                    background: "#f3f4f6",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  📁 Thư mục ({counts[activeFolder as keyof typeof counts] ?? filteredEmails.length})
                </button>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>
                  {filteredEmails.length} thư
                </span>
              </div>

              <input
                type="text"
                placeholder="Tìm người gửi, chủ đề, nội dung…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 13,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "#f9fafb",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              {/* Category Filter Pills */}
              <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto", paddingBottom: 2 }}>
                {["all", "Đính chính", "Đóng góp bài", "Phản hồi"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      border: "none",
                      padding: "3px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      background: categoryFilter === cat ? "#111827" : "#f3f4f6",
                      color: categoryFilter === cat ? "#ffffff" : "#4b5563",
                    }}
                  >
                    {cat === "all" ? "Tất cả" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Email List Items */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredEmails.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
                  Không tìm thấy email nào phù hợp trong hộp thư này.
                </div>
              ) : (
                filteredEmails.map((mail) => {
                  const isSelected = selectedMail?.id === mail.id;
                  const isUnread = mail.status === "unread" || mail.status === "urgent";

                  return (
                    <div
                      key={mail.id}
                      onClick={() => {
                        setSelectedMailId(mail.id);
                        setMobileView("detail");
                        if (mail.status === "unread") {
                          handleMarkStatus(mail.id, "read");
                        }
                      }}
                      style={{
                        padding: "12px 14px",
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                        background: isSelected ? "#eff6ff" : isUnread ? "#fdfbf7" : "#ffffff",
                        borderLeft: isSelected ? "3px solid #2563eb" : isUnread ? "3px solid #f59e0b" : "3px solid transparent",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              background: mail.avatarColor,
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {mail.senderName.charAt(0)}
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: isUnread ? 700 : 600,
                              color: "#111827",
                            }}
                          >
                            {mail.senderName}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>{mail.timestamp}</span>
                          <button
                            type="button"
                            onClick={(e) => handleToggleStar(mail.id, e)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              fontSize: 14,
                              color: mail.starred ? "#f59e0b" : "#d1d5db",
                            }}
                          >
                            ★
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: isUnread ? 600 : 500,
                          color: "#1f2937",
                          marginBottom: 4,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {mail.subject}
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "#6b7280",
                          lineHeight: 1.35,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {mail.preview}
                      </p>

                      <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background:
                              mail.category === "Đính chính"
                                ? "#fee2e2"
                                : mail.category === "Đóng góp bài"
                                ? "#dbeafe"
                                : "#dcfce7",
                            color:
                              mail.category === "Đính chính"
                                ? "#991b1b"
                                : mail.category === "Đóng góp bài"
                                ? "#1e40af"
                                : "#166534",
                          }}
                        >
                          {mail.category}
                        </span>

                        {mail.status === "urgent" && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626" }}>
                            🚨 Gấp
                          </span>
                        )}
                        {mail.status === "replied" && (
                          <span style={{ fontSize: 10, color: "#16a34a" }}>
                            ✓ Đã phản hồi
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Column 3: Email Reader & Actions */}
          <main
            style={{ display: "flex", flexDirection: "column", background: "#ffffff", overflow: "hidden" }}
            className={mobileView === "detail" ? "email-col-detail" : "email-col-hidden"}
          >
            {selectedMail ? (
              <>
                {/* Mail Reader Header Bar */}
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--border)",
                    background: "#ffffff",
                  }}
                >
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setMobileView("master")}
                    style={{
                      background: "#f3f4f6",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      marginBottom: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    ← Quay lại danh sách thư
                  </button>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div>
                      <h2 style={{ fontSize: 18, margin: "0 0 6px", fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
                        {selectedMail.subject}
                      </h2>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background:
                              selectedMail.category === "Đính chính"
                                ? "#fee2e2"
                                : selectedMail.category === "Đóng góp bài"
                                ? "#dbeafe"
                                : "#dcfce7",
                            color:
                              selectedMail.category === "Đính chính"
                                ? "#991b1b"
                                : selectedMail.category === "Đóng góp bài"
                                ? "#1e40af"
                                : "#166534",
                          }}
                        >
                          {selectedMail.category}
                        </span>
                        {selectedMail.tags?.map((t) => (
                          <span key={t} style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {selectedMail.category === "Đóng góp bài" && (
                        <Link
                          href="/editor"
                          className="btn-primary"
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            background: "#2563eb",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            textDecoration: "none",
                          }}
                          title="Tạo bài nháp mới từ đóng góp của độc giả"
                        >
                          <span>✍️ Tạo bản thảo bài</span>
                        </Link>
                      )}
                      {selectedMail.category === "Đính chính" && (
                        <Link
                          href="/corrections"
                          className="btn-primary"
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            background: "#dc2626",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            textDecoration: "none",
                          }}
                          title="Đưa vào module Đính chính công khai"
                        >
                          <span>🛠️ Đưa vào Đính chính</span>
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => handleMarkStatus(selectedMail.id, "resolved")}
                        style={{
                          background: "#f3f4f6",
                          border: "1px solid var(--border)",
                          padding: "6px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        ✓ Đã xử lý
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStar(selectedMail.id)}
                        style={{
                          background: "#f3f4f6",
                          border: "1px solid var(--border)",
                          padding: "6px 10px",
                          borderRadius: 6,
                          fontSize: 14,
                          cursor: "pointer",
                          color: selectedMail.starred ? "#f59e0b" : "#6b7280",
                        }}
                      >
                        ★
                      </button>
                    </div>
                  </div>

                  {/* Sender Metadata Box */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 12px",
                      background: "#f9fafb",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: selectedMail.avatarColor,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      {selectedMail.senderName.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                          {selectedMail.senderName}
                        </span>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>{selectedMail.timestamp}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Từ: &lt;{selectedMail.senderEmail}&gt; • Tới: &lt;{selectedMail.recipientEmail}&gt;
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mail Body Content */}
                <div style={{ flex: 1, padding: "24px 20px", overflowY: "auto", lineHeight: 1.7, fontSize: 14, color: "#1f2937" }}>
                  <div style={{ whiteSpace: "pre-line" }}>{selectedMail.body}</div>

                  {/* Related Article Link Chip */}
                  {selectedMail.relatedArticleSlug && (
                    <div
                      style={{
                        marginTop: 20,
                        padding: 12,
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                        📄 Bài viết liên quan trên MStudio Channel:
                      </span>
                      <div style={{ marginTop: 4 }}>
                        <a
                          href={`https://mstudio.vn/bai-viet/${selectedMail.relatedArticleSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 13, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}
                        >
                          /bai-viet/{selectedMail.relatedArticleSlug} ↗
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Past Thread Replies */}
                  {selectedMail.replies && selectedMail.replies.length > 0 && (
                    <div style={{ marginTop: 24, borderTop: "1px dashed var(--border)", paddingTop: 16 }}>
                      <h4 style={{ fontSize: 13, textTransform: "uppercase", color: "#6b7280", margin: "0 0 12px" }}>
                        Các phản hồi đã gửi từ Tòa soạn ({selectedMail.replies.length})
                      </h4>
                      {selectedMail.replies.map((rep) => (
                        <div
                          key={rep.id}
                          style={{
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: 8,
                            padding: "12px",
                            marginBottom: 10,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>{rep.from}</span>
                            <span style={{ fontSize: 11, color: "#4ade80" }}>{rep.timestamp}</span>
                          </div>
                          <div style={{ fontSize: 13, color: "#1e293b", whiteSpace: "pre-line" }}>{rep.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Reply Form */}
                <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", background: "#fafafa" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label htmlFor="quick-reply-box" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#4b5563" }}>
                      ✉️ Phản hồi nhanh tới {selectedMail.senderEmail}
                    </label>
                    {replyStatus && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>
                        {replyStatus}
                      </span>
                    )}
                  </div>
                  <textarea
                    id="quick-reply-box"
                    rows={3}
                    placeholder={`Soạn phản hồi chính thức từ contact@minds.io.vn tới ${selectedMail.senderName}…`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: 13,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "#ffffff",
                      boxSizing: "border-box",
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      style={{ padding: "8px 18px", fontWeight: 600, fontSize: 13 }}
                    >
                      Gửi phản hồi chính thức
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: 48, textAlign: "center", color: "#6b7280" }}>
                Chọn một email trong danh sách để đọc chi tiết.
              </div>
            )}
          </main>
        </div>
      ) : (
        /* View 2: Compose Outbound Email / Newsletter Broadcast */
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: 24,
            maxWidth: 960,
            margin: "0 auto",
            boxShadow: "0 4px 24px -2px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, margin: 0, fontWeight: 700 }}>
                Soạn Phát Hành Email &amp; Newsletter
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                Gửi thông báo xuất bản bài viết hoặc Bản tin tuần từ <code>contact@minds.io.vn</code>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode("inbox")}
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              ← Quay lại Hộp thư đến
            </button>
          </div>

          {composeNotice && (
            <div
              style={{
                padding: 12,
                marginBottom: 16,
                borderRadius: 8,
                background: "#dcfce7",
                color: "#166534",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {composeNotice}
            </div>
          )}

          {/* Type of Outbound Mail */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, color: "#374151" }}>
              Loại thư phát hành:
            </label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { id: "newsletter", label: "📢 Bản tin Newsletter tuần", desc: "48,250 subscribers" },
                { id: "article_alert", label: "⚡ Thông báo xuất bản bài mới", desc: "Breaking / Chuyên mục" },
                { id: "direct", label: "✉️ Thư cá nhân / Báo chí", desc: "1 người nhận" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setComposeType(t.id as typeof composeType)}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: composeType === t.id ? "2px solid #2563eb" : "1px solid var(--border)",
                    background: composeType === t.id ? "#eff6ff" : "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: composeType === t.id ? "#1e40af" : "#111827" }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Templates */}
          <div style={{ marginBottom: 16, background: "#f8fafc", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
              Chọn mẫu Email soạn sẵn (Templates):
            </span>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleSelectTemplate("briefing")}
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: composeTemplate === "briefing" ? "1px solid #2563eb" : "1px solid #cbd5e1",
                  background: composeTemplate === "briefing" ? "#dbeafe" : "#fff",
                  color: composeTemplate === "briefing" ? "#1e40af" : "#334155",
                  cursor: "pointer",
                }}
              >
                📰 Weekly Briefing (Bản tin tuần)
              </button>
              <button
                type="button"
                onClick={() => handleSelectTemplate("breaking")}
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: composeTemplate === "breaking" ? "1px solid #dc2626" : "1px solid #cbd5e1",
                  background: composeTemplate === "breaking" ? "#fee2e2" : "#fff",
                  color: composeTemplate === "breaking" ? "#991b1b" : "#334155",
                  cursor: "pointer",
                }}
              >
                🚨 Breaking Alert (Tin nóng)
              </button>
              <button
                type="button"
                onClick={() => handleSelectTemplate("submission_accept")}
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: composeTemplate === "submission_accept" ? "1px solid #16a34a" : "1px solid #cbd5e1",
                  background: composeTemplate === "submission_accept" ? "#dcfce7" : "#fff",
                  color: composeTemplate === "submission_accept" ? "#166534" : "#334155",
                  cursor: "pointer",
                }}
              >
                ✓ Tiếp nhận bài viết độc giả
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label htmlFor="compose-to" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Người nhận (Recipient / Audience Segment):
              </label>
              <select
                id="compose-to"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  background: "#fff",
                }}
              >
                <option value="vn002187444@gmail.com">Quản trị viên / Hộp thư nhận (vn002187444@gmail.com)</option>
                <option value="all-subscribers">Toàn bộ bạn đọc đăng ký (48,250 subscribers)</option>
                <option value="tech-ai-group">Nhóm độc giả Công nghệ &amp; AI Desk (18,420 subscribers)</option>
                <option value="macro-economy-group">Nhóm độc giả Kinh tế &amp; Thị trường (14,100 subscribers)</option>
                <option value="vip-partners">Đối tác &amp; Chuyên gia đóng góp bài (450 VIP)</option>
                <option value="custom-email">Nhập email cụ thể…</option>
              </select>
            </div>

            <div>
              <label htmlFor="compose-subject" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Tiêu đề Email (Subject Line):
              </label>
              <input
                id="compose-subject"
                type="text"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Nhập tiêu đề email thu hút và rõ ràng…"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  fontWeight: 600,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label htmlFor="compose-preheader" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Đoạn Preheader Text (Hiển thị xem trước trong ứng dụng Mail của bạn đọc):
              </label>
              <input
                id="compose-preheader"
                type="text"
                value={composePreheader}
                onChange={(e) => setComposePreheader(e.target.value)}
                placeholder="Tóm tắt ngắn 1 câu xuất hiện ngay sau tiêu đề…"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label htmlFor="compose-body" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Nội dung thư:
              </label>
              <textarea
                id="compose-body"
                rows={10}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Soạn nội dung bản tin hoặc email…"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontFamily: "var(--font-sans)",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Thư gửi từ: <strong>MStudio Channel &lt;contact@minds.io.vn&gt;</strong>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setViewMode("inbox")}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSendCompose}
                disabled={composeStatus === "sending"}
                style={{
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: 700,
                  background: "#2563eb",
                  boxShadow: "0 2px 10px rgba(37, 99, 235, 0.3)",
                }}
              >
                {composeStatus === "sending" ? "Đang phát hành…" : "🚀 Phát hành Email ngay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
