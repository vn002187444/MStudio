import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * Góc Tối (PLAN public route /goc-toi/) — vertical documentary restrained,
 * no image giật gân. noindex tới khi có article↔category filter (MST-071).
 * Human (10-10-2026): giữ tên "Góc Tối", không review-gate riêng.
 */
export const metadata: Metadata = {
  title: "Góc Tối | MStudio Channel",
  description:
    "Góc Tối: Kỳ án, Hồ sơ, Ký sự, Dark History — hồ sơ điều tra, kể chuyện có kiểm chứng.",
  robots: { index: false, follow: false },
};

export default function DarkCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="goc-toi"
      description="Kỳ án, Hồ sơ, Ký sự, Dark History — điều tra và hồ sơ, không imagery giật gân."
      name="Góc Tối"
    />
  );
}
