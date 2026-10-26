import type { Metadata } from "next";
import { siteOrigin } from "../../../lib/seo";
import { CategoryTemplate } from "../../../components/article/category-template";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Công nghệ & AI | MStudio Channel",
  description:
    "Tin tức công nghệ mới nhất: Trí tuệ nhân tạo (AI), Bán dẫn, Khởi nghiệp công nghệ, Phần mềm mã nguồn mở — MStudio Channel.",
  alternates: {
    canonical: "https://mstudio.minds.io.vn/cong-nghe",
  },
  openGraph: {
    title: "Công nghệ & AI | MStudio Channel",
    description: "Tin tức công nghệ mới nhất: AI, Bán dẫn, Khởi nghiệp, Phần mềm — MStudio Channel.",
    url: "https://mstudio.minds.io.vn/cong-nghe",
  },
};

export default function TechCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="cong-nghe"
      description="Cập nhật bước tiến trí tuệ nhân tạo, công nghệ bán dẫn, startup và xu hướng kỹ thuật số định hình tương lai."
      name="Công nghệ"
    />
  );
}
