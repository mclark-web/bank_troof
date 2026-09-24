import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";

const port = 3011;
const url = `http://127.0.0.1:${port}/analysts`;

async function waitForAnalysts(): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (response.ok && (await response.text()).includes("gc-grade-tag")) return;
    } catch {
      // The dev server is still booting or compiling this route.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Analysts page did not become ready");
}

function stopServer(server: ReturnType<typeof spawn>) {
  const pid = server.pid;
  if (!pid) return;
  for (const signal of ["SIGTERM", "SIGKILL"] as const) {
    try {
      process.kill(-pid, signal);
    } catch {
      try {
        server.kill(signal);
      } catch {
        // The dev server has already exited.
      }
    }
  }
}

test("grade pill and label contrast is at least 4.5:1 at 390, 820, and 1440", { timeout: 180000 }, async () => {
  const server = spawn("npx", ["next", "dev", "--port", String(port)], {
    cwd: process.cwd(),
    stdio: "ignore",
    detached: true,
  });
  let output = "";
  try {
    await waitForAnalysts();
    output = await new Promise((resolve, reject) => {
      const child = spawn("node", ["scripts/pill-contrast.mjs", url], { cwd: process.cwd() });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("exit", (code) => {
        if (code === 0) resolve(stdout);
        else reject(new Error(`${stderr}\n${stdout}`));
      });
    });
    const lines = output.trim().split("\n").map((line) => JSON.parse(line) as { width: number; mins: Record<string, number> });
    assert.deepEqual(lines.map((line) => line.width), [390, 820, 1440]);
    for (const line of lines) {
      for (const type of ["strong", "weak", "provisional", "exit", "label"]) {
        assert.ok(line.mins[type] >= 4.5, `${line.width} ${type} ${line.mins[type]}`);
      }
    }
    console.log(lines.map((line) => `${line.width} ${JSON.stringify(line.mins)}`).join("\n"));
  } finally {
    stopServer(server);
  }
});
