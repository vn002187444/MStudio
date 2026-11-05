import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { PublishedArticleRecord } from "./contracts";
import { cleanText } from "@mstudio/ui";

export const CATEGORY_NAMES: Record<string, string> = {
  "thoi-su": "Thời sự",
  "the-gioi": "Thế giới",
  "kinh-doanh": "Kinh doanh",
  "kinh-te": "Kinh tế",
  "cong-nghe": "Công nghệ",
  "ai-channel": "AI Channel",
  "khoa-hoc": "Khoa học",
  "giai-tri": "Giải trí",
  "the-thao": "Thể thao",
  "phap-luat": "Pháp luật",
  "giao-duc": "Giáo dục",
  "suc-khoe": "Sức khỏe",
  "doi-song": "Đời sống",
  "du-lich": "Du lịch",
  "kham-pha": "Khám phá",
  xe: "Xe",
  "bat-dong-san": "Bất động sản",
  "goc-toi": "Góc Tối",
  blockchain: "Blockchain & Web3",
};

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  "thoi-su": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
  "the-gioi": "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80",
  "kinh-doanh": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
  "kinh-te": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
  "cong-nghe": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  "ai-channel": "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
  "khoa-hoc": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  "kham-pha": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  "giai-tri": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
  "the-thao": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
  "giao-duc": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  "suc-khoe": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80",
  "doi-song": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
  xe: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  "goc-toi": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
  blockchain: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80",
};

export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  } catch {
    return String(dateString);
  }
}

export function getFallbackImageUrl(categorySlug?: string): string {
  const category = categorySlug || "thoi-su";
  return CATEGORY_FALLBACK_IMAGES[category] ?? CATEGORY_FALLBACK_IMAGES["thoi-su"];
}

export function getArticleImageUrl(article: { heroImageUrl?: string; categorySlug?: string }): string {
  if (article.heroImageUrl && article.heroImageUrl.trim() !== "") {
    const sanitized = article.heroImageUrl.replace(/&amp;/g, "&").trim();
    if (sanitized.startsWith("http")) return sanitized;
  }
  return getFallbackImageUrl(article.categorySlug);
}

export function stripHtml(html?: string | null): string {
  return cleanText(html);
}
