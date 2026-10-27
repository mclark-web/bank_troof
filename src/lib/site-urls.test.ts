import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  BOT_URL,
  DEFAULT_BOT_URL,
  DEFAULT_FINTWIT_URL,
  DEFAULT_HUB_URL,
  DEFAULT_SITE_URL,
  FINTWIT_URL,
  HUB_URL,
  OG_SITE_NAME,
  SHARE_IMAGE_URL,
  SITE_URL,
  SPORTS_URL,
  pageUrl,
  resolveSiteOrigin,
  routeMeta,
} from "./site-urls";

const deploymentHost = ["vercel", "app"].join(".");

test("public origins default to gradedcalls.com", () => {
  assert.equal(DEFAULT_SITE_URL, "https://analysts.gradedcalls.com");
  assert.equal(DEFAULT_HUB_URL, "https://www.gradedcalls.com");
  assert.equal(DEFAULT_FINTWIT_URL, "https://fintwit.gradedcalls.com");
  assert.equal(DEFAULT_BOT_URL, "https://bot.gradedcalls.com");
  assert.equal(resolveSiteOrigin(undefined, DEFAULT_SITE_URL), DEFAULT_SITE_URL);
  assert.equal(resolveSiteOrigin("  ", DEFAULT_HUB_URL), DEFAULT_HUB_URL);
  assert.equal(resolveSiteOrigin("https://analysts.example.com/", DEFAULT_SITE_URL), "https://analysts.example.com");
  assert.equal(SITE_URL, DEFAULT_SITE_URL);
  assert.equal(HUB_URL, DEFAULT_HUB_URL);
  assert.equal(FINTWIT_URL, DEFAULT_FINTWIT_URL);
  assert.equal(BOT_URL, DEFAULT_BOT_URL);
  assert.equal(SPORTS_URL, "https://www.gradedcalls.com/sports");
  assert.equal(SHARE_IMAGE_URL, "https://analysts.gradedcalls.com/opengraph-image.png");
  assert.equal(pageUrl("/"), SITE_URL);
  assert.equal(pageUrl("/about"), "https://analysts.gradedcalls.com/about");
  assert.equal(pageUrl("methodology"), "https://analysts.gradedcalls.com/methodology");
  const home = routeMeta("/");
  const about = routeMeta("/about");
  assert.equal(home.alternates?.canonical, SITE_URL);
  assert.equal(home.openGraph && "url" in home.openGraph ? home.openGraph.url : "", SITE_URL);
  assert.equal(about.alternates?.canonical, "https://analysts.gradedcalls.com/about");
  assert.equal(about.openGraph && "url" in about.openGraph ? about.openGraph.url : "", "https://analysts.gradedcalls.com/about");
  const images = about.twitter?.images;
  const image = Array.isArray(images) ? images[0] : images;
  assert.equal(image && typeof image === "object" && "url" in image ? image.url : "", SHARE_IMAGE_URL);
  assert.equal(OG_SITE_NAME, "GradedCalls Analysts");
  for (const path of ["/", "/about", "/analysts/aaron-rakers", "/calls/real_0001", "/leaderboards"]) {
    const meta = routeMeta(path);
    assert.equal(meta.openGraph && "siteName" in meta.openGraph ? meta.openGraph.siteName : "", OG_SITE_NAME, path);
    assert.equal(meta.openGraph && "type" in meta.openGraph ? meta.openGraph.type : "", "website", path);
    const ogImages = meta.openGraph && "images" in meta.openGraph ? meta.openGraph.images : undefined;
    const ogImage = Array.isArray(ogImages) ? ogImages[0] : ogImages;
    assert.equal(ogImage && typeof ogImage === "object" && "type" in ogImage ? ogImage.type : "", "image/png", path);
  }
  assert.doesNotMatch(
    [SITE_URL, HUB_URL, SPORTS_URL, FINTWIT_URL, BOT_URL, SHARE_IMAGE_URL].join(" "),
    new RegExp(deploymentHost.replace(".", "\\."), "i"),
  );
});

test("origin module does not read deployment hosts", () => {
  const source = readFileSync(new URL("./site-urls.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /VERCEL_URL|VERCEL_BRANCH_URL|VERCEL_PROJECT_PRODUCTION_URL/);
  assert.equal(source.toLowerCase().includes(deploymentHost), false);
});

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

test("every page publishes its own canonical and the 404 does not", () => {
  const appDir = fileURLToPath(new URL("../app", import.meta.url));
  const pages = walk(appDir).filter((path) => path.endsWith("/page.tsx"));
  assert.ok(pages.length >= 15, `expected app pages, found ${pages.length}`);
  for (const path of pages) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /routeMeta\(/, path);
  }

  const notFound = readFileSync(new URL("../app/not-found.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(notFound, /routeMeta\(|canonical|og:url|openGraph/);

  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /metadataBase:\s*new URL\(SITE_URL\)/);
  assert.match(layout, /images:\s*\[SHARE_IMAGE\]/);
  assert.doesNotMatch(layout, /canonical/);
  assert.doesNotMatch(layout, /opengraph-image\.png/);

  const robots = readFileSync(new URL("../app/robots.ts", import.meta.url), "utf8");
  assert.match(robots, /SITE_URL/);
  const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  assert.match(sitemap, /SITE_URL/);
});
