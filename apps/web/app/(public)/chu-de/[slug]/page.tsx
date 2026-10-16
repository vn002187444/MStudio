import type { Metadata } from "next";
import { EntityTemplate } from "../../../../components/discovery/entity-template";

export const metadata: Metadata = {
  title: "Chủ đề | MStudio Channel",
  description: "Trang chủ đề MStudio Channel.",
  robots: { index: true, follow: true },
};

export default function TopicPage() {
  return (
    <EntityTemplate
      description="Bài viết thuộc chủ đề sẽ hiển thị khi có dữ liệu entity/topic."
      kindLabel="Chủ đề"
      name="Chủ đề"
    />
  );
}
