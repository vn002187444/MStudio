import type { Metadata } from "next";
import { siteOrigin } from "../../../lib/seo";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * Sức khỏe (FU-18 phase 2) — noindex tới khi có article↔category
 * filter (MST-071).
 */
export const metadata: Metadata = {
  title: "Sức khỏe | MStudio Channel",
  description:
    "Sức khỏe: y tế, dinh dưỡng, tâm lý và lifehacks sức khỏe có nguồn — MStudio Channel.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${siteOrigin()}/suc-khoe`,
  },
};

export default function HealthCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="suc-khoe"
      description="Y tế, dinh dưỡng, tâm lý và kiến thức sức khỏe có kiểm chứng nguồn."
      name="Sức khỏe"
    />
  );
}
