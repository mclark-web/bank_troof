/**
 * Measure rendered GC grade-pill contrast on /analysts at 390 and 1440.
 * Prints the minimum contrast ratio for each pill type. Exits 1 below 4.5:1.
 *
 * Usage: node scripts/pill-contrast.mjs http://127.0.0.1:3001/analysts
 */
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const pageUrl = process.argv[2] ?? process.env.PILL_CONTRAST_URL ?? "http://127.0.0.1:3001/analysts";
const widths = [390, 820, 1440];
const types = ["strong", "weak", "provisional", "exit"];
const labels = { strong: "STRONG", weak: "WEAK", provisional: "PROVISIONAL", exit: "EXIT LIQUIDITY" };

function lum(r, g, b) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const hi = Math.max(lum(...a), lum(...b));
  const lo = Math.min(lum(...a), lum(...b));
  return (hi + 0.05) / (lo + 0.05);
}

function parseRgb(value) {
  const match = String(value).match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  return match[1].split(",").slice(0, 3).map((part) => parseFloat(part));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function launchChrome() {
  const profile = mkdtempSync(join(tmpdir(), "pill-contrast-"));
  const chrome = spawn(
    "/usr/bin/google-chrome",
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--no-sandbox",
      "--disable-gpu",
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let log = "";
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Chrome did not open a debugging port")), 15000);
    const onData = (chunk) => {
      log += chunk.toString();
      const match = log.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(Number(match[1]));
      }
    };
    chrome.stdout.on("data", onData);
    chrome.stderr.on("data", onData);
    chrome.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited ${code}`));
    });
  });
  return { chrome, port };
}

async function connect(port) {
  const created = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  const target = await created.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", () => reject(new Error("websocket failed")));
  });
  function send(method, params = {}) {
    const msgId = ++id;
    return new Promise((resolve, reject) => {
      pending.set(msgId, (message) => (message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result)));
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }
  return { ws, send, targetId: target.id, port };
}

async function pixelsOf(send, clip) {
  const shot = await send("Page.captureScreenshot", { format: "png", clip, fromSurface: true });
  const raw = execFileSync("ffmpeg", ["-v", "error", "-f", "image2pipe", "-i", "pipe:0", "-f", "rawvideo", "-pix_fmt", "rgb24", "-vframes", "1", "pipe:1"], {
    input: Buffer.from(shot.data, "base64"),
  });
  const pixels = [];
  for (let i = 0; i < raw.length; i += 3) pixels.push([raw[i], raw[i + 1], raw[i + 2]]);
  return pixels;
}

function interior(pixels, text) {
  const background = pixels.filter((pixel) => {
    const distance = Math.abs(pixel[0] - text[0]) + Math.abs(pixel[1] - text[1]) + Math.abs(pixel[2] - text[2]);
    return distance > 80;
  });
  const sample = background.length ? background : pixels;
  return sample.reduce((acc, pixel) => [acc[0] + pixel[0], acc[1] + pixel[1], acc[2] + pixel[2]], [0, 0, 0]).map((n) => n / sample.length);
}

async function measureBox(send, box, textRgb) {
  const clip = {
    x: Math.max(0, box.x + box.w - 7),
    y: Math.max(0, box.y + box.h / 2 - 1),
    width: 3,
    height: 2,
    scale: 1,
  };
  const pixels = await pixelsOf(send, clip);
  const bg = interior(pixels, textRgb);
  return { ratio: contrast(textRgb, bg), bg: bg.map((n) => Math.round(n)) };
}

const { chrome, port } = await launchChrome();
try {
  const { ws, send, targetId } = await connect(port);
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Page.navigate", { url: pageUrl });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await sleep(250);
    const ready = await send("Runtime.evaluate", {
      expression: "document.querySelectorAll('.gc-grade-tag').length",
      returnByValue: true,
    });
    if (ready.result.value > 0) break;
  }
  await send("Runtime.evaluate", {
    expression: "document.documentElement.style.scrollBehavior = 'auto'",
  });

  const summary = {};
  for (const width of widths) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 800,
    });
    await sleep(300);
    const listed = await send("Runtime.evaluate", {
      expression: `(() => {
        const pills = [...document.querySelectorAll(".gc-grade-tag")];
        return pills.map((el) => {
          const box = el.getBoundingClientRect();
          const top = box.top + window.scrollY;
          return {
            type: ["strong", "weak", "provisional", "exit"].find((name) => el.classList.contains(name)),
            text: el.textContent.trim(),
            color: getComputedStyle(el).color,
            top,
            x: box.x,
            w: box.width,
            h: box.height,
            onTube: Boolean(el.closest(".gc-scale")),
          };
        });
      })()`,
      returnByValue: true,
    });

    const rows = [];
    for (const pill of listed.result.value) {
      await send("Runtime.evaluate", {
        expression: `window.scrollTo({ top: ${Math.max(0, pill.top - 160)}, behavior: "instant" })`,
      });
      await sleep(80);
      const box = await send("Runtime.evaluate", {
        expression: `(() => {
          const el = [...document.querySelectorAll(".gc-grade-tag")].find((node) => Math.abs(node.getBoundingClientRect().top + window.scrollY - ${pill.top}) < 2 && node.textContent.trim() === ${JSON.stringify(pill.text)});
          const rect = el.getBoundingClientRect();
          return { x: rect.x, y: rect.y, w: rect.width, h: rect.height, color: getComputedStyle(el).color };
        })()`,
        returnByValue: true,
      });
      const textRgb = parseRgb(box.result.value.color);
      const measured = await measureBox(send, box.result.value, textRgb);
      rows.push({ type: pill.type, onTube: pill.onTube, ...measured });
    }

    const probe = await send("Runtime.evaluate", {
      expression: `(() => {
        const el = document.querySelector(".gc-scale .gc-grade-tag");
        if (!el) return null;
        el.dataset.contrastOriginalClass = el.className;
        el.dataset.contrastOriginalText = el.textContent;
        return true;
      })()`,
      returnByValue: true,
    });
    if (probe.result.value) {
      for (const type of types) {
        await send("Runtime.evaluate", {
          expression: `(() => {
            const el = document.querySelector(".gc-scale .gc-grade-tag");
            el.className = "gc-grade-tag ${type}";
            el.textContent = ${JSON.stringify(labels[type])};
            el.scrollIntoView({ block: "center", behavior: "instant" });
          })()`,
        });
        await sleep(30);
        const box = await send("Runtime.evaluate", {
          expression: `(() => {
            const el = document.querySelector(".gc-scale .gc-grade-tag");
            const rect = el.getBoundingClientRect();
            return { x: rect.x, y: rect.y, w: rect.width, h: rect.height, color: getComputedStyle(el).color };
          })()`,
          returnByValue: true,
        });
        const textRgb = parseRgb(box.result.value.color);
        const measured = await measureBox(send, box.result.value, textRgb);
        rows.push({ type, onTube: true, probe: true, ...measured });
      }
      await send("Runtime.evaluate", {
        expression: `(() => {
          const el = document.querySelector(".gc-scale .gc-grade-tag");
          el.className = el.dataset.contrastOriginalClass;
          el.textContent = el.dataset.contrastOriginalText;
        })()`,
      });
    }

    summary[width] = {};
    for (const type of types) {
      const ofType = rows.filter((row) => row.type === type);
      const min = ofType.length ? Math.min(...ofType.map((row) => row.ratio)) : null;
      summary[width][type] = min == null ? null : Math.round(min * 100) / 100;
    }
    console.log(JSON.stringify({ width, mins: summary[width], samples: rows.map((row) => ({ type: row.type, onTube: row.onTube, probe: Boolean(row.probe), ratio: Math.round(row.ratio * 100) / 100, bg: row.bg })) }));
  }

  ws.close();
  await fetch(`http://127.0.0.1:${port}/json/close/${targetId}`).catch(() => {});
  const failed = widths.flatMap((width) => types.filter((type) => summary[width][type] != null && summary[width][type] < 4.5).map((type) => `${width} ${type} ${summary[width][type]}`));
  if (failed.length) {
    console.error(failed.join("\n"));
    process.exitCode = 1;
  }
} finally {
  chrome.kill("SIGKILL");
}
