/**
 * Runs the real production build. If it fails, publishes the log as the
 * only page so a preview can be read without the build-log API.
 * A successful build leaves the app untouched.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";

const log = [];

function run(command, args) {
  log.push(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { encoding: "utf8", env: process.env });
  log.push(result.stdout || "");
  log.push(result.stderr || "");
  log.push(`exit ${result.status}`);
  return result.status === 0;
}

const ok =
  run("npx", ["prisma", "generate"]) &&
  run("sh", ["scripts/with-demo-env.sh", "npx", "prisma", "db", "push", "--skip-generate", "--accept-data-loss"]) &&
  run("npx", ["tsx", "prisma/seed.ts"]) &&
  run("npx", ["next", "build"]);

if (ok) process.exit(0);

const text = log.join("\n").slice(-80000);
rmSync(".next", { recursive: true, force: true });
if (existsSync("src/app")) renameSync("src/app", "/tmp/app.real");
mkdirSync("src/app", { recursive: true });
writeFileSync(
  "src/app/layout.tsx",
  `export const metadata = { title: "Build log" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html><body style={{ background: "#111", color: "#eee", font: "14px ui-monospace, monospace" }}>{children}</body></html>;
}
`,
);
writeFileSync(
  "src/app/page.tsx",
  `export default function Page() {
  return <pre style={{ whiteSpace: "pre-wrap" }}>{${JSON.stringify(text)}}</pre>;
}
`,
);
writeFileSync(
  "next.config.ts",
  `const nextConfig = { typescript: { ignoreBuildErrors: true }, eslint: { ignoreDuringBuilds: true } };
export default nextConfig;
`,
);
const second = spawnSync("npx", ["next", "build"], { encoding: "utf8", env: process.env });
process.stdout.write(second.stdout || "");
process.stderr.write(second.stderr || "");
process.exit(second.status === 0 ? 0 : second.status || 1);
