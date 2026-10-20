import type { RightsStatus } from "@mstudio/contracts";
import { sha256Hex } from "./sha256.ts";

export interface MediaBucket {
  put(
    key: string,
    body: ArrayBuffer | ReadableStream | string,
  ): Promise<unknown>;
}

export interface RehostOptions {
  fetchImage?: (url: string, init?: RequestInit) => Promise<Response>;
}

export function isRehostable(
  rightsStatus: RightsStatus,
): rightsStatus is "clear" | "licensed" {
  return rightsStatus === "clear" || rightsStatus === "licensed";
}

function extensionOf(originUrl: string): string {
  try {
    const pathname = new URL(originUrl).pathname;
    const match = pathname.match(/\.[a-z0-9]{1,5}$/i);
    return match ? match[0] : ".bin";
  } catch {
    return ".bin";
  }
}

export async function mediaAssetKey(
  originUrl: string,
): Promise<string> {
  const digest = await sha256Hex(originUrl);
  return `media/${digest}${extensionOf(originUrl)}`;
}

export async function rehostImage(
  bucket: MediaBucket,
  originUrl: string,
  options: RehostOptions = {},
): Promise<string> {
  const fetchImage = options.fetchImage ?? globalThis.fetch;

  const headers = new Headers({
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  });

  try {
    headers.set("Referer", new URL(originUrl).origin);
  } catch {
    // Ignore invalid origin URL format
  }

  let response = await fetchImage(originUrl, { headers });

  if (!response.ok && (response.status === 401 || response.status === 403)) {
    headers.delete("Referer");
    response = await fetchImage(originUrl, { headers });
  }

  if (!response.ok) {
    throw new Error(
      `image fetch failed: ${response.status} ${originUrl}`,
    );
  }
  const body = await response.arrayBuffer();
  const key = await mediaAssetKey(originUrl);
  await bucket.put(key, body);
  return key;
}
