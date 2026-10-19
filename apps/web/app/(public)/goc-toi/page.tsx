import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * Góc Tối (PLAN public route /goc-toi/) — hồ sơ điều tra, phóng sự góc khuất xã hội.
 */
export const metadata: Metadata = {
  title: "Góc Tối | MStudio Channel",
  description:
    "Hồ sơ điều tra, phóng sự góc khuất xã hội, tệ nạn, ma tuý, scandal và ký sự ăn chơi — góc nhìn chân thực, kiểm chứng đa chiều.",
  robots: { index: true, follow: true },
};

export default function DarkCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="goc-toi"
      description="Hồ sơ điều tra, phóng sự góc khuất xã hội, tệ nạn, ma tuý, scandal và ký sự ăn chơi — góc nhìn chân thực, kiểm chứng đa chiều."
      name="Góc Tối"
    />
  );
}
