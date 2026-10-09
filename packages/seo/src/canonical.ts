const TRACKING_PARAM_PATTERN =
  /^(utm_|fbclid$|gclid$|msclkid$|ref$|mc_eid$|mc_cid$|_ga$|igshid$|vero_)/;

export interface CanonicalizeOptions {
  baseUrl?: string;
  forceHttps?: boolean;
}

export function canonicalizeUrl(
  input: string,
  options: CanonicalizeOptions = {},
): string {
  const url = new URL(input, options.baseUrl);
  if (options.forceHttps !== false) {
    url.protocol = "https:";
  }
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAM_PATTERN.test(key)) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  }
  return url.toString();
}

export function isTrackingParam(key: string): boolean {
  return TRACKING_PARAM_PATTERN.test(key);
}
