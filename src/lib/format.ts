import { maintainsDesk, ratingLabel } from "./labels";

export function pct(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return "—";
  const scaled = value * 100;
  const sign = scaled > 0 ? "+" : "";
  return `${sign}${scaled.toFixed(digits)}%`;
}

export function pctUnsigned(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function scoreText(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return String(Math.round(value));
}

export function usd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function returnTone(value: number | null | undefined): string {
  if (value == null || Math.abs(value) < 0.0005) return "text-muted";
  return value > 0 ? "text-hit" : "text-miss";
}

export function callHeadline(input: {
  action: string;
  symbol: string;
  ratingTo: string;
}): string {
  const { action, symbol, ratingTo } = input;
  const desk = ratingLabel(ratingTo);
  switch (action) {
    case "initiate":
      return `initiated ${symbol} at ${desk}`;
    case "upgrade":
      return `upgraded ${symbol} to ${desk}`;
    case "downgrade":
      return `downgraded ${symbol} to ${desk}`;
    case "target_raise":
      return `raised the ${symbol} target`;
    case "target_cut":
      return `cut the ${symbol} target`;
    default:
      return maintainsDesk(ratingTo) ? `maintained ${desk} on ${symbol}` : `reiterated ${desk} on ${symbol}`;
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function avatarColor(seed: string): string {
  const palette = ["#3d4f45", "#4a3f36", "#3a4454", "#4e3d42", "#3f4633", "#3e3a4e"];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}
