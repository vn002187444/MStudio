import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * Thế giới (PLAN public route /the-gioi/) — index; sub-taxonomy theo slug
 * chưa có dữ liệu article↔category nên noindex tới khi MST-071 mở filter.
 */
export const metadata: Metadata = {
  title: "Thế giới | MStudio Channel",
  description:
    "Tin thế giới: Mỹ, Châu Âu, Trung Quốc, Hong Kong, Đài Loan, Nhật Bản, Nga, Đông Nam Á, Ấn Độ — MStudio Channel.",
  robots: { index: false, follow: false },
};

export default function WorldCategoryPage() {
  return (
    <CategoryTemplate
      description="Mỹ, Châu Âu, Trung Quốc, Hong Kong, Đài Loan, Nhật Bản, Nga, Đông Nam Á, Campuchia, Lào, Ấn Độ, Châu Mỹ Latin."
      name="Thế giới"
    />
  );
}
