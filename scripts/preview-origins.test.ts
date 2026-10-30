import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { SHARE_IMAGE_URL, SITE_URL, pageUrl } from "../src/lib/site-urls";

const deploymentHost = ["vercel", "app"].join(".");
const legacyProductionHost = `bank-troof.${deploymentHost}`;
const distDir = ".next-preview-urls";
const skipDirs = new Set(["node_modules", ".next", ".next-preview-urls", ".git", "out", "artifacts", ".vercel"]);

/** The only deployment-host string permitted in source is this redirect rule. */
function legacyRedirectLine(): string {
  return `has: [{ type: "host", value: "${legacyProductionHost}" }],`;
}

type SourceFile = { name: string; text: string };

function walkSource(dir: string, root: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (dir === root && skipDirs.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (skipDirs.has(name)) continue;
      walkSource(path, root, out);
    } else out.push(path);
  }
  return out;
}

/**
 * Allow exactly one source line: the legacy production host on the redirect rule.
 * Every other deployment-host string is a failure, including the same line in another file.
 */
function unexpectedDeploymentHosts(files: SourceFile[]): string[] {
  const allowedLine = legacyRedirectLine();
  const problems: string[] = [];
  let allowed = 0;
  for (const file of files) {
    const lines = file.text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const text = lines[index];
      if (!text.toLowerCase().includes(deploymentHost)) continue;
      const permitted = file.name === "next.config.ts" && text.trim() === allowedLine;
      if (permitted) allowed += 1;
      else problems.push(`${file.name}:${index + 1}: ${text.trim()}`);
    }
  }
  if (allowed !== 1) {
    problems.unshift(`expected exactly one legacy production redirect host line, found ${allowed}`);
  }
  return problems;
}

type BuiltFile = { name: string; text: string; kind: "html" | "page-data" | "robots" | "sitemap" | "script" };

function walk(dir: string, out: string[] = []): string[] {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

function kindOf(rel: string): BuiltFile["kind"] | null {
  const lower = rel.toLowerCase();
  if (lower.includes("robots")) return "robots";
  if (lower.includes("sitemap")) return "sitemap";
  if (lower.endsWith(".html")) return "html";
  if (/\.(rsc|meta|json|body)$/.test(lower)) return "page-data";
  return null;
}

function collect(root: string): BuiltFile[] {
  const appDir = join(root, "server", "app");
  const files: BuiltFile[] = [];
  for (const path of walk(appDir)) {
    const name = relative(root, path);
    const kind = kindOf(name);
    if (!kind) continue;
    files.push({ name, text: readFileSync(path, "utf8"), kind });
  }
  for (const path of walk(root)) {
    if (!path.endsWith(".html")) continue;
    const name = relative(root, path);
    if (files.some((file) => file.name === name)) continue;
    files.push({ name, text: readFileSync(path, "utf8"), kind: "html" });
  }
  for (const path of walk(join(root, "static", "chunks"))) {
    if (!path.endsWith(".js")) continue;
    files.push({ name: relative(root, path), text: readFileSync(path, "utf8"), kind: "script" });
  }
  return files;
}

/** Whole-file scan. A hit in the document body counts. */
function leaks(files: BuiltFile[]): string[] {
  const needle = deploymentHost.toLowerCase();
  return files.filter((file) => file.text.toLowerCase().includes(needle)).map((file) => file.name);
}

function headOf(html: string): string {
  const at = html.toLowerCase().indexOf("</head>");
  return at < 0 ? html : html.slice(0, at);
}

function contents(head: string, attr: "property" | "name", key: string): string[] {
  const pattern = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`, "g");
  return [...head.matchAll(pattern)].map((match) => match[1]);
}

function canonicals(head: string): string[] {
  return [...head.matchAll(/<link\s+rel="canonical"\s+href="([^"]*)"/g)].map((match) => match[1]);
}

function routeFromHtml(name: string): string | null | "shell" {
  const rel = name.replaceAll("\\", "/");
  const file = rel.split("/").pop() ?? rel;
  if (file === "_global-error.html" || rel.endsWith("/_global-error.html")) return "shell";
  if (file === "_not-found.html" || rel.endsWith("/_not-found.html")) return null;
  let route = rel.replace(/^server\/app\//, "").replace(/\.html$/, "");
  if (route === "index") return "/";
  if (route.endsWith("/index")) route = route.slice(0, -"/index".length);
  return route.startsWith("/") ? route : `/${route}`;
}

test("deployment host is allowlisted only on the legacy production redirect line", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const files: SourceFile[] = [];
  for (const path of walkSource(root, root)) {
    const text = readFileSync(path);
    if (text.includes(0)) continue;
    files.push({ name: relative(root, path).replaceAll("\\", "/"), text: text.toString("utf8") });
  }
  assert.deepEqual(unexpectedDeploymentHosts(files), []);

  const line = legacyRedirectLine();
  assert.deepEqual(
    unexpectedDeploymentHosts([{ name: "src/app/page.tsx", text: `${line}\n` }]).slice(1),
    [`src/app/page.tsx:1: ${line}`],
  );
  assert.match(
    unexpectedDeploymentHosts([{ name: "next.config.ts", text: `${line}\n${line}\n` }])[0],
    /found 2/,
  );
  const previewLine = `has: [{ type: "host", value: "bank-troof-git-branch-hoonu.${deploymentHost}" }],`;
  assert.deepEqual(
    unexpectedDeploymentHosts([{ name: "next.config.ts", text: `${previewLine}\n` }]).slice(1),
    [`next.config.ts:1: ${previewLine}`],
  );
});

test("preview build does not publish the deployment host", { timeout: 300_000 }, () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const tsconfigPath = join(root, "tsconfig.json");
  const nextEnvPath = join(root, "next-env.d.ts");
  const tsconfig = readFileSync(tsconfigPath);
  const nextEnv = readFileSync(nextEnvPath);
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const key of [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_HUB_URL",
    "NEXT_PUBLIC_FINTWIT_URL",
    "NEXT_PUBLIC_BOT_URL",
  ]) {
    delete env[key];
  }
  env.NEXT_DIST_DIR = distDir;
  env.VERCEL = "1";
  env.VERCEL_ENV = "preview";
  env.VERCEL_URL = `bank-troof-preview.${deploymentHost}`;
  env.VERCEL_BRANCH_URL = `bank-troof-git-preview.${deploymentHost}`;
  env.VERCEL_PROJECT_PRODUCTION_URL = `bank-troof.${deploymentHost}`;

  let build;
  try {
    build = spawnSync("npm", ["run", "build"], {
      cwd: root,
      env,
      encoding: "utf8",
    });
  } finally {
    writeFileSync(tsconfigPath, tsconfig);
    writeFileSync(nextEnvPath, nextEnv);
  }
  assert.equal(
    build.status,
    0,
    `preview build failed\n${build.stdout?.slice(-4000) ?? ""}\n${build.stderr?.slice(-4000) ?? ""}`,
  );

  const dist = join(root, distDir);
  const files = collect(dist);
  const html = files.filter((file) => file.kind === "html");
  const pageData = files.filter((file) => file.kind === "page-data");
  const robots = files.filter((file) => file.kind === "robots");
  const sitemaps = files.filter((file) => file.kind === "sitemap");
  const scripts = files.filter((file) => file.kind === "script");
  assert.ok(html.length > 0, "expected built HTML");
  assert.ok(pageData.some((file) => file.name.endsWith(".rsc")), "expected RSC page data");
  assert.ok(robots.length > 0, "expected robots.txt output");
  assert.ok(sitemaps.length > 0, "expected sitemap output");
  assert.ok(scripts.length > 0, "expected client JS chunks");
  assert.ok(robots.some((file) => file.text.includes(`${SITE_URL}/sitemap.xml`)), "robots sitemap url");
  assert.ok(sitemaps.some((file) => file.text.includes(`${SITE_URL}/about`)), "sitemap about url");

  assert.deepEqual(leaks(files), [], `built output contains ${deploymentHost}`);

  const sampleHtml = html.find((file) => file.text.toLowerCase().includes("</head>"));
  assert.ok(sampleHtml, "expected an HTML document with a head");
  const marker = "</head>";
  const at = sampleHtml.text.toLowerCase().indexOf(marker);
  const bodyMutant: BuiltFile = {
    ...sampleHtml,
    text: `${sampleHtml.text.slice(0, at + marker.length)}<p>https://preview.${deploymentHost}/x</p>${sampleHtml.text.slice(at + marker.length)}`,
  };
  assert.equal(headOf(bodyMutant.text).toLowerCase().includes(deploymentHost), false);
  assert.deepEqual(leaks([bodyMutant]), [sampleHtml.name], "body mutation was not detected");

  for (const kind of ["page-data", "robots", "sitemap", "script"] as const) {
    const target = files.find((file) => file.kind === kind);
    assert.ok(target, kind);
    const mutant: BuiltFile = { ...target, text: `${target.text}\nhttps://preview.${deploymentHost}/x` };
    assert.deepEqual(leaks([mutant]), [target.name], `${kind} mutation was not detected`);
  }

  const checked = new Set<string>();
  for (const file of html) {
    if (!file.name.replaceAll("\\", "/").includes("server/app/")) continue;
    const route = routeFromHtml(file.name);
    const head = headOf(file.text);
    assert.equal(file.text.toLowerCase().includes(deploymentHost), false, file.name);
    if (route === "shell" || route === null) {
      assert.deepEqual(canonicals(head), [], file.name);
      assert.deepEqual(contents(head, "property", "og:url"), [], file.name);
    } else {
      const expected = pageUrl(route);
      assert.deepEqual(canonicals(head), [expected], file.name);
      assert.deepEqual(contents(head, "property", "og:url"), [expected], file.name);
    }
    if (route !== "shell") {
      assert.deepEqual(contents(head, "property", "og:site_name"), ["GradedCalls Analysts"], file.name);
      assert.deepEqual(contents(head, "property", "og:type"), ["website"], file.name);
      assert.deepEqual(contents(head, "property", "og:image"), [SHARE_IMAGE_URL], file.name);
      assert.deepEqual(contents(head, "property", "og:image:type"), ["image/png"], file.name);
      assert.deepEqual(contents(head, "name", "twitter:image"), [SHARE_IMAGE_URL], file.name);
    }
    checked.add(file.name);
  }
  for (const name of ["index.html", "about.html", "banks.html", "methodology.html", "_not-found.html"]) {
    assert.ok([...checked].some((file) => file.endsWith(`/${name}`) || file.endsWith(name)), name);
  }
  assert.ok(html.some((file) => file.text.includes('href="https://www.gradedcalls.com"')), "hub link in built HTML");
});
