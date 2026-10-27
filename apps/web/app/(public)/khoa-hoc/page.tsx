import type { Metadata } from "next";
import { siteOrigin } from "../../../lib/seo";
import { CategoryTemplate } from "../../../components/article/category-template";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Khoa học & Đột phá | MStudio Channel",
  description:
    "Khám phá khoa học vũ trụ, vật lý lượng tử, y sinh học và những phát kiến thay đổi thế giới — MStudio Channel.",
  alternates: {
    canonical: "https://mstudio.minds.io.vn/khoa-hoc",
  },
  openGraph: {
    title: "Khoa học & Đột phá | MStudio Channel",
    description: "Khám phá khoa học vũ trụ, vật lý lượng tử, y sinh học — MStudio Channel.",
    url: "https://mstudio.minds.io.vn/khoa-hoc",
  },
};

export default function KhoaHocCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="khoa-hoc"
      description="Khám phá vũ trụ, vật lý lượng tử, y sinh học và những phát kiến khoa học nền tảng định hình tương lai."
      name="Khoa học"
    />
  );
}
