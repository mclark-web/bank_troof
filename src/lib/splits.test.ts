import assert from "node:assert/strict";
import test from "node:test";
import { gradeCall } from "./scoring";
import { SPLIT_ADJUSTED, splitAdjust } from "./splits";

test("NVDA, NFLX, and WMT use the post-split factor", () => {
  assert.equal(SPLIT_ADJUSTED.NVDA.factor, 10);
  assert.equal(SPLIT_ADJUSTED.NFLX.factor, 10);
  assert.equal(SPLIT_ADJUSTED.WMT.factor, 3);
  assert.equal(splitAdjust("AAPL", 185), 185);
});

test("scaling every dollar leaves the grade identical", () => {
  const raw = {
    ratingTo: "sell" as const,
    priceAtCall: 1192.93,
    priceTargetTo: 867,
    outcomePrice: 1169.45,
  };
  const adjusted = {
    ratingTo: raw.ratingTo,
    priceAtCall: splitAdjust("NVDA", raw.priceAtCall),
    priceTargetTo: splitAdjust("NVDA", raw.priceTargetTo),
    outcomePrice: splitAdjust("NVDA", raw.outcomePrice),
  };
  const before = gradeCall(raw, "30");
  const after = gradeCall(adjusted, "30");
  assert.equal(before.hit, after.hit);
  assert.equal(before.directionResult, after.directionResult);
  assert.equal(before.score, after.score);
  assert.ok(Math.abs((before.forwardReturn ?? 0) - (after.forwardReturn ?? 0)) < 1e-12);
  assert.ok(adjusted.priceAtCall > 80 && adjusted.priceAtCall < 200);
  assert.equal(adjusted.priceTargetTo, 86.7);
});
