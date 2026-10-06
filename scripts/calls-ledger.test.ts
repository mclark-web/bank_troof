import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { GC_SCALE_LABEL } from "../src/lib/gc-grade";
import { pricesForCall, QUOTE_AS_OF } from "../src/lib/quotes";
import { gradeCall } from "../src/lib/scoring";
import {
  CALLS_CSV_PATH,
  CALLS_JSON_PATH,
  CSV_ONLY_COLUMNS,
  collectIssues,
  coverageFromCalls,
  expectedFlags,
  expectedGrade,
  expectedStatus,
  formatNumber,
  gradeLabelForScore,
  gradeRuleErrors,
  parseCallLedger,
  renderCallsJson,
  serializeCallCsv,
  toExportedCall,
  UNGRADED_LABEL,
  type CallRow,
} from "./calls-ledger";

describe("grade rules", () => {
  it("keeps the GC Scale bands and the ungraded wording", () => {
    assert.equal(GC_SCALE_LABEL, "GC Scale");
    assert.equal(UNGRADED_LABEL, "Not graded yet");
    assert.deepEqual(gradeRuleErrors(), []);
    assert.equal(gradeLabelForScore(70, true), "STRONG");
    assert.equal(gradeLabelForScore(69.9, true), "PROVISIONAL");
    assert.equal(gradeLabelForScore(40, true), "PROVISIONAL");
    assert.equal(gradeLabelForScore(39.9, true), "WEAK");
    assert.equal(gradeLabelForScore(0, true), "EXIT LIQUIDITY");
    assert.equal(gradeLabelForScore(null, false), "Not graded yet");
    const miss = gradeCall({ ratingTo: "buy", priceAtCall: 100, priceTargetTo: 130, outcomePrice: 90 }, "90");
    assert.equal(miss.score, 0);
    assert.equal(gradeLabelForScore(miss.score, miss.gradeable), "EXIT LIQUIDITY");
    const open = gradeCall({ ratingTo: "buy", priceAtCall: 100, priceTargetTo: 110, outcomePrice: null }, "14");
    assert.equal(open.gradeable, false);
    assert.equal(gradeLabelForScore(open.score, open.gradeable), "Not graded yet");
  });
});

describe("call ledger", () => {
  const rows = parseCallLedger(readFileSync(CALLS_CSV_PATH, "utf8"));

  it("treats the CSV as the source, without a frozen row count", () => {
    assert.ok(rows.length > 0);
    const ids = rows.map((row) => row.call_id);
    assert.equal(new Set(ids).size, ids.length);
    const issues = collectIssues(rows);
    assert.deepEqual(issues.errors, []);
    for (const row of rows) {
      assert.equal(row.data_source, "public");
      assert.notEqual(row.status, "verified");
      assert.notEqual(row.source_url, "");
      assert.equal(toExportedCall(row).source, "public");
      assert.equal(toExportedCall(row).sourceUrl, row.source_url);
    }
    const json = renderCallsJson(rows);
    assert.equal(json, readFileSync(CALLS_JSON_PATH, "utf8"));
    assert.equal(json, renderCallsJson(parseCallLedger(serializeCallCsv(rows))));
    const exported = JSON.parse(json) as Array<Record<string, unknown>>;
    for (const call of exported) {
      for (const column of CSV_ONLY_COLUMNS) assert.equal(column in call, false);
      assert.equal("data_source" in call, false);
    }
  });

  it("rejects any demo row, including one labelled verified", () => {
    const base = rows[0];
    assert.ok(base);
    const labelled = { ...base, data_source: "demo", status: "verified" };
    const issues = collectIssues([labelled]);
    assert.ok(issues.errors.some((error) => error.includes("data_source=demo is rejected")));
    assert.ok(issues.errors.some((error) => error.includes("demo rows cannot be labelled verified")));
    const plain = collectIssues([{ ...base, data_source: "demo" }]);
    assert.ok(plain.errors.some((error) => error.includes("data_source=demo is rejected")));
  });

  it("refuses to label a public row verified", () => {
    const base = rows[0];
    assert.ok(base);
    const issues = collectIssues([{ ...base, status: "verified" }]);
    assert.ok(issues.errors.some((error) => error.includes("a public row cannot be labelled verified")));
    assert.ok(issues.errors.some((error) => error.includes("only a licensed row can be labelled verified")));
  });

  function licensedRow(patch: Partial<CallRow> = {}): CallRow {
    const demo = rows[0];
    assert.ok(demo);
    const row: CallRow = {
      ...demo,
      data_source: "licensed",
      status: "verified",
      source_url: "https://example.com/research-note",
      note: "Filed from the research note.",
      controversial_reason: "",
      ledger_notes: "",
      export_index: "0",
      ...patch,
    };
    row.flags = expectedFlags(row);
    return row;
  }

  it("allows a licensed row to be verified when it has a source URL", () => {
    const issues = collectIssues([licensedRow()]);
    assert.equal(
      issues.errors.some((error) => error.includes("cannot be labelled verified")),
      false,
    );
    assert.equal(issues.errors.some((error) => error.includes("Demo")), false);
    assert.deepEqual(issues.errors, []);
  });

  it("rejects a source URL that is not http(s) or is not routable", () => {
    const blocked = [
      "garbage",
      "javascript:alert(1)",
      "htp:/x",
      "http://localhost",
      "http://localhost.",
      "http://LOCALHOST",
      "http://127.0.0.1",
      "http://[::1]",
      "http://127.1",
      "http://2130706433",
      "http://0x7f.0.0.1",
      "http://user@localhost",
      "http://0.0.0.0",
      "http://0",
      "http://127.0.0.2",
      "http://[::]",
      "http://[::ffff:127.0.0.1]",
      "http://foo.localhost",
      "http://localhost.localdomain",
      "http://10.1.2.3",
      "http://172.16.0.1",
      "http://172.31.255.255",
      "http://192.168.1.1",
      "http://169.254.1.1",
    ];
    for (const sourceUrl of blocked) {
      const issues = collectIssues([licensedRow({ source_url: sourceUrl })]);
      assert.ok(
        issues.errors.some((error) => error.includes("source_url must be an http(s) URL that is not localhost")),
        sourceUrl,
      );
    }
    const alt = collectIssues([licensedRow({ alt_source_url: "http://localhost" })]);
    assert.ok(alt.errors.some((error) => error.includes("alt_source_url must be an http(s) URL that is not localhost")));
    for (const sourceUrl of ["https://example.com/research-note", "http://8.8.8.8/note", "http://172.15.0.1/note"]) {
      const issues = collectIssues([licensedRow({ source_url: sourceUrl })]);
      assert.deepEqual(issues.errors, [], sourceUrl);
    }
  });

  it("rejects Demo copy on a licensed or verified row", () => {
    for (const column of ["note", "controversial_reason", "ledger_notes"] as const) {
      const issues = collectIssues([licensedRow({ [column]: "Demo. This was copied from the sample book." })]);
      assert.ok(
        issues.errors.some((error) => error.includes(`cannot contain Demo in ${column}`)),
        column,
      );
    }
    for (const marker of ["demo", "DEMO", "DeMo", "Demo."]) {
      const issues = collectIssues([licensedRow({ note: marker })]);
      assert.ok(issues.errors.some((error) => error.includes("cannot contain Demo in note")), marker);
    }
    for (const note of ["Demonstrated results", "Democrat view"]) {
      const issues = collectIssues([licensedRow({ note })]);
      assert.deepEqual(issues.errors, [], note);
    }
  });

  it("requires the analyst, firm, and ticker to exist on every row", () => {
    const missingAnalyst = collectIssues([licensedRow({ analyst_slug: "nobody" })]);
    assert.ok(missingAnalyst.errors.some((error) => error.includes("analyst_slug is not in the universe")));
    const missingFirm = collectIssues([licensedRow({ firm_slug: "not-a-firm" })]);
    assert.ok(missingFirm.errors.some((error) => error.includes("firm_slug is not in the universe")));
    const missingTicker = collectIssues([licensedRow({ ticker: "NOTREAL" })]);
    assert.ok(missingTicker.errors.some((error) => error.includes("ticker is not in the universe")));
    const renamed = collectIssues([licensedRow({ company: "Not the universe name" })]);
    assert.ok(renamed.errors.some((error) => error.includes("company does not match the registry")));
    const renamedAnalyst = collectIssues([licensedRow({ analyst_name: "Not the registry name" })]);
    assert.ok(renamedAnalyst.errors.some((error) => error.includes("analyst_name does not match the registry")));
    const renamedFirm = collectIssues([licensedRow({ firm_name: "Not the registry name" })]);
    assert.ok(renamedFirm.errors.some((error) => error.includes("firm_name does not match the registry")));
    const wrongPrice = collectIssues([licensedRow({ price_at_call: "1" })]);
    assert.ok(wrongPrice.errors.some((error) => error.includes("price_at_call is 1 and the series has")));
  });

  it("rejects a call date after the price history on a licensed row", () => {
    const issues = collectIssues([licensedRow({ call_date: "2099-01-01" })]);
    assert.ok(issues.errors.some((error) => error.includes("call_date is after the price history")));
  });

  it("allows a call date equal to the price-history as-of date", () => {
    const base = licensedRow();
    const prices = pricesForCall(base.ticker, new Date(`${QUOTE_AS_OF}T00:00:00.000Z`));
    const dated: CallRow = {
      ...base,
      call_date: QUOTE_AS_OF,
      price_at_call: formatNumber(prices.priceAtCall),
      price_14d: prices.price14d == null ? "" : formatNumber(prices.price14d),
      price_30d: prices.price30d == null ? "" : formatNumber(prices.price30d),
      price_60d: prices.price60d == null ? "" : formatNumber(prices.price60d),
      price_90d: prices.price90d == null ? "" : formatNumber(prices.price90d),
      price_1y: prices.price1y == null ? "" : formatNumber(prices.price1y),
    };
    dated.grade_14 = expectedGrade(dated, "14");
    dated.grade_30 = expectedGrade(dated, "30");
    dated.grade_60 = expectedGrade(dated, "60");
    dated.grade_90 = expectedGrade(dated, "90");
    dated.grade_365 = expectedGrade(dated, "365");
    if (dated.status !== "verified") dated.status = expectedStatus(dated);
    dated.flags = expectedFlags(dated);
    const issues = collectIssues([dated]);
    assert.deepEqual(issues.errors, []);
  });

  it("rebuilds coverage from call order without a second ledger", () => {
    const exported = JSON.parse(renderCallsJson(rows)) as Array<{ analystId: string; tickerId: string }>;
    const coverage = coverageFromCalls(exported);
    const callPairs = new Set(exported.map((call) => `${call.analystId}|${call.tickerId}`));
    const coveragePairs = coverage.map((row) => `${row.analystId}|${row.tickerId}`);
    assert.equal(new Set(coveragePairs).size, coveragePairs.length);
    assert.deepEqual(new Set(coveragePairs), callPairs);
    const again = coverageFromCalls(exported);
    assert.deepEqual(again, coverage);
  });
});
