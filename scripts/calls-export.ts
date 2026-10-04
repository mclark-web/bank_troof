/**
 * Regenerate data/calls/calls.json from data/calls/calls.csv.
 * Banks, analysts, and tickers stay in prisma/universe.ts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { CALLS_CSV_PATH, CALLS_JSON_PATH, collectIssues, parseCallLedger, renderCallsJson } from "./calls-ledger";

const csv = readFileSync(CALLS_CSV_PATH, "utf8");
const rows = parseCallLedger(csv);
const issues = collectIssues(rows);
for (const warning of issues.warnings) console.warn(`WARN ${warning}`);
if (issues.errors.length > 0) {
  for (const error of issues.errors) console.error(`ERROR ${error}`);
  console.error(`Refusing to write ${CALLS_JSON_PATH}`);
  process.exit(1);
}

const json = renderCallsJson(rows);
writeFileSync(CALLS_JSON_PATH, json);
console.log(`Wrote ${rows.length} calls to data/calls/calls.json`);
