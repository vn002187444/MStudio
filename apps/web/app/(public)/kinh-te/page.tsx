import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kinh tế & Thị trường | MStudio Channel",
  description:
    "Phân tích thị trường tài chính, kinh tế vĩ mô, chuỗi cung ứng, thương mại quốc tế — MStudio Channel.",
  alternates: {
    canonical: "https://mstudio.minds.io.vn/kinh-te",
  },
  openGraph: {
    title: "Kinh tế & Thị trường | MStudio Channel",
    description: "Phân tích thị trường tài chính, kinh tế vĩ mô, thương mại quốc tế — MStudio Channel.",
    url: "https://mstudio.minds.io.vn/kinh-te",
  },
};

export default function KinhTeCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="kinh-te"
      description="Phân tích thị trường tài chính, tiền tệ, bất động sản và các động lực tăng trưởng kinh tế vĩ mô."
      name="Kinh tế"
    />
  );
}
