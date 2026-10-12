import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thế giới | MStudio Channel",
  description:
    "Thời sự quốc tế, địa chính trị, quan hệ ngoại giao và các sự kiện lớn trên toàn cầu — MStudio Channel.",
  alternates: {
    canonical: "https://mstudio.minds.io.vn/the-gioi",
  },
  openGraph: {
    title: "Thế giới | MStudio Channel",
    description: "Thời sự quốc tế, địa chính trị và sự kiện toàn cầu — MStudio Channel.",
    url: "https://mstudio.minds.io.vn/the-gioi",
  },
};

export default function WorldCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="the-gioi"
      description="Góc nhìn đa chiều về các chuyển động địa chính trị, kinh tế và biến đổi xã hội trên thế giới."
      name="Thế giới"
    />
  );
}
