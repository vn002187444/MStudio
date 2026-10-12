import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * Xe (FU-18 phase 2) — noindex tới khi có article↔category
 * filter (MST-071).
 */
export const metadata: Metadata = {
  title: "Xe | MStudio Channel",
  description:
    "Xe: ô tô, xe máy, EV và thị trường xe Việt Nam & quốc tế — MStudio Channel.",
  robots: { index: false, follow: false },
};

export default function AutoCategoryPage() {
  return (
    <CategoryTemplate
      description="Ô tô, xe máy, EV và thị trường xe Việt Nam & quốc tế."
      name="Xe"
    />
  );
}
