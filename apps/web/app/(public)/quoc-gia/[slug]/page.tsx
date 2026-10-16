import type { Metadata } from "next";
import { EntityTemplate } from "../../../../components/discovery/entity-template";

export const metadata: Metadata = {
  title: "Quốc gia | MStudio Channel",
  description: "Trang quốc gia MStudio Channel.",
  robots: { index: true, follow: true },
};

export default function CountryPage() {
  return (
    <EntityTemplate
      description="Bài viết về quốc gia sẽ hiển thị khi có dữ liệu entity."
      kindLabel="Quốc gia"
      name="Quốc gia"
    />
  );
}
