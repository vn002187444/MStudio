import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * Đời sống (PLAN public route /doi-song/) — noindex tới khi có
 * article↔category filter (MST-071).
 */
export const metadata: Metadata = {
  title: "Đời sống | MStudio Channel",
  description:
    "Đời sống: Tâm sự, Kỹ năng sống, Gia đình, Sức khỏe, Du lịch — MStudio Channel.",
  robots: { index: false, follow: false },
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
