import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thời sự | MStudio Channel",
  description:
    "Tin tức thời sự trong nước và quốc tế, chính sách phát triển, an sinh xã hội cập nhật liên tục — MStudio Channel.",
  alternates: {
    canonical: "https://mstudio.minds.io.vn/thoi-su",
  },
  openGraph: {
    title: "Thời sự | MStudio Channel",
    description: "Tin tức thời sự trong nước và quốc tế, chính sách phát triển — MStudio Channel.",
    url: "https://mstudio.minds.io.vn/thoi-su",
  },
};

export default function ThoiSuCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="thoi-su"
      description="Cập nhật các dòng sự kiện chính trị - xã hội trọng điểm, chuyển động chính sách và an sinh đời sống."
      name="Thời sự"
    />
  );
}
