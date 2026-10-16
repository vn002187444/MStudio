import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * Giáo dục (FU-18 phase 2) — noindex tới khi có article↔category
 * filter (MST-071).
 */
export const metadata: Metadata = {
  title: "Giáo dục | MStudio Channel",
  description:
    "Giáo dục: giáo dục đại học, học bổng, EdTech và xu hướng đào tạo — MStudio Channel.",
  robots: { index: true, follow: true },
};

export default function EducationCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="giao-duc"
      description="Giáo dục đại học, học bổng, EdTech và xu hướng đào tạo."
      name="Giáo dục"
    />
  );
}
