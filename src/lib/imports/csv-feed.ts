import fs from "fs";
import { ratingDirection } from "../scoring";
import { ACTION_LABELS, RATING_LABELS } from "../labels";
import type { CallFeedAdapter, ImportIssue, ImportParseResult, RawCallRecord } from "./types";

const REQUIRED = [
  "call_id",
  "date",
  "bank_slug",
  "bank_name",
  "analyst_slug",
  "analyst_name",
  "ticker",
  "company",
  "sector",
  "action",
  "rating_to",
  "price_at_call",
] as const;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (char !== "\r") cell += char;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((value) => value.trim() !== ""));
}

function num(value: string | undefined): number | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseCallCsv(text: string): ImportParseResult {
  const table = parseCsv(text);
  const issues: ImportIssue[] = [];
  if (table.length === 0) {
    return { records: [], issues: [{ row: 0, message: "CSV was empty." }] };
  }
  const header = table[0].map((column) => column.trim());
  const index = new Map(header.map((column, position) => [column, position]));
  for (const column of REQUIRED) {
    if (!index.has(column)) {
      issues.push({ row: 1, message: `Missing required column ${column}.` });
    }
  }
  if (issues.length > 0) return { records: [], issues };

  const records: RawCallRecord[] = [];
  const seen = new Set<string>();

  table.slice(1).forEach((cells, offset) => {
    const rowNumber = offset + 2;
    const read = (column: string) => {
      const position = index.get(column);
      return position == null ? "" : (cells[position] ?? "").trim();
    };
    const id = read("call_id");
    const ratingTo = read("rating_to");
    const action = read("action");
    const priceAtCall = num(read("price_at_call"));
    const date = read("date");
    const problems: string[] = [];
    if (!id) problems.push("call_id is required");
    if (id && seen.has(id)) problems.push(`duplicate call_id ${id}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) problems.push("date must be YYYY-MM-DD");
    if (!RATING_LABELS[ratingTo] || !ratingDirection(ratingTo)) problems.push(`unknown rating_to ${ratingTo}`);
    if (!ACTION_LABELS[action]) problems.push(`unknown action ${action}`);
    if (priceAtCall == null || priceAtCall <= 0) problems.push("price_at_call must be a positive number");
    for (const column of ["bank_slug", "bank_name", "analyst_slug", "analyst_name", "ticker", "company", "sector"]) {
      if (!read(column)) problems.push(`${column} is required`);
    }
    const ratingFrom = read("rating_from");
    if (ratingFrom && !RATING_LABELS[ratingFrom]) problems.push(`unknown rating_from ${ratingFrom}`);
    if (problems.length > 0) {
      issues.push({ row: rowNumber, message: problems.join("; ") });
      return;
    }
    seen.add(id);
    const ticker = read("ticker").toUpperCase();
    records.push({
      id,
      date,
      bankSlug: read("bank_slug"),
      bankName: read("bank_name"),
      bankShort: read("bank_short") || read("bank_name"),
      headquarters: read("headquarters") || "—",
      analystSlug: read("analyst_slug"),
      analystName: read("analyst_name"),
      analystTitle: read("analyst_title") || "Analyst",
      sector: read("sector"),
      ticker,
      company: read("company"),
      industry: read("industry") || read("sector"),
      exchange: read("exchange") || "—",
      action,
      ratingFrom: ratingFrom || null,
      ratingTo,
      priceTargetFrom: num(read("price_target_from")),
      priceTargetTo: num(read("price_target_to")),
      priceAtCall: priceAtCall as number,
      price30d: num(read("price_30d")),
      price90d: num(read("price_90d")),
      price1y: num(read("price_1y")),
      note: read("note") || "Imported call.",
    });
  });

  return { records, issues };
}

export class CsvCallFeed implements CallFeedAdapter {
  readonly name = "csv";

  constructor(private readonly filePath: string) {}

  async pull(): Promise<RawCallRecord[]> {
    const text = fs.readFileSync(this.filePath, "utf8");
    const parsed = parseCallCsv(text);
    if (parsed.issues.length > 0) {
      const detail = parsed.issues.map((issue) => `row ${issue.row}: ${issue.message}`).join("\n");
      throw new Error(`CSV import failed.\n${detail}`);
    }
    return parsed.records;
  }
}

export class JsonCallFeed implements CallFeedAdapter {
  readonly name = "json";

  constructor(private readonly records: RawCallRecord[]) {}

  async pull(): Promise<RawCallRecord[]> {
    return this.records;
  }
}
