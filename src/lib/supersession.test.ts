import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  annotateSupersession,
  calendarDaysBetween,
  normalizeTicker,
  nullifiedByLaterNote,
  scanSupersession,
  SUPERSESSION_WINDOW_DAYS,
  supersedesPriorNote,
} from "./supersession";

function call(id: string, analystId: string, ticker: string, callDate: string | null) {
  return { id, analystId, ticker, callDate };
}

describe("normalizeTicker", () => {
  it("collapses dot, slash, and case variants", () => {
    assert.equal(normalizeTicker("BRK.B"), "BRK-B");
    assert.equal(normalizeTicker("brk/b"), "BRK-B");
    assert.equal(normalizeTicker(" BRK-B "), "BRK-B");
    assert.equal(normalizeTicker("aapl"), "AAPL");
  });
});

describe("calendarDaysBetween", () => {
  it("counts UTC calendar days, including a leap-year span of exactly 90", () => {
    const start = new Date("2024-01-01T23:00:00.000Z");
    const day90 = new Date("2024-03-31T00:30:00.000Z");
    const day91 = new Date("2024-04-01T00:00:00.000Z");
    assert.equal(calendarDaysBetween(start, day90), 90);
    assert.equal(calendarDaysBetween(start, day91), 91);
    assert.equal(calendarDaysBetween(start, start), 0);
  });
});

describe("same-ticker supersession", () => {
  it("nullifies the older call when the next one lands within 90 days", () => {
    const marks = annotateSupersession([
      call("new", "ada", "AAPL", "2024-03-31T00:00:00.000Z"),
      call("old", "ada", "AAPL", "2024-01-01T00:00:00.000Z"),
    ]);
    const older = marks.get("old");
    const newer = marks.get("new");
    assert.ok(older);
    assert.ok(newer);
    assert.equal(older.status, "nullified");
    assert.equal(older.countsForScoring, false);
    assert.equal(older.supersededById, "new");
    assert.equal(older.gapUntilNextDays, 90);
    assert.equal(older.nullifiedNote, nullifiedByLaterNote(new Date("2024-03-31T00:00:00.000Z")));
    assert.equal(
      older.nullifiedNote,
      "Nullified — superseded by later call on Mar 31, 2024 (within 90 days).",
    );
    assert.equal(newer.status, "active");
    assert.equal(newer.countsForScoring, true);
    assert.equal(newer.supersedesId, "old");
    assert.equal(newer.supersedesNote, supersedesPriorNote(new Date("2024-01-01T00:00:00.000Z")));
    assert.equal(newer.supersedesNote, "Supersedes prior call on Jan 1, 2024 (within 90 days).");
    assert.equal(SUPERSESSION_WINDOW_DAYS, 90);
  });

  it("leaves both calls active when the gap is 91 days", () => {
    const marks = annotateSupersession([
      call("old", "ada", "AAPL", "2024-01-01T00:00:00.000Z"),
      call("new", "ada", "AAPL", "2024-04-01T00:00:00.000Z"),
    ]);
    assert.equal(marks.get("old")?.status, "active");
    assert.equal(marks.get("new")?.status, "active");
    assert.equal(marks.get("old")?.countsForScoring, true);
    assert.equal(marks.get("new")?.countsForScoring, true);
    assert.equal(marks.get("old")?.nullifiedNote, null);
    assert.equal(marks.get("new")?.supersedesNote, null);
  });

  it("keeps only the latest call active in a three-call streak", () => {
    const marks = annotateSupersession([
      call("c", "ada", "MSFT", "2024-03-21T00:00:00.000Z"),
      call("a", "ada", "MSFT", "2024-01-01T00:00:00.000Z"),
      call("b", "ada", "MSFT", "2024-02-10T00:00:00.000Z"),
    ]);
    const first = marks.get("a");
    const middle = marks.get("b");
    const last = marks.get("c");
    assert.equal(first?.status, "nullified");
    assert.equal(first?.countsForScoring, false);
    assert.equal(first?.supersededById, "b");
    assert.equal(first?.supersedesId, null);
    assert.equal(first?.nullifiedNote, "Nullified — superseded by later call on Feb 10, 2024 (within 90 days).");
    assert.equal(middle?.status, "nullified");
    assert.equal(middle?.countsForScoring, false);
    assert.equal(middle?.supersedesId, "a");
    assert.equal(middle?.supersededById, "c");
    assert.equal(middle?.supersedesNote, "Supersedes prior call on Jan 1, 2024 (within 90 days).");
    assert.equal(middle?.nullifiedNote, "Nullified — superseded by later call on Mar 21, 2024 (within 90 days).");
    assert.equal(last?.status, "active");
    assert.equal(last?.countsForScoring, true);
    assert.equal(last?.supersedesId, "b");
    assert.equal(last?.supersededById, null);
    assert.equal(last?.nullifiedNote, null);
    assert.equal(last?.supersedesNote, "Supersedes prior call on Feb 10, 2024 (within 90 days).");
  });

  it("starts a new active run when a later gap is outside 90 days", () => {
    const marks = annotateSupersession([
      call("a", "ada", "NVDA", "2024-01-01T00:00:00.000Z"),
      call("b", "ada", "NVDA", "2024-02-01T00:00:00.000Z"),
      call("c", "ada", "NVDA", "2024-06-01T00:00:00.000Z"),
    ]);
    assert.equal(marks.get("a")?.status, "nullified");
    assert.equal(marks.get("b")?.status, "active");
    assert.equal(marks.get("b")?.supersedesId, "a");
    assert.equal(marks.get("b")?.supersededById, null);
    assert.equal(marks.get("c")?.status, "active");
    assert.equal(marks.get("c")?.supersedesNote, null);
    assert.equal(marks.get("c")?.nullifiedNote, null);
  });

  it("treats a same calendar day as inside the window and keeps the later call", () => {
    const marks = annotateSupersession([
      call("pm", "ada", "JPM", "2024-05-01T15:00:00.000Z"),
      call("am", "ada", "JPM", "2024-05-01T09:00:00.000Z"),
      call("tie-b", "ada", "JPM", "2024-05-02T00:00:00.000Z"),
      call("tie-a", "ada", "JPM", "2024-05-02T00:00:00.000Z"),
    ]);
    assert.equal(marks.get("am")?.status, "nullified");
    assert.equal(marks.get("am")?.supersededById, "pm");
    assert.equal(marks.get("pm")?.countsForScoring, false);
    assert.equal(marks.get("pm")?.supersedesId, "am");
    assert.equal(marks.get("pm")?.supersededById, "tie-a");
    assert.equal(marks.get("tie-a")?.status, "nullified");
    assert.equal(marks.get("tie-a")?.supersededById, "tie-b");
    assert.equal(marks.get("tie-b")?.status, "active");
    assert.equal(marks.get("tie-b")?.countsForScoring, true);
    assert.equal(marks.get("tie-b")?.supersedesId, "tie-a");

    const scan = scanSupersession([
      call("pm", "ada", "JPM", "2024-05-01T15:00:00.000Z"),
      call("am", "ada", "JPM", "2024-05-01T09:00:00.000Z"),
      call("tie-b", "ada", "JPM", "2024-05-02T00:00:00.000Z"),
      call("tie-a", "ada", "JPM", "2024-05-02T00:00:00.000Z"),
    ]);
    assert.equal(scan.sameDay.length, 2);
    assert.deepEqual(scan.sameDay[0], {
      analystId: "ada",
      ticker: "JPM",
      date: "2024-05-01",
      callIds: ["am", "pm"],
    });
    assert.deepEqual(scan.sameDay[1], {
      analystId: "ada",
      ticker: "JPM",
      date: "2024-05-02",
      callIds: ["tie-a", "tie-b"],
    });
    assert.equal(scan.inWindowPairs, 3);
    assert.equal(scan.callsNullified, 3);
    assert.equal(scan.analystTickerGroupsWithInWindowPair, 1);
  });

  it("does not cross analysts or tickers", () => {
    const marks = annotateSupersession([
      call("a1", "ada", "AAPL", "2024-01-01T00:00:00.000Z"),
      call("a2", "bea", "AAPL", "2024-01-15T00:00:00.000Z"),
      call("a3", "ada", "MSFT", "2024-01-20T00:00:00.000Z"),
    ]);
    assert.equal(marks.get("a1")?.status, "active");
    assert.equal(marks.get("a2")?.status, "active");
    assert.equal(marks.get("a3")?.status, "active");
    assert.equal(marks.get("a1")?.supersedesNote, null);
  });

  it("chains BRK.B with BRK-B and reports the alias", () => {
    const input = [
      call("dot", "ada", "BRK.B", "2024-01-01T00:00:00.000Z"),
      call("dash", "ada", "BRK-B", "2024-02-01T00:00:00.000Z"),
    ];
    const marks = annotateSupersession(input);
    assert.equal(marks.get("dot")?.status, "nullified");
    assert.equal(marks.get("dash")?.supersedesId, "dot");
    const scan = scanSupersession(input);
    assert.deepEqual(scan.tickerAliases, [{ raw: "BRK.B", normalized: "BRK-B", calls: 1 }]);
    assert.equal(scan.inWindowPairs, 1);
    assert.equal(scan.callsNullified, 1);
  });

  it("leaves a missing date active and out of the chain", () => {
    const input = [
      call("dated", "ada", "XOM", "2024-01-01T00:00:00.000Z"),
      call("blank", "ada", "XOM", null),
      call("later", "ada", "XOM", "2024-02-01T00:00:00.000Z"),
    ];
    const marks = annotateSupersession(input);
    assert.equal(marks.get("blank")?.status, "active");
    assert.equal(marks.get("blank")?.countsForScoring, true);
    assert.equal(marks.get("blank")?.nullifiedNote, null);
    assert.equal(marks.get("dated")?.status, "nullified");
    assert.equal(marks.get("dated")?.supersededById, "later");
    const scan = scanSupersession(input);
    assert.deepEqual(scan.missingDates, [{ callId: "blank", analystId: "ada", ticker: "XOM" }]);
  });

  it("counts an outside-window pair without nullifying it", () => {
    const scan = scanSupersession([
      call("old", "ada", "WMT", "2024-01-01T00:00:00.000Z"),
      call("new", "ada", "WMT", "2024-06-01T00:00:00.000Z"),
    ]);
    assert.equal(scan.inWindowPairs, 0);
    assert.equal(scan.outsideWindowPairs, 1);
    assert.equal(scan.analystTickerGroupsWithInWindowPair, 0);
    assert.equal(scan.callsNullified, 0);
    assert.equal(scan.callsActive, 2);
    assert.deepEqual(scan.sameDay, []);
    assert.deepEqual(scan.missingDates, []);
    assert.deepEqual(scan.tickerAliases, []);
  });
});
