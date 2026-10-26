import type { Metadata } from "next";
import { siteOrigin } from "../../../lib/seo";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * Đời sống (PLAN public route /doi-song/) — noindex tới khi có
 * article↔category filter (MST-071).
 */
export const metadata: Metadata = {
  title: "Đời sống | MStudio Channel",
  description:
    "Đời sống: Tâm sự, Kỹ năng sống, Gia đình, Sức khỏe, Du lịch — MStudio Channel.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${siteOrigin()}/doi-song`,
  },
};

export default function LifeCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="doi-song"
      description="Tâm sự, Kỹ năng sống, Gia đình, Sức khỏe, Du lịch."
      name="Đời sống"
    />
  );
}
