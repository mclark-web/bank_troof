import type { Metadata } from "next";

/**
 * Public GradedCalls origins.
 *
 * SITE_URL is this board (Analysts).
 * HUB_URL is the hub home opened by the logo.
 * Sports is the hub plus /sports.
 * FinTwit and GCBot are the other boards.
 * Each value reads its NEXT_PUBLIC_* env var and otherwise uses the gradedcalls.com host.
 * Deployment hosts are not consulted.
 */
export function resolveSiteOrigin(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim().replace(/\/+$/, "") ?? "";
  return trimmed.length > 0 ? trimmed : fallback;
}

export const DEFAULT_SITE_URL = "https://analysts.gradedcalls.com";
export const DEFAULT_HUB_URL = "https://www.gradedcalls.com";
export const DEFAULT_FINTWIT_URL = "https://fintwit.gradedcalls.com";
export const DEFAULT_BOT_URL = "https://bot.gradedcalls.com";

export const SITE_URL = resolveSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL, DEFAULT_SITE_URL);
export const HUB_URL = resolveSiteOrigin(process.env.NEXT_PUBLIC_HUB_URL, DEFAULT_HUB_URL);
export const FINTWIT_URL = resolveSiteOrigin(process.env.NEXT_PUBLIC_FINTWIT_URL, DEFAULT_FINTWIT_URL);
export const BOT_URL = resolveSiteOrigin(process.env.NEXT_PUBLIC_BOT_URL, DEFAULT_BOT_URL);

/** Sports lives on the hub. */
export const SPORTS_URL = `${HUB_URL}/sports`;

/** Absolute URL on this board. `pageUrl("/")` is SITE_URL with no trailing slash. */
export function pageUrl(path = "/"): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (suffix === "/") return SITE_URL;
  return `${SITE_URL}${suffix}`;
}

/** Share image served from public/. The opengraph-image file convention follows the deployment host. */
export const SHARE_IMAGE_URL = `${SITE_URL}/opengraph-image.png`;

export const OG_SITE_NAME = "GradedCalls Analysts";

export const SHARE_IMAGE = {
  url: SHARE_IMAGE_URL,
  width: 1200,
  height: 630,
  alt: "GradedCalls",
  type: "image/png",
} as const;

/**
 * Canonical and og:url for one route.
 * Child openGraph replaces the layout block, so site name, type, and image type travel with the page.
 */
export function routeMeta(path: string): Pick<Metadata, "alternates" | "openGraph" | "twitter"> {
  const url = pageUrl(path);
  return {
    alternates: { canonical: url },
    openGraph: {
      url,
      siteName: OG_SITE_NAME,
      type: "website",
      images: [SHARE_IMAGE],
    },
    twitter: { images: [SHARE_IMAGE] },
  };
}
