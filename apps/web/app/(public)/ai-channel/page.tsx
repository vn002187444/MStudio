import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * AI Channel index — nav trỏ /ai-channel/ nhưng trước chỉ có [...slug]
 * (catch-all không match 0 segment) nên index 404. noindex tới khi có
 * article↔category filter (MST-071).
 */
export const metadata: Metadata = {
  title: "AI Channel | MStudio Channel",
  description: "Tin AI, models, agents, research và công cụ AI — MStudio Channel.",
  robots: { index: true, follow: true },
};

export default function AiChannelIndexPage() {
  return (
    <CategoryTemplate
      categorySlug="ai-channel"
      description="Tin AI, models, agents, research, developer, GitHub trending và cộng đồng."
      name="AI Channel"
    />
  );
}
