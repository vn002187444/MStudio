import type { Metadata } from "next";
import { CategoryTemplate } from "../../../components/article/category-template";

/**
 * Blockchain & Web3 (PLAN public route /blockchain/)
 */
export const metadata: Metadata = {
  title: "Blockchain & Web3 | MStudio Channel",
  description:
    "Tin tức chuyên sâu về Blockchain, Web3, tiền mã hóa, DeFi và hạ tầng phi tập trung thời gian thực.",
  robots: { index: true, follow: true },
};

export default function BlockchainCategoryPage() {
  return (
    <CategoryTemplate
      categorySlug="blockchain"
      description="Cập nhật dòng chảy công nghệ Blockchain, dữ liệu on-chain, DeFi, Web3 và tài chính phi tập trung với kiểm chứng đa nguồn."
      name="Blockchain & Web3"
    />
  );
}
