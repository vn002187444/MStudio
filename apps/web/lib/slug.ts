/**
 * Slug đẹp cho URL (proposal §7): [category]/[...slug] với id tĩnh ở cuối.
 * Hiện tại article chưa có categorySlug từ backend (chờ article↔category
 * mapping) nên route /bai-viet/:id vẫn là canonical. Hàm này dùng cho
 * metadata/canonical sau và ToC anchors ngay từ bây giờ.
 */
export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "bai-viet";
}

export function prettyArticlePath(
  categorySlug: string,
  title: string,
  id: string,
): string {
  return `/${categorySlug}/${slugify(title)}-${id}`;
}
