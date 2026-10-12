import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * Khám phá (PLAN public route /kham-pha/) — noindex tới khi có
 * article↔category filter (MST-071).
 */
export const metadata: Metadata = {
  title: "Khám phá | MStudio Channel",
  description:
    "Khám phá: Chuyện lạ, Kỳ án, Ký sự, Hồ sơ, Bí ẩn, Lịch sử — MStudio Channel.",
  robots: { index: false, follow: false },
};

export default function DiscoveryCategoryPage() {
  return (
    <CategoryTemplate
      description="Chuyện lạ, Kỳ án, Ký sự, Hồ sơ, Bí ẩn, Lịch sử."
      name="Khám phá"
    />
  );
}
