import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BELOW_PREVIEW, fullestHorizon, previewBelow } from "./leaderboard-cut";
import type { HorizonKey } from "./scoring";

function counts(partial: Partial<Record<HorizonKey, number>> = {}): Record<HorizonKey, number> {
  return { "14": 0, "30": 0, "60": 0, "90": 0, "365": 0, ...partial };
}

describe("fullestHorizon", () => {
  it("picks the horizon with the most names at the minimum", () => {
    const qualifying = counts({ "14": 2, "30": 9, "90": 4 });
    const considered = counts({ "14": 240, "30": 80, "90": 40 });
    assert.equal(fullestHorizon(qualifying, considered), "30");
  });

  it("when the minimum counts tie, picks the cut with more graded names", () => {
    const qualifying = counts({ "14": 5, "90": 5, "365": 5 });
    const considered = counts({ "14": 200, "90": 80, "365": 10 });
    assert.equal(fullestHorizon(qualifying, considered), "14");
  });

  it("uses the longer window when the minimum counts and the graded counts both tie", () => {
    const qualifying = counts({ "14": 5, "90": 5, "365": 5 });
    const considered = counts({ "14": 10, "90": 10, "365": 10 });
    assert.equal(fullestHorizon(qualifying, considered), "365");
  });

  it("when nobody is at the minimum, picks the cut with the most graded names", () => {
    const qualifying = counts();
    const considered = counts({ "14": 243, "30": 180, "90": 85, "365": 0 });
    assert.equal(fullestHorizon(qualifying, considered), "14");
  });
});

describe("previewBelow", () => {
  it("caps below-minimum rows unless all are requested, keeping sort order", () => {
    const rows = Array.from({ length: 571 }, (_, i) => i);
    const capped = previewBelow(rows, false);
    assert.equal(capped.shown.length, BELOW_PREVIEW);
    assert.deepEqual(capped.shown.slice(0, 3), [0, 1, 2]);
    assert.equal(capped.hidden, 571 - BELOW_PREVIEW);
    assert.equal(previewBelow(rows, true).hidden, 0);
    assert.equal(previewBelow([1, 2], false).hidden, 0);
  });
});
