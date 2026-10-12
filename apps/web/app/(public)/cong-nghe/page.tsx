import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * Công nghệ (PLAN public route /cong-nghe/) — noindex tới khi có
 * article↔category filter (MST-071).
 */
export const metadata: Metadata = {
  title: "Công nghệ | MStudio Channel",
  description:
    "Công nghệ: AI, Internet, Startup, Open Source, Blockchain, Crypto — MStudio Channel.",
  robots: { index: false, follow: false },
};

export default function TechCategoryPage() {
  return (
    <CategoryTemplate
      description="AI, Internet, Startup, Open Source, Blockchain, Crypto — xu hướng định hình tương lai."
      name="Công nghệ"
    />
  );
}
