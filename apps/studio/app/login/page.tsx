"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiBaseUrl } from "../../lib/cms";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"pin" | "email">("pin");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError("Vui lòng nhập mã PIN");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl()}/auth/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Mã PIN không chính xác");
      }
      // Save session
      localStorage.setItem("mstudio_cms_token", data.token);
      localStorage.setItem("mstudio_user", JSON.stringify(data.user));
      document.cookie = `mstudio_cms_token=${data.token}; path=/; max-age=31536000; SameSite=Lax`;
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Đăng nhập không thành công");
      }
      // Save session
      localStorage.setItem("mstudio_cms_token", data.token);
      localStorage.setItem("mstudio_user", JSON.stringify(data.user));
      document.cookie = `mstudio_cms_token=${data.token}; path=/; max-age=31536000; SameSite=Lax`;
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--white)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg, 20px)",
          padding: "32px 28px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "var(--black)",
              color: "var(--white)",
              fontSize: "24px",
              marginBottom: "12px",
            }}
          >
            ✦
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            MStudio Newsroom
          </h1>
          <p style={{ color: "var(--gray)", fontSize: "14px", margin: 0 }}>
            Hệ thống biên tập & xuất bản tin tức đa kênh
          </p>
        </div>

        {/* Tab selection */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px",
            background: "var(--soft)",
            padding: "4px",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setTab("pin");
              setError(null);
            }}
            style={{
              border: "none",
              borderRadius: "8px",
              padding: "8px 0",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              background: tab === "pin" ? "var(--white)" : "transparent",
              color: tab === "pin" ? "var(--ink)" : "var(--gray)",
              boxShadow: tab === "pin" ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Mã PIN Nhanh
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("email");
              setError(null);
            }}
            style={{
              border: "none",
              borderRadius: "8px",
              padding: "8px 0",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              background: tab === "email" ? "var(--white)" : "transparent",
              color: tab === "email" ? "var(--ink)" : "var(--gray)",
              boxShadow: tab === "email" ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Tài Khoản Email
          </button>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: "#fee2e2",
              border: "1px solid #f87171",
              color: "#991b1b",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {tab === "pin" ? (
          <form onSubmit={handlePinSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="pin"
                style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--gray)", marginBottom: "8px" }}
              >
                MÃ PIN XÁC THỰC ADMIN (9 SỐ)
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={9}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Nhập mã PIN 9 chữ số (vd: 123456789)"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  fontSize: "20px",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textAlign: "center",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: "var(--soft)",
                  outline: "none",
                }}
                autoFocus
              />
              <p style={{ fontSize: "12px", color: "var(--gray)", marginTop: "6px", textAlign: "center" }}>
                Nhập mã PIN bảo mật do quản trị viên cấp để vào ngay quyền Admin
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                minHeight: "48px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              {loading ? "Đang xác thực…" : "Vào Studio Ngay ➔"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmailSubmit}>
            <div style={{ marginBottom: "14px" }}>
              <label
                htmlFor="email"
                style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--gray)", marginBottom: "6px" }}
              >
                EMAIL BIÊN TẬP VIÊN
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="editor@mstudio.minds.io.vn"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  fontSize: "14px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--soft)",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="password"
                style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--gray)", marginBottom: "6px" }}
              >
                MẬT KHẨU
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  fontSize: "14px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--soft)",
                  outline: "none",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                minHeight: "48px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              {loading ? "Đang xử lý…" : "Đăng Nhập"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
