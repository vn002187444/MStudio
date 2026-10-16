import type { Metadata } from "next";
import { EntityTemplate } from "../../../../components/discovery/entity-template";

/**
 * Tác giả (PLAN public route /tac-gia/[slug]/) — shell chờ dữ liệu
 * author thật từ pipeline; noindex tới khi có author linkage.
 */
interface AuthorParams {
  params: Promise<{ slug: string }> | { slug: string };
}

export async function generateMetadata({ params }: AuthorParams): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const name = decodeURIComponent(slug).replace(/-/g, " ");
  return {
    title: `Tác giả ${name} | MStudio Channel`,
    description: `Bài viết của tác giả ${name} — MStudio Channel.`,
    robots: { index: true, follow: true },
  };
}

export default async function AuthorPage({ params }: AuthorParams) {
  const { slug } = await Promise.resolve(params);
  const name = decodeURIComponent(slug).replace(/-/g, " ");

  return (
    <EntityTemplate
      description="Bài viết của tác giả sẽ hiển thị khi có dữ liệu attribution thật (editor/author pipeline)."
      kindLabel="Tác giả"
      name={name}
    />
  );
}
