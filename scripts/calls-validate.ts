/**
 * Check the call ledger with the same grade code the site uses.
 * A failure exits 1 before any file is written. This script does not write.
 */
import { readFileSync } from "node:fs";
import {
  CALLS_CSV_PATH,
  CSV_ONLY_COLUMNS,
  collectIssues,
  gradeLabelForScore,
  parseCallLedger,
  readCallsJson,
  renderCallsJson,
  serializeCallCsv,
  UNGRADED_LABEL,
  type CallRow,
} from "./calls-ledger";
import { GC_SCALE_LABEL } from "../src/lib/gc-grade";

function wipeBookkeeping(row: CallRow): CallRow {
  return {
    ...row,
    analyst_name: "",
    firm_name: "",
    company: "",
    status: "open",
    source_url: "https://example.com/wiped",
    alt_source_url: "https://example.com/alt",
    grade_14: "",
    grade_30: "",
    grade_60: "",
    grade_90: "",
    grade_365: "",
    graded_at: "2026-01-01T00:00:00.000Z",
    grade_method: "manual",
    flags: "manual-grade",
    ledger_notes: "wiped",
  };
}

function main() {
  const errors: string[] = [];
  const csvText = readFileSync(CALLS_CSV_PATH, "utf8");
  const jsonText = readCallsJson();
  const rows = parseCallLedger(csvText);
  const issues = collectIssues(rows);
  errors.push(...issues.errors);

  const rendered = renderCallsJson(rows);
  const renderedAgain = renderCallsJson(parseCallLedger(serializeCallCsv(rows)));
  if (rendered !== renderedAgain) errors.push("exporting the CSV twice was not byte-identical");
  if (rendered !== jsonText) errors.push("data/calls/calls.json is not the export of calls.csv");

  const wiped = rows.map(wipeBookkeeping);
  if (renderCallsJson(wiped) !== rendered) {
    errors.push("bookkeeping columns changed the exported JSON");
  }

  const parsed = JSON.parse(rendered) as Array<Record<string, unknown>>;
  for (const call of parsed) {
    for (const column of CSV_ONLY_COLUMNS) {
      if (column in call) errors.push(`exported JSON includes CSV-only column ${column}`);
    }
    if ("data_source" in call) errors.push("exported JSON includes data_source; the seed field is source");
    if (call.source === "verified") errors.push(`${String(call.id)}: exported source is verified`);
  }

  const demo = rows.filter((row) => row.data_source === "demo").length;
  const licensed = rows.filter((row) => row.data_source === "licensed").length;
  const open = rows.filter((row) => row.status === "open").length;
  const graded = rows.filter((row) => row.status === "graded").length;
  const verified = rows.filter((row) => row.status === "verified").length;
  let ungradedHorizons = 0;
  let exitHorizons = 0;
  for (const row of rows) {
    for (const column of ["grade_14", "grade_30", "grade_60", "grade_90", "grade_365"] as const) {
      if (row[column] === UNGRADED_LABEL) ungradedHorizons += 1;
      if (row[column] === "EXIT LIQUIDITY") exitHorizons += 1;
    }
  }

  console.log(`rows: ${rows.length}`);
  console.log(`data_source demo: ${demo}`);
  console.log(`data_source licensed: ${licensed}`);
  console.log(`status open: ${open}`);
  console.log(`status graded: ${graded}`);
  console.log(`status verified: ${verified}`);
  console.log(`horizons labelled ${UNGRADED_LABEL}: ${ungradedHorizons}`);
  console.log(`horizons labelled EXIT LIQUIDITY: ${exitHorizons}`);
  console.log(`scale label: ${GC_SCALE_LABEL}`);
  console.log(`graded 0 label: ${gradeLabelForScore(0, true)}`);
  console.log(`69.9 label: ${gradeLabelForScore(69.9, true)}`);
  console.log(`json derived from csv: ${rendered === jsonText ? "byte-identical" : "MISMATCH"}`);
  console.log(`bookkeeping stays csv-only: ${renderCallsJson(wiped) === rendered ? "yes" : "MISMATCH"}`);
  console.log(`idempotent export: ${rendered === renderedAgain ? "byte-identical" : "MISMATCH"}`);
  for (const warning of issues.warnings) console.log(`WARN ${warning}`);
  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR ${error}`);
    process.exit(1);
  }
  console.log("OK");
}

main();
