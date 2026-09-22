import assert from "node:assert/strict";
import test from "node:test";
import { gradeCall } from "./scoring";
import { SPLIT_ADJUSTED } from "./splits";

test("split notes cover the window splits and do not relabel an unsplit name", () => {
  assert.equal(SPLIT_ADJUSTED.WMT.split, "3-for-1 on 26 Feb 2024");
  assert.equal(SPLIT_ADJUSTED.NVDA.split, "10-for-1 on 10 Jun 2024");
  assert.equal(SPLIT_ADJUSTED.AVGO.split, "10-for-1 on 15 Jul 2024");
  assert.equal(SPLIT_ADJUSTED.NFLX.split, "10-for-1 on 17 Nov 2025");
  assert.equal(SPLIT_ADJUSTED.AAPL, undefined);
  assert.equal(SPLIT_ADJUSTED.GOOGL, undefined);
  assert.equal(SPLIT_ADJUSTED.AMZN, undefined);
  assert.equal(SPLIT_ADJUSTED.META, undefined);
});

test("scaling every dollar on a call leaves the grade identical", () => {
  const raw = {
    ratingTo: "sell" as const,
    priceAtCall: 1192.93,
    priceTargetTo: 867,
    outcomePrice: 1169.45,
  };
  const factor = 10;
  const adjusted = {
    ratingTo: raw.ratingTo,
    priceAtCall: raw.priceAtCall / factor,
    priceTargetTo: raw.priceTargetTo / factor,
    outcomePrice: raw.outcomePrice / factor,
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
