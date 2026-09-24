import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

export function findChrome() {
  if (process.env.PILL_CONTRAST_CHROME === "") return null;
  if (process.env.PILL_CONTRAST_CHROME) {
    return existsSync(process.env.PILL_CONTRAST_CHROME) ? process.env.PILL_CONTRAST_CHROME : null;
  }
  const candidates = ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  for (const name of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    try {
      const found = execFileSync("which", [name], { encoding: "utf8" }).trim();
      if (found) return found;
    } catch {
      // This name is not on PATH.
    }
  }
  return null;
}

export function findFfmpeg() {
  if (process.env.PILL_CONTRAST_FFMPEG === "") return null;
  try {
    const found = execFileSync("which", ["ffmpeg"], { encoding: "utf8" }).trim();
    return found || null;
  } catch {
    return null;
  }
}

/**
 * Null when the contrast check can run. Otherwise a sentence naming what is missing.
 * @param {{ websocket?: boolean, chrome?: string | null, ffmpeg?: string | null }} [probe]
 */
export function contrastBlocker(probe = {}) {
  const websocket = probe.websocket ?? typeof WebSocket !== "undefined";
  const chrome = Object.prototype.hasOwnProperty.call(probe, "chrome") ? probe.chrome : findChrome();
  const ffmpeg = Object.prototype.hasOwnProperty.call(probe, "ffmpeg") ? probe.ffmpeg : findFfmpeg();
  const missing = [];
  if (!websocket) missing.push("a global WebSocket (Node 22 or newer)");
  if (!chrome) missing.push("Chrome");
  if (!ffmpeg) missing.push("ffmpeg");
  if (!missing.length) return null;
  return `Skipping pill contrast: missing ${missing.join(", ")}. This check is optional. npm test passes without it.`;
}
