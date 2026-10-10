import type { RightsStatus } from "@mstudio/contracts";
import { sha256Hex } from "./sha256.ts";

export interface MediaBucket {
  put(
    key: string,
    body: ArrayBuffer | ReadableStream | string,
  ): Promise<unknown>;
}

export interface RehostOptions {
  fetchImage?: (url: string) => Promise<Response>;
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
  const response = await fetchImage(originUrl);
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
