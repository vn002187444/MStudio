import type { Metadata } from "next";
import { siteOrigin } from "../../../lib/seo";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * Giải trí (PLAN public route /giai-tri/) — noindex tới khi có
 * article↔category filter (MST-071).
 */
export const metadata: Metadata = {
  title: "Giải trí | MStudio Channel",
  description: "Giải trí: Ngôi sao, Âm nhạc, Điện ảnh, Showbiz, Scandal — MStudio Channel.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${siteOrigin()}/giai-tri`,
  },
};

export default function EntertainmentCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="giai-tri"
      description="Ngôi sao, Âm nhạc, Điện ảnh, Showbiz và Scandal."
      name="Giải trí"
    />
  );
}
