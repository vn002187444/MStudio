import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kinh doanh & Tài chính | MStudio Channel",
  description:
    "Thị trường tài chính, kinh tế vĩ mô, chứng khoán, bất động sản và câu chuyện doanh nghiệp đổi mới sáng tạo — MStudio Channel.",
  alternates: {
    canonical: "https://mstudio.minds.io.vn/kinh-doanh",
  },
  openGraph: {
    title: "Kinh doanh & Tài chính | MStudio Channel",
    description: "Thị trường tài chính, kinh tế vĩ mô, chứng khoán và doanh nghiệp — MStudio Channel.",
    url: "https://mstudio.minds.io.vn/kinh-doanh",
  },
};

export default function BusinessCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="kinh-doanh"
      description="Phân tích thị trường tài chính, dòng vốn đầu tư, dữ liệu kinh tế vĩ mô và bức tranh doanh nghiệp toàn cầu."
      name="Kinh doanh"
    />
  );
}
