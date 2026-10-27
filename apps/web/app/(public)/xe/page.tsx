import type { Metadata } from "next";
import { siteOrigin } from "../../../lib/seo";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * Xe (FU-18 phase 2) — noindex tới khi có article↔category
 * filter (MST-071).
 */
export const metadata: Metadata = {
  title: "Xe | MStudio Channel",
  description:
    "Xe: ô tô, xe máy, EV và thị trường xe Việt Nam & quốc tế — MStudio Channel.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${siteOrigin()}/xe`,
  },
};

export default function AutoCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="xe"
      description="Ô tô, xe máy, EV và thị trường xe Việt Nam & quốc tế."
      name="Xe"
    />
  );
}
