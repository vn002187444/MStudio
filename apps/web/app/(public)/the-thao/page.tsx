import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thể thao | MStudio Channel",
  description:
    "Tin tức thể thao trong nước và quốc tế, bóng đá, quần vợt, chạy bộ cộng đồng — MStudio Channel.",
  alternates: {
    canonical: "https://mstudio.minds.io.vn/the-thao",
  },
  openGraph: {
    title: "Thể thao | MStudio Channel",
    description: "Tin tức thể thao trong nước và quốc tế, bóng đá, điền kinh — MStudio Channel.",
    url: "https://mstudio.minds.io.vn/the-thao",
  },
};

export default function TheThaoCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="the-thao"
      description="Cập nhật diễn biến thể thao đỉnh cao, tinh thần fair-play và phong trào tập luyện thể chất cộng đồng."
      name="Thể thao"
    />
  );
}
