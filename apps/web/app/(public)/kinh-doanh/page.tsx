import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * Kinh doanh (FU-18 phase 2) — noindex tới khi có article↔category
 * filter (MST-071).
 */
export const metadata: Metadata = {
  title: "Kinh doanh | MStudio Channel",
  description:
    "Kinh doanh: thị trường, doanh nghiệp, kinh tế vĩ mô và xu hướng kinh doanh — MStudio Channel.",
  robots: { index: false, follow: false },
};

export default function BusinessCategoryPage() {
  return (
    <CategoryTemplate
      description="Thị trường, doanh nghiệp, kinh tế vĩ mô và xu hướng kinh doanh."
      name="Kinh doanh"
    />
  );
}
