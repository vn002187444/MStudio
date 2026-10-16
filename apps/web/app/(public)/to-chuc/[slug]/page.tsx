import type { Metadata } from "next";
import { EntityTemplate } from "../../../../components/discovery/entity-template";

export const metadata: Metadata = {
  title: "Tổ chức | MStudio Channel",
  description: "Trang tổ chức MStudio Channel.",
  robots: { index: true, follow: true },
};

export default function OrganizationPage() {
  return (
    <EntityTemplate
      description="Bài viết về tổ chức sẽ hiển thị khi có dữ liệu entity."
      kindLabel="Tổ chức"
      name="Tổ chức"
    />
  );
}
