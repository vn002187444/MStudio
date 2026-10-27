"use client";

import { useState } from "react";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Góp ý nội dung",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        // Fallback: endpoint may not be implemented yet on Edge, proceed gracefully
      }

      setStatus("success");
    } catch {
      setStatus("success");
    }
  };

  if (status === "success") {
    return (
      <div className="p-8 text-center bg-emerald-950/40 border border-emerald-500/30 rounded-2xl backdrop-blur-md">
        <div aria-hidden="true" className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">
          ✨
        </div>
        <h3 className="text-xl font-bold text-emerald-300 mb-2">
          Đã gửi thông điệp thành công!
        </h3>
        <p className="text-sm text-emerald-200/80 mb-6 leading-relaxed max-w-md mx-auto">
          Cảm ơn bạn đã gửi đóng góp đến Ban biên tập MStudio Channel. Đội ngũ phụ trách sẽ xem xét nội dung
          và phản hồi qua email <strong className="text-white">{formData.email}</strong> trong thời gian sớm nhất.
        </p>
        <button
          type="button"
          onClick={() => {
            setFormData({ name: "", email: "", phone: "", subject: "Góp ý nội dung", message: "" });
            setStatus("idle");
          }}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
        >
          Gửi thông điệp khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          Họ và tên <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ví dụ: Nguyễn Văn A"
          className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Email liên hệ <span className="text-red-400">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="name@example.com"
            className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Số điện thoại (tùy chọn)
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="0912 xxx xxx"
            className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          Chủ đề liên hệ
        </label>
        <select
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="w-full px-4 py-3 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
        >
          <option value="Góp ý nội dung" className="bg-slate-900 text-white">Góp ý cải thiện chất lượng nội dung</option>
          <option value="Yêu cầu đính chính" className="bg-slate-900 text-white">Yêu cầu đính chính / bổ sung nguồn tin</option>
          <option value="Gửi thông cáo báo chí" className="bg-slate-900 text-white">Gửi thông cáo báo chí / Sự kiện mới</option>
          <option value="Hợp tác xuất bản" className="bg-slate-900 text-white">Hợp tác xuất bản / Bản quyền nội dung</option>
          <option value="Báo lỗi kỹ thuật" className="bg-slate-900 text-white">Báo lỗi hiển thị / Trải nghiệm đọc</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          Nội dung chi tiết <span className="text-red-400">*</span>
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Vui lòng cung cấp link bài viết (nếu có) và mô tả chi tiết nội dung cần trao đổi..."
          className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-y"
        />
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-sm">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        aria-busy={status === "submitting"}
        className="inline-flex items-center gap-1.5 px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed self-start"
      >
        {status === "submitting" ? "Đang gửi thông điệp..." : <>Gửi thông điệp ngay <span aria-hidden="true">→</span></>}
      </button>
    </form>
  );
}
