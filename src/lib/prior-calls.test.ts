import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { attachPriorCalls, calendarDaysApart, PRIOR_CALL_WINDOW_DAYS } from "./prior-calls";

function call(id: string, analystId: string, tickerId: string, iso: string) {
  return { id, analystId, tickerId, callDate: new Date(`${iso}T00:00:00.000Z`), note: id };
}

describe("calendarDaysApart", () => {
  it("counts UTC calendar days and ignores clock time", () => {
    const gap = calendarDaysApart(new Date("2026-09-04T23:00:00.000Z"), new Date("2026-07-15T00:30:00.000Z"));
    assert.equal(gap, 51);
  });
});

describe("attachPriorCalls", () => {
  it("links the previous same-ticker call at exactly 90 days and keeps every row", () => {
    const rows = [
      call("new", "helen-voss", "NVDA", "2026-09-04"),
      call("old", "helen-voss", "NVDA", "2026-06-06"),
    ];
    assert.equal(calendarDaysApart(rows[0].callDate, rows[1].callDate), PRIOR_CALL_WINDOW_DAYS);
    const linked = attachPriorCalls(rows);
    assert.equal(linked.length, rows.length);
    const newer = linked.find((row) => row.id === "new");
    const older = linked.find((row) => row.id === "old");
    assert.equal(newer?.priorCall?.id, "old");
    assert.equal(newer?.followUpWithin90Days, true);
    assert.deepEqual(newer?.priors.map((row) => row.id), ["old"]);
    assert.equal(older?.nextCall?.id, "new");
    assert.equal(older?.note, "old");
    assert.equal(newer?.note, "new");
  });

  it("does not link a previous call 91 days earlier", () => {
    const linked = attachPriorCalls([
      call("old", "helen-voss", "NVDA", "2026-06-05"),
      call("new", "helen-voss", "NVDA", "2026-09-04"),
    ]);
    const newer = linked.find((row) => row.id === "new");
    assert.equal(newer?.priorCall, null);
    assert.equal(newer?.followUpWithin90Days, false);
    assert.equal(linked.find((row) => row.id === "old")?.nextCall, null);
  });

  it("ignores a different analyst or a different ticker", () => {
    const linked = attachPriorCalls([
      call("mine", "helen-voss", "NVDA", "2026-08-01"),
      call("other-analyst", "daniel-cho", "NVDA", "2026-07-01"),
      call("other-ticker", "helen-voss", "AAPL", "2026-07-01"),
    ]);
    assert.equal(linked.find((row) => row.id === "mine")?.priorCall, null);
  });

  it("walks a chain while each step stays inside 90 days", () => {
    const linked = attachPriorCalls([
      call("c", "helen-voss", "NVDA", "2026-09-04"),
      call("a", "helen-voss", "NVDA", "2026-06-20"),
      call("b", "helen-voss", "NVDA", "2026-08-01"),
    ]);
    const newest = linked.find((row) => row.id === "c");
    assert.deepEqual(newest?.priors.map((row) => row.id), ["b", "a"]);
    assert.equal(newest?.priorCall?.id, "b");
    assert.equal(linked.find((row) => row.id === "a")?.nextCall?.id, "b");
    assert.equal(linked.find((row) => row.id === "b")?.nextCall?.id, "c");
  });

  it("stops the chain when a gap is longer than 90 days", () => {
    const linked = attachPriorCalls([
      call("a", "helen-voss", "NVDA", "2026-01-01"),
      call("b", "helen-voss", "NVDA", "2026-06-01"),
      call("c", "helen-voss", "NVDA", "2026-08-01"),
    ]);
    const newest = linked.find((row) => row.id === "c");
    assert.equal(newest?.priorCall?.id, "b");
    assert.deepEqual(newest?.priors.map((row) => row.id), ["b"]);
    assert.equal(linked.find((row) => row.id === "b")?.priorCall, null);
  });

  it("treats a same-day pair as a follow-up and orders ties by id", () => {
    const linked = attachPriorCalls([
      call("b", "helen-voss", "NVDA", "2026-09-04"),
      call("a", "helen-voss", "NVDA", "2026-09-04"),
    ]);
    assert.equal(linked.find((row) => row.id === "b")?.priorCall?.id, "a");
    assert.equal(linked.find((row) => row.id === "a")?.followUpWithin90Days, false);
  });
});
