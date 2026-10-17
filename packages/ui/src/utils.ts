import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function decodeEntities(text: string): string {
  if (!text) return "";
  const unwrapped = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  return unwrapped.replace(/&(?:[a-z\d]+|#\d+|#x[a-f\d]+);/gi, (entity) => {
    const lower = entity.toLowerCase();
    switch (lower) {
      case "&amp;":
        return "&";
      case "&lt;":
        return "<";
      case "&gt;":
        return ">";
      case "&quot;":
        return '"';
      case "&apos;":
      case "&#39;":
        return "'";
      case "&nbsp;":
        return " ";
      case "&mdash;":
        return "—";
      case "&ndash;":
        return "–";
      case "&hellip;":
        return "…";
      case "&#8217;":
        return "'";
      case "&#8216;":
        return "'";
      case "&#8220;":
        return '"';
      case "&#8221;":
        return '"';
      case "&#038;":
        return "&";
      case "&copy;":
        return "©";
      case "&reg;":
        return "®";
      case "&trade;":
        return "™";
      case "&ocirc;":
        return "ô";
      case "&ecirc;":
        return "ê";
      case "&agrave;":
        return "à";
      case "&aacute;":
        return "á";
      case "&oacute;":
        return "ó";
      case "&ograve;":
        return "ò";
      case "&otilde;":
        return "õ";
      case "&ugrave;":
        return "ù";
      case "&uacute;":
        return "ú";
      case "&yacute;":
        return "ý";
      case "&atilde;":
        return "ã";
      case "&acirc;":
        return "â";
      case "&egrave;":
        return "è";
      case "&eacute;":
        return "é";
      case "&igrave;":
        return "ì";
      case "&iacute;":
        return "í";
      case "&icirc;":
        return "î";
      case "&iuml;":
        return "ï";
      case "&ccedil;":
        return "ç";
      case "&ntilde;":
        return "ñ";
      default:
        if (lower.startsWith("&#x")) {
          const code = parseInt(lower.slice(3, -1), 16);
          if (!isNaN(code) && code > 0 && code <= 0x10ffff) {
            return String.fromCodePoint(code);
          }
        } else if (lower.startsWith("&#")) {
          const code = parseInt(lower.slice(2, -1), 10);
          if (!isNaN(code) && code > 0 && code <= 0x10ffff) {
            return String.fromCodePoint(code);
          }
        }
        return entity;
    }
  });
}

export function cleanText(text: string): string {
  if (!text) return "";
  return decodeEntities(text.replace(/<[^>]*>?/gm, ""));
}
