/**
 * Rebind every row's prices to the current adjusted-close series and recompute
 * status, horizon grades, and flags. Run after refreshing src/lib/adjusted-closes.json.
 * Dry-run by default. --write rewrites data/calls/calls.csv.
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
  CALLS_CSV_PATH,
  expectedFlags,
  expectedGrade,
  expectedStatus,
  formatNumber,
  parseCallLedger,
  serializeCallCsv,
  type CallRow,
} from "./calls-ledger";
import { pricesForStoredCall } from "../src/lib/quotes";
import { HORIZON_KEYS } from "../src/lib/scoring";

const write = process.argv.includes("--write");
const rows = parseCallLedger(readFileSync(CALLS_CSV_PATH, "utf8"));
const cols = [
  ["price_at_call", "priceAtCall"],
  ["price_14d", "price14d"],
  ["price_30d", "price30d"],
  ["price_60d", "price60d"],
  ["price_90d", "price90d"],
  ["price_1y", "price1y"],
] as const;
const gradeCols = { "14": "grade_14", "30": "grade_30", "60": "grade_60", "90": "grade_90", "365": "grade_365" } as Record<string, keyof CallRow>;
let changed = 0;
const out = rows.map((row) => {
  const next: CallRow = { ...row };
  const prices = pricesForStoredCall(row.analyst_slug, row.ticker, new Date(`${row.call_date}T00:00:00.000Z`));
  for (const [col, key] of cols) {
    const v = prices[key];
    (next as Record<string, string>)[col] = v == null ? "" : formatNumber(v);
  }
  for (const h of HORIZON_KEYS) (next as Record<string, string>)[gradeCols[h] as string] = expectedGrade(next, h);
  if (next.status !== "verified") next.status = expectedStatus(next);
  next.flags = expectedFlags(next);
  const diffs = (Object.keys(row) as (keyof CallRow)[]).filter((k) => row[k] !== next[k]);
  if (diffs.length) {
    changed += 1;
    console.log(`${row.call_id} ${row.ticker} ${row.call_date}: ` + diffs.map((k) => `${k} ${row[k] || "(blank)"} -> ${next[k] || "(blank)"}`).join("; "));
  }
  return next;
});
console.log(`${changed} of ${rows.length} rows change`);
if (write) {
  writeFileSync(CALLS_CSV_PATH, serializeCallCsv(out));
  console.log(`Wrote ${CALLS_CSV_PATH}`);
}
