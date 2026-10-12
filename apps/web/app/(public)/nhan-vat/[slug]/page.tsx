import type { Metadata } from "next";
import { EntityTemplate } from "../../../../components/discovery/entity-template";

export const metadata: Metadata = {
  title: "Nhân vật | MStudio Channel",
  description: "Trang nhân vật MStudio Channel.",
  robots: { index: false, follow: false },
};

export default function PersonPage() {
  return (
    <EntityTemplate
      description="Bài viết về nhân vật sẽ hiển thị khi có dữ liệu entity."
      kindLabel="Nhân vật"
      name="Nhân vật"
    />
  );
}
