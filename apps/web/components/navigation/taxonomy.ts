/**
 * Taxonomy navigation — single source (PLAN.md Information Architecture).
 * Route chi tiết (slug, category template) thuộc về MST-042 / MST-051.
 */
export interface TaxonomyItem {
  href: string;
  label: string;
}

export const primaryNav: TaxonomyItem[] = [
  { href: "/moi-nhat/", label: "Mới nhất" },
  { href: "/danh-cho-ban/", label: "Dành cho bạn" },
  { href: "/dang-nong/", label: "Đang nóng" },
  { href: "/the-gioi/", label: "Thế giới" },
  { href: "/cong-nghe/", label: "Công nghệ" },
  { href: "/ai-channel/", label: "AI Channel" },
  { href: "/giai-tri/", label: "Giải trí" },
  { href: "/kham-pha/", label: "Khám phá" },
  { href: "/doi-song/", label: "Đời sống" },
  { href: "/goc-toi/", label: "Góc Tối" },
];

/** Dải trending — chủ đề tĩnh, không số liệu giả (source count chỉ khi có dữ liệu thật). */
export const trendingTopics: TaxonomyItem[] = [
  { href: "/ai-channel/", label: "AI Channel" },
  { href: "/cong-nghe/", label: "Công nghệ" },
  { href: "/the-gioi/", label: "Thế giới" },
];

interface CategoryApiRow {
  slug: string;
  labelVi: string;
  status: string;
}

function apiBaseUrl(): string {
  return process.env.MSTUDIO_API_URL ?? "http://localhost:8787";
}

/**
 * MST-072: nav lấy từ GET /categories (DB-backed, MST-071), fallback về
 * primaryNav hardcode khi API lỗi — không vỡ trang. Revalidate 5 phút
 * (taxonomy đổi hiếm, giữ free-tier).
 */
export async function fetchPrimaryNav(): Promise<TaxonomyItem[]> {
  try {
    const response = await fetch(`${apiBaseUrl()}/categories`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return primaryNav;
    const payload = (await response.json()) as { categories?: CategoryApiRow[] };
    if (!Array.isArray(payload.categories) || payload.categories.length === 0) {
      return primaryNav;
    }
    return payload.categories
      .filter((row) => row.status === "active" && /^[a-z0-9-]+$/.test(row.slug))
      .map((row) => ({ href: `/${row.slug}/`, label: row.labelVi }));
  } catch {
    return primaryNav;
  }
}
