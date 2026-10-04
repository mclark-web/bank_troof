/**
 * Analyst call ledger. data/calls/calls.csv is the source of truth.
 * The exporter writes data/calls/calls.json in the shape the seed loads.
 * Grade labels, flags, and source URLs stay in the CSV. The site still
 * computes each grade when a page renders.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ANALYSTS, BANKS, TICKERS } from "../prisma/universe";
import { GC_GRADE_LABEL, GC_PROVISIONAL_LINE, GC_SCALE_LABEL, GC_STRONG_LINE, readCalibration } from "../src/lib/gc-grade";
import { ACTION_LABELS, RATING_LABELS } from "../src/lib/labels";
import { filedEntryPrint, pricesForStoredCall, QUOTE_AS_OF } from "../src/lib/quotes";
import { gradeCall, HORIZON_KEYS, type HorizonKey } from "../src/lib/scoring";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const CALLS_CSV_PATH = join(ROOT, "data/calls/calls.csv");
export const CALLS_JSON_PATH = join(ROOT, "data/calls/calls.json");

export const UNGRADED_LABEL = "Not graded yet";

/** Same plausible band the demo generator enforced before the ledger took over. */
export const DEMO_TARGET_BAND = { min: 0.5, max: 1.6 };

export const CSV_COLUMNS = [
  "call_id",
  "data_source",
  "status",
  "analyst_slug",
  "analyst_name",
  "firm_slug",
  "firm_name",
  "ticker",
  "company",
  "call_date",
  "action",
  "rating_from",
  "rating_to",
  "price_target_from",
  "price_target_to",
  "price_at_call",
  "source_url",
  "alt_source_url",
  "price_14d",
  "price_30d",
  "price_60d",
  "price_90d",
  "price_1y",
  "grade_14",
  "grade_30",
  "grade_60",
  "grade_90",
  "grade_365",
  "note",
  "controversial",
  "controversial_reason",
  "graded_at",
  "grade_method",
  "flags",
  "ledger_notes",
  "export_index",
] as const;

/**
 * Not written to calls.json. `data_source` is written as `source`.
 * `export_index` is omitted from the JSON and only orders the array.
 */
export const CSV_ONLY_COLUMNS = [
  "analyst_name",
  "firm_name",
  "company",
  "status",
  "source_url",
  "alt_source_url",
  "grade_14",
  "grade_30",
  "grade_60",
  "grade_90",
  "grade_365",
  "graded_at",
  "grade_method",
  "flags",
  "ledger_notes",
  "export_index",
] as const;

export const DATA_SOURCES = ["demo", "licensed"] as const;
export const STATUSES = ["open", "graded", "verified"] as const;
export const KNOWN_FLAGS = ["raw-close", "horizon-open", "controversial", "no-source-url"] as const;

const HORIZON_PRICE: Record<HorizonKey, CsvColumn> = {
  "14": "price_14d",
  "30": "price_30d",
  "60": "price_60d",
  "90": "price_90d",
  "365": "price_1y",
};

const HORIZON_GRADE: Record<HorizonKey, CsvColumn> = {
  "14": "grade_14",
  "30": "grade_30",
  "60": "grade_60",
  "90": "grade_90",
  "365": "grade_365",
};

const BANNED_COPY = /chad|chud|charoof/i;
const BANNED_SOURCE = /tipranks|bloomberg|(?:^|\/\/|\.)x\.com|twitter\.com/i;

export type CsvColumn = (typeof CSV_COLUMNS)[number];
export type CallRow = Record<CsvColumn, string>;

export type ExportedCall = {
  id: string;
  analystId: string;
  bankId: string;
  tickerId: string;
  callDate: string;
  action: string;
  ratingFrom: string | null;
  ratingTo: string;
  priceTargetFrom: number | null;
  priceTargetTo: number | null;
  priceAtCall: number;
  price14d: number | null;
  price30d: number | null;
  price60d: number | null;
  price90d: number | null;
  price1y: number | null;
  note: string;
  controversial: boolean;
  controversialReason: string | null;
  source: string;
};

export type LedgerIssues = {
  errors: string[];
  warnings: string[];
};

export function gradeLabelForScore(score: number | null, gradeable: boolean): string {
  if (!gradeable || score == null || Number.isNaN(score)) return UNGRADED_LABEL;
  return GC_GRADE_LABEL[readCalibration(score, true).id];
}

export function parseNumber(value: string): number | null {
  if (value === "") return null;
  if (!/^-?\d+(\.\d+)?$/.test(value)) return null;
  return Number(value);
}

export function formatNumber(value: number): string {
  return JSON.stringify(value);
}

function sameNumber(left: number | null, right: number | null): boolean {
  if (left == null || right == null) return left == null && right == null;
  return Object.is(left, right);
}

export function expectedGrade(row: CallRow, horizon: HorizonKey): string {
  const priceAtCall = parseNumber(row.price_at_call);
  if (priceAtCall == null || priceAtCall <= 0) return UNGRADED_LABEL;
  const grade = gradeCall(
    {
      ratingTo: row.rating_to,
      priceAtCall,
      priceTargetTo: parseNumber(row.price_target_to),
      outcomePrice: parseNumber(row[HORIZON_PRICE[horizon]]),
    },
    horizon,
  );
  return gradeLabelForScore(grade.score, grade.gradeable);
}

/** `open` when every horizon price is blank. Otherwise `graded`. */
export function expectedStatus(row: CallRow): "open" | "graded" {
  const anyPrice = HORIZON_KEYS.some((horizon) => parseNumber(row[HORIZON_PRICE[horizon]]) != null);
  return anyPrice ? "graded" : "open";
}

/** Flags in canonical order. Derived, so the column cannot drift from the row. */
export function expectedFlags(row: CallRow): string {
  const flags: string[] = [];
  if (/^\d{4}-\d{2}-\d{2}$/.test(row.call_date)) {
    const filed = filedEntryPrint(row.analyst_slug, row.ticker, new Date(`${row.call_date}T00:00:00.000Z`));
    if (filed != null) flags.push("raw-close");
  }
  if (HORIZON_KEYS.some((horizon) => expectedGrade(row, horizon) === UNGRADED_LABEL)) flags.push("horizon-open");
  if (row.controversial === "true") flags.push("controversial");
  if (row.source_url.trim() === "") flags.push("no-source-url");
  return flags.join(";");
}

export function toExportedCall(row: CallRow): ExportedCall {
  const callDate = `${row.call_date}T00:00:00.000Z`;
  return {
    id: row.call_id,
    analystId: row.analyst_slug,
    bankId: row.firm_slug,
    tickerId: row.ticker,
    callDate,
    action: row.action,
    ratingFrom: row.rating_from === "" ? null : row.rating_from,
    ratingTo: row.rating_to,
    priceTargetFrom: parseNumber(row.price_target_from),
    priceTargetTo: parseNumber(row.price_target_to),
    priceAtCall: parseNumber(row.price_at_call) ?? 0,
    price14d: parseNumber(row.price_14d),
    price30d: parseNumber(row.price_30d),
    price60d: parseNumber(row.price_60d),
    price90d: parseNumber(row.price_90d),
    price1y: parseNumber(row.price_1y),
    note: row.note,
    controversial: row.controversial === "true",
    controversialReason: row.controversial_reason === "" ? null : row.controversial_reason,
    source: row.data_source,
  };
}

export function renderCallsJson(rows: CallRow[]): string {
  const ordered = rows.slice().sort((a, b) => Number(a.export_index) - Number(b.export_index));
  return `${JSON.stringify(ordered.map(toExportedCall), null, 2)}\n`;
}

export type CoverageRow = { analystId: string; tickerId: string };

/** Analyst order from the universe, then any later slug. Tickers follow first-seen call order. */
export function coverageFromCalls(calls: readonly { analystId: string; tickerId: string }[]): CoverageRow[] {
  const order = ANALYSTS.map((analyst) => analyst.slug);
  for (const call of calls) {
    if (!order.includes(call.analystId)) order.push(call.analystId);
  }
  return order.flatMap((analystId) => {
    const seen: string[] = [];
    for (const call of calls) {
      if (call.analystId !== analystId) continue;
      if (!seen.includes(call.tickerId)) seen.push(call.tickerId);
    }
    return seen.map((tickerId) => ({ analystId, tickerId }));
  });
}

function escapeField(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export function serializeCallCsv(rows: CallRow[]): string {
  const ordered = rows.slice().sort((a, b) => (a.call_id < b.call_id ? -1 : a.call_id > b.call_id ? 1 : 0));
  const lines = [CSV_COLUMNS.join(",")];
  for (const row of ordered) lines.push(CSV_COLUMNS.map((column) => escapeField(row[column])).join(","));
  return `${lines.join("\n")}\n`;
}

/** RFC 4180 records. A trailing newline does not create an extra row. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  while (i < text.length) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }
    if (char === '"') {
      quoted = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length > 0 && rows[rows.length - 1].every((cell) => cell === "")) rows.pop();
  return rows;
}

export function parseCallLedger(text: string): CallRow[] {
  const table = parseCsv(text);
  if (table.length === 0) throw new Error("calls.csv is empty");
  const header = table[0].join(",");
  const expected = CSV_COLUMNS.join(",");
  if (header !== expected) throw new Error(`calls.csv header must be ${expected}`);
  return table.slice(1).map((cells, index) => {
    if (cells.length !== CSV_COLUMNS.length) {
      throw new Error(`calls.csv row ${index + 2} has ${cells.length} columns, expected ${CSV_COLUMNS.length}`);
    }
    const row = {} as CallRow;
    CSV_COLUMNS.forEach((column, columnIndex) => {
      row[column] = cells[columnIndex] ?? "";
    });
    return row;
  });
}

function validCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function rowLabel(row: CallRow, index: number): string {
  return row.call_id || `row ${index + 2}`;
}

/** Non-empty source fields must be a real http(s) URL. Localhost is not a source. */
function sourceUrlProblem(value: string): string | null {
  if (value.trim() === "") return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "must be an http(s) URL that is not localhost";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "must be an http(s) URL that is not localhost";
  }
  const host = parsed.hostname.replace(/\.$/, "").toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1") {
    return "must be an http(s) URL that is not localhost";
  }
  return null;
}

function demoPriceError(row: CallRow, label: string): string | null {
  if (!validCalendarDate(row.call_date)) return null;
  const callDate = new Date(`${row.call_date}T00:00:00.000Z`);
  let expected: ReturnType<typeof pricesForStoredCall>;
  try {
    expected = pricesForStoredCall(row.analyst_slug, row.ticker, callDate);
  } catch (error) {
    const message = error instanceof Error ? error.message : "no price";
    return `${label}: demo price is not in the adjusted-close series (${message})`;
  }
  const pairs: Array<[CsvColumn, number | null]> = [
    ["price_at_call", expected.priceAtCall],
    ["price_14d", expected.price14d],
    ["price_30d", expected.price30d],
    ["price_60d", expected.price60d],
    ["price_90d", expected.price90d],
    ["price_1y", expected.price1y],
  ];
  for (const [column, value] of pairs) {
    const actual = parseNumber(row[column]);
    if (row[column] !== "" && actual == null) return null;
    if (!sameNumber(actual, value)) {
      return `${label}: ${column} is ${row[column] || "(blank)"} and the series has ${value == null ? "no print" : formatNumber(value)}. Refusing to invent a price.`;
    }
  }
  return null;
}

/** Bands, the scale label, and the ungraded wording. These are the display rules. */
export function gradeRuleErrors(): string[] {
  const errors: string[] = [];
  if (GC_SCALE_LABEL !== "GC Scale") errors.push(`scale label must be "GC Scale", found ${GC_SCALE_LABEL}`);
  if (UNGRADED_LABEL !== "Not graded yet") errors.push(`ungraded copy must be "Not graded yet"`);
  if (GC_STRONG_LINE !== 70 || GC_PROVISIONAL_LINE !== 40) {
    errors.push(`grade lines must be 70 and 40, found ${GC_STRONG_LINE} and ${GC_PROVISIONAL_LINE}`);
  }
  const bands: Array<[number, boolean, string]> = [
    [70, true, "STRONG"],
    [100, true, "STRONG"],
    [69.9, true, "PROVISIONAL"],
    [40, true, "PROVISIONAL"],
    [39.9, true, "WEAK"],
    [0.4, true, "WEAK"],
    [0, true, "EXIT LIQUIDITY"],
  ];
  for (const [score, gradeable, name] of bands) {
    const label = gradeLabelForScore(score, gradeable);
    if (label !== name) errors.push(`gradeLabelForScore(${score}) must be ${name}, found ${label}`);
  }
  if (gradeLabelForScore(null, false) !== UNGRADED_LABEL) {
    errors.push("an ungraded window must read Not graded yet");
  }
  const miss = gradeCall({ ratingTo: "buy", priceAtCall: 100, priceTargetTo: 130, outcomePrice: 90 }, "90");
  if (miss.score !== 0 || gradeLabelForScore(miss.score, miss.gradeable) !== "EXIT LIQUIDITY") {
    errors.push("a graded 0 must be EXIT LIQUIDITY");
  }
  const open = gradeCall({ ratingTo: "buy", priceAtCall: 100, priceTargetTo: 110, outcomePrice: null }, "90");
  if (open.gradeable || gradeLabelForScore(open.score, open.gradeable) !== UNGRADED_LABEL) {
    errors.push("a horizon with no price must stay Not graded yet");
  }
  for (const label of [GC_SCALE_LABEL, UNGRADED_LABEL, ...Object.values(GC_GRADE_LABEL)]) {
    if (BANNED_COPY.test(label)) errors.push(`grade copy contains a banned word: ${label}`);
  }
  return errors;
}

export function collectIssues(rows: CallRow[]): LedgerIssues {
  const errors: string[] = [...gradeRuleErrors()];
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  const indexes = new Set<number>();
  const analystBySlug = new Map(ANALYSTS.map((analyst) => [analyst.slug, analyst]));
  const bankBySlug = new Map(BANKS.map((bank) => [bank.slug, bank]));
  const tickerBySymbol = new Map(TICKERS.map((ticker) => [ticker.symbol, ticker]));

  const sorted = rows.map((row) => row.call_id);
  const ordered = sorted.slice().sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  if (sorted.some((id, index) => id !== ordered[index])) errors.push("calls.csv must be sorted by call_id");

  rows.forEach((row, index) => {
    const label = rowLabel(row, index);
    if (!DATA_SOURCES.includes(row.data_source as (typeof DATA_SOURCES)[number])) {
      errors.push(`${label}: data_source must be ${DATA_SOURCES.join(" or ")}`);
    }
    if (row.data_source === "demo" && row.status === "verified") {
      errors.push(`${label}: demo rows cannot be labelled verified`);
    }
    if (!STATUSES.includes(row.status as (typeof STATUSES)[number])) {
      errors.push(`${label}: status must be ${STATUSES.join(", ")}`);
    } else if (row.status !== "verified" && row.status !== expectedStatus(row)) {
      errors.push(`${label}: status must be ${expectedStatus(row)}`);
    } else if (row.status === "verified" && row.data_source !== "licensed") {
      errors.push(`${label}: only a licensed row can be labelled verified`);
    }
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(row.call_id)) errors.push(`${label}: call_id is not a stable id`);
    if (seenIds.has(row.call_id)) errors.push(`${label}: duplicate call_id`);
    else if (row.call_id) seenIds.add(row.call_id);

    if (!validCalendarDate(row.call_date)) errors.push(`${label}: call_date must be YYYY-MM-DD`);
    else if (row.call_date > QUOTE_AS_OF) {
      errors.push(`${label}: call_date is after the price history (${QUOTE_AS_OF})`);
    }
    if (!ACTION_LABELS[row.action]) errors.push(`${label}: unknown action ${row.action}`);
    if (!RATING_LABELS[row.rating_to]) errors.push(`${label}: unknown rating_to ${row.rating_to}`);
    if (row.rating_from !== "" && !RATING_LABELS[row.rating_from]) {
      errors.push(`${label}: unknown rating_from ${row.rating_from}`);
    }
    const priceAtCall = parseNumber(row.price_at_call);
    if (row.price_at_call !== "" && priceAtCall == null) errors.push(`${label}: price_at_call is not a decimal`);
    if (priceAtCall == null || priceAtCall <= 0) errors.push(`${label}: price_at_call must be a positive number`);
    for (const column of ["price_target_from", "price_target_to", ...Object.values(HORIZON_PRICE)] as CsvColumn[]) {
      if (row[column] !== "" && parseNumber(row[column]) == null) errors.push(`${label}: ${column} is not a decimal`);
    }
    if (row.controversial !== "true" && row.controversial !== "false") {
      errors.push(`${label}: controversial must be true or false`);
    }
    if (row.grade_method !== "computed") errors.push(`${label}: grade_method must be computed`);
    if (row.graded_at !== "" && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(row.graded_at)) {
      errors.push(`${label}: graded_at must be an ISO timestamp when set`);
    }
    const exportIndex = Number(row.export_index);
    if (!/^(0|[1-9]\d*)$/.test(row.export_index) || indexes.has(exportIndex)) {
      errors.push(`${label}: export_index must be a unique integer`);
    } else indexes.add(exportIndex);

    for (const horizon of HORIZON_KEYS) {
      const column = HORIZON_GRADE[horizon];
      const expected = expectedGrade(row, horizon);
      if (row[column] !== expected) errors.push(`${label}: ${column} must be ${expected}`);
    }
    const flags = expectedFlags(row);
    if (row.flags !== flags) errors.push(`${label}: flags must be ${flags || "(none)"}`);
    for (const flag of row.flags.split(";").filter(Boolean)) {
      if (!KNOWN_FLAGS.includes(flag as (typeof KNOWN_FLAGS)[number])) errors.push(`${label}: unknown flag ${flag}`);
    }
    if (row.status === "open") {
      for (const horizon of HORIZON_KEYS) {
        if (row[HORIZON_GRADE[horizon]] !== UNGRADED_LABEL) {
          errors.push(`${label}: an open call must read ${UNGRADED_LABEL} on every horizon`);
        }
      }
    }

    const copy = [row.note, row.controversial_reason, row.ledger_notes, row.analyst_name, row.firm_name, row.company];
    for (const text of copy) {
      if (BANNED_COPY.test(text)) errors.push(`${label}: user-facing text contains a banned word`);
    }
    for (const column of ["source_url", "alt_source_url"] as const) {
      const url = row[column];
      const problem = sourceUrlProblem(url);
      if (problem) errors.push(`${label}: ${column} ${problem}`);
      else if (url && BANNED_SOURCE.test(url)) {
        errors.push(`${label}: source URL is a rankings site, a wire, or X. Those are not collected.`);
      }
    }
    if (row.data_source === "licensed" && row.source_url.trim() === "") {
      errors.push(`${label}: a licensed row needs a source_url`);
    }
    if (row.data_source === "licensed" || row.status === "verified") {
      for (const column of ["note", "controversial_reason", "ledger_notes"] as const) {
        if (row[column].includes("Demo")) {
          errors.push(`${label}: a licensed or verified row cannot contain Demo in ${column}`);
        }
      }
    }

    const analyst = analystBySlug.get(row.analyst_slug);
    const bank = bankBySlug.get(row.firm_slug);
    const ticker = tickerBySymbol.get(row.ticker);
    if (!analyst) errors.push(`${label}: analyst_slug is not in the universe`);
    if (!bank) errors.push(`${label}: firm_slug is not in the universe`);
    if (!ticker) errors.push(`${label}: ticker is not in the universe`);
    if (row.data_source === "demo") {
      if (analyst && analyst.name !== row.analyst_name) errors.push(`${label}: analyst_name does not match the universe`);
      if (analyst && analyst.bankSlug !== row.firm_slug) errors.push(`${label}: firm_slug does not match the analyst's firm`);
      if (bank && bank.name !== row.firm_name) errors.push(`${label}: firm_name does not match the universe`);
      if (ticker && ticker.name !== row.company) errors.push(`${label}: company does not match the universe`);
      const priceError = demoPriceError(row, label);
      if (priceError) errors.push(priceError);
      const target = parseNumber(row.price_target_to);
      if (priceAtCall != null && priceAtCall > 0 && target != null) {
        const multiple = target / priceAtCall;
        if (multiple < DEMO_TARGET_BAND.min || multiple > DEMO_TARGET_BAND.max) {
          errors.push(`${label}: demo target ${target} is outside the plausible band around ${priceAtCall}`);
        }
      }
    }
  });

  for (let index = 0; index < rows.length; index += 1) {
    if (!indexes.has(index)) errors.push(`export_index is missing ${index}`);
  }

  const groups = new Map<string, CallRow[]>();
  for (const row of rows) {
    const key = [row.analyst_slug, row.ticker, row.call_date].join("|");
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    const ids = new Set(group.map((row) => row.call_id));
    if (ids.size < 2) continue;
    warnings.push(
      `near-duplicate ${group[0].analyst_name || group[0].analyst_slug} · ${group[0].ticker} · ${group[0].call_date}: ${[...ids].join(", ")}`,
    );
  }
  warnings.sort();
  return { errors, warnings };
}

export function readCallsJson(): string {
  return readFileSync(CALLS_JSON_PATH, "utf8");
}

export function readExportedCalls(): ExportedCall[] {
  return JSON.parse(readCallsJson()) as ExportedCall[];
}

export function assertLedgerInSync(): CallRow[] {
  const csvText = readFileSync(CALLS_CSV_PATH, "utf8");
  const jsonText = readCallsJson();
  const rows = parseCallLedger(csvText);
  const issues = collectIssues(rows);
  if (issues.errors.length > 0) {
    throw new Error(`Call ledger failed validation.\n${issues.errors.join("\n")}`);
  }
  const rendered = renderCallsJson(rows);
  if (rendered !== jsonText) {
    throw new Error("data/calls/calls.json is not the export of data/calls/calls.csv");
  }
  return rows;
}
