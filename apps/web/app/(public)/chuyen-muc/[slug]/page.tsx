import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryTemplate } from "../../../../components/article/category-template";

export const dynamic = "force-dynamic";

const CATEGORY_META: Record<string, { name: string; desc: string }> = {
  "cong-nghe": {
    name: "Công nghệ",
    desc: "Cập nhật bước tiến trí tuệ nhân tạo, công nghệ bán dẫn, startup và xu hướng kỹ thuật số.",
  },
  "kinh-te": {
    name: "Kinh tế",
    desc: "Phân tích thị trường tài chính, tiền tệ, bất động sản và các động lực tăng trưởng kinh tế.",
  },
  "kinh-doanh": {
    name: "Kinh doanh",
    desc: "Chiến lược doanh nghiệp, chuyển động thị trường và bài học kinh thương thực chiến.",
  },
  "the-gioi": {
    name: "Thế giới",
    desc: "Bản tin thời sự quốc tế, phân tích địa chính trị và xu thế chuyển dịch kinh tế toàn cầu.",
  },
  "thoi-su": {
    name: "Thời sự",
    desc: "Cập nhật các dòng sự kiện chính trị - xã hội trọng điểm, chuyển động chính sách và an sinh.",
  },
  "khoa-hoc": {
    name: "Khoa học",
    desc: "Khám phá vũ trụ, vật lý lượng tử, y sinh học và những phát kiến khoa học nền tảng.",
  },
  "the-thao": {
    name: "Thể thao",
    desc: "Cập nhật diễn biến thể thao đỉnh cao, tinh thần fair-play và phong trào tập luyện cộng đồng.",
  },
  "doi-song": {
    name: "Đời sống",
    desc: "Góc nhìn văn hóa, phong cách sống, kỹ năng phát triển bản thân và trải nghiệm cộng đồng.",
  },
  "giai-tri": {
    name: "Giải trí",
    desc: "Nhịp đập nghệ thuật, điện ảnh, âm nhạc và những xu hướng giải trí nổi bật.",
  },
  "suc-khoe": {
    name: "Sức khỏe",
    desc: "Y học thường thức, sức khỏe tinh thần và lối sống cân bằng, lành mạnh.",
  },
  xe: {
    name: "Xe & Di chuyển",
    desc: "Thị trường ô tô, xe điện thông minh và xu hướng giao thông xanh.",
  },
  "ai-channel": {
    name: "AI Channel",
    desc: "Chuyên trang độc quyền phân tích các mô hình AI Agent, tự động hóa và điện toán biên.",
  },
  "dang-nong": {
    name: "Đang nóng",
    desc: "Tổng hợp các luồng tin nóng, dòng sự kiện tâm điểm được bạn đọc quan tâm nhiều nhất.",
  },
  "moi-nhat": {
    name: "Mới nhất",
    desc: "Dòng chảy thông tin mới nhất 24/7 được kiểm chứng và tổng hợp liên tục.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const info = CATEGORY_META[slug] || {
    name: `Chuyên mục ${slug}`,
    desc: `Tin tức mới nhất thuộc chuyên mục ${slug} — MStudio Channel.`,
  };

  return {
    title: `${info.name} | MStudio Channel`,
    description: info.desc,
    alternates: {
      canonical: `https://mstudio.minds.io.vn/chuyen-muc/${slug}`,
    },
    openGraph: {
      title: `${info.name} | MStudio Channel`,
      description: info.desc,
      url: `https://mstudio.minds.io.vn/chuyen-muc/${slug}`,
    },
  };
}

export default async function ChuyenMucSlugPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);
  if (!slug) {
    notFound();
  }

  const info = CATEGORY_META[slug] || {
    name: `Chuyên mục ${slug.replace(/-/g, " ")}`,
    desc: `Cập nhật tin tức mới nhất về chủ đề ${slug.replace(/-/g, " ")} trên MStudio Channel.`,
  };

  return (
    <CategoryTemplate
      categorySlug={slug}
      description={info.desc}
      name={info.name}
    />
  );
}
