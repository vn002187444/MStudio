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
