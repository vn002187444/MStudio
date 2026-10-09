import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * AI Channel category template (MST-042) — vertical demo đầu tiên.
 * noindex cho đến khi có bài xuất bản thật (tránh index shell rỗng).
 */
export const metadata: Metadata = {
  title: "AI Channel | MStudio Channel",
  description: "Tin AI, models, agents, research và công cụ AI — MStudio Channel.",
  robots: { index: false, follow: false },
};

export default function AiChannelCategoryPage() {
  return (
    <CategoryTemplate
      description="Tin AI, models, agents, research, developer, GitHub trending và cộng đồng."
      name="AI Channel"
    />
  );
}
