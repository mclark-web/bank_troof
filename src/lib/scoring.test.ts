import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregateGrades, formatPoints, gradeCall, HORIZONS, HORIZON_KEYS, placeChad, topThirtyCutoff } from "./scoring";

describe("gradeCall", () => {
  it("credits a buy that clears the 90-day hurdle", () => {
    const grade = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: 112, outcomePrice: 110 },
      "90",
    );
    assert.equal(grade.gradeable, true);
    assert.equal(grade.hit, true);
    assert.equal(grade.directionResult, "hit");
    assert.equal(grade.directionPoints, 70);
    assert.ok(grade.score != null && grade.score > 70);
    assert.ok(Math.abs((grade.forwardReturn ?? 0) - 0.1) < 1e-9);
    assert.equal(grade.followedReturn, grade.forwardReturn);
  });

  it("treats a buy just short of the hurdle as a near miss, not a hit", () => {
    const grade = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: 110, outcomePrice: 103 },
      "90",
    );
    assert.equal(grade.directionResult, "near");
    assert.equal(grade.hit, false);
    assert.equal(grade.directionPoints, 35);
  });

  it("misses a buy when the stock falls", () => {
    const grade = gradeCall(
      { ratingTo: "strong_buy", priceAtCall: 100, priceTargetTo: 130, outcomePrice: 90 },
      "90",
    );
    assert.equal(grade.directionResult, "miss");
    assert.equal(grade.directionPoints, 0);
    assert.equal(grade.hit, false);
  });

  it("hits a hold inside the flat band and misses one outside it", () => {
    const inside = gradeCall(
      { ratingTo: "hold", priceAtCall: 50, priceTargetTo: 51, outcomePrice: 52 },
      "90",
    );
    const outside = gradeCall(
      { ratingTo: "hold", priceAtCall: 50, priceTargetTo: 51, outcomePrice: 58 },
      "90",
    );
    assert.equal(inside.hit, true);
    assert.equal(inside.followedReturn, null);
    assert.equal(outside.directionResult, "miss");
  });

  it("scores a sell by the decline and flips the followed return", () => {
    const grade = gradeCall(
      { ratingTo: "sell", priceAtCall: 80, priceTargetTo: 60, outcomePrice: 70 },
      "90",
    );
    assert.equal(grade.hit, true);
    assert.ok((grade.forwardReturn ?? 0) < 0);
    assert.equal(grade.followedReturn, -(grade.forwardReturn ?? 0));
  });

  it("renormalizes the score when no price target was set", () => {
    const grade = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: null, outcomePrice: 108 },
      "90",
    );
    assert.equal(grade.targetPoints, null);
    assert.equal(grade.score, 100);
  });

  it("gives full target credit inside the band and none past the zero band", () => {
    const close = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: 110, outcomePrice: 109 },
      "90",
    );
    const far = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: 160, outcomePrice: 110 },
      "90",
    );
    assert.equal(close.targetPoints, 30);
    assert.equal(far.targetPoints, 0);
  });

  it("does not grade a call before the window has a price", () => {
    const grade = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: 110, outcomePrice: null },
      "365",
    );
    assert.equal(grade.gradeable, false);
    assert.equal(grade.score, null);
  });

  it("uses the 30-day threshold rather than the 90-day one", () => {
    const grade = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: 103, outcomePrice: 102.5 },
      "30",
    );
    assert.equal(grade.hit, true);
    assert.equal(grade.threshold, 0.02);
  });

  it("grades 2 weeks and 60 days on their own calendar-day thresholds", () => {
    const twoWeeks = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: 102, outcomePrice: 101.5 },
      "14",
    );
    const sixty = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: 104, outcomePrice: 103 },
      "60",
    );
    assert.equal(HORIZONS["14"].days, 14);
    assert.equal(twoWeeks.hit, true);
    assert.equal(twoWeeks.threshold, 0.01);
    assert.equal(sixty.hit, false);
    assert.equal(sixty.threshold, 0.04);
    assert.deepEqual(HORIZON_KEYS, ["14", "30", "60", "90", "365"]);
  });
});

describe("placeChad", () => {
  const peers = [40, 55, 60, 68, 72, 75, 80, 88, 92, 96];

  it("keeps everything under 70 on GC 1–4", () => {
    assert.equal(placeChad(0, peers).chad, 1);
    assert.equal(placeChad(50, peers).chad, 3);
    assert.equal(placeChad(69.9, peers).side, "chud");
    assert.equal(placeChad(69.9, peers).chad, 4);
    assert.equal(placeChad(69.9, [90, 95, 99]).side, "chud");
    assert.equal(formatPoints(92), "92");
    assert.equal(formatPoints(null), "—");
  });

  it("gives GC 8–10 only to the top 30% who also cleared 70", () => {
    assert.equal(topThirtyCutoff(peers), 88);
    const high = placeChad(92, peers);
    const edge = placeChad(88, peers);
    const mid = placeChad(80, peers);
    const line = placeChad(70, peers);
    assert.equal(high.side, "chad");
    assert.ok((high.chad ?? 0) >= 8);
    assert.equal(edge.side, "chad");
    assert.equal(mid.side, "mid");
    assert.ok((mid.chad ?? 0) >= 5 && (mid.chad ?? 0) <= 7);
    assert.equal(line.side, "mid");
    assert.equal(placeChad(100, peers).chad, 10);
  });

  it("treats a weak field as GC 8–10 once a score clears 70", () => {
    const weak = [20, 30, 40, 45, 50, 55, 58, 60, 62, 65];
    assert.ok(topThirtyCutoff(weak) < 70);
    assert.equal(placeChad(65, weak).side, "chud");
    assert.equal(placeChad(70, weak).side, "chad");
    assert.equal(placeChad(null, weak).chad, null);
    assert.equal(placeChad(-5, weak).side, "chud");
    assert.equal(placeChad(140, weak).side, "chad");
  });

  it("buckets an average under 70 as GC 1–4", () => {
    const hit = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: null, outcomePrice: 110 },
      "90",
    );
    const miss = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: null, outcomePrice: 90 },
      "90",
    );
    const agg = aggregateGrades([hit, miss]);
    assert.equal(agg.avgScore, 50);
    assert.equal(placeChad(agg.avgScore, peers).side, "chud");
    assert.equal(placeChad(agg.avgScore, peers).chad, 3);
  });

  it("states Grade Calibration and does not use the old placement names", () => {
    const labels = [0, 50, 69.9, 80, 88, 100].map((score) => placeChad(score, peers).label ?? "");
    for (const label of labels) {
      assert.match(label, /GC/);
      assert.doesNotMatch(label, /chad|chud/i);
    }
  });
});

describe("aggregateGrades", () => {
  it("averages score and followed return and ignores ungraded calls", () => {
    const hit = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: null, outcomePrice: 110 },
      "90",
    );
    const miss = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: null, outcomePrice: 90 },
      "90",
    );
    const pending = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: null, outcomePrice: null },
      "90",
    );
    const agg = aggregateGrades([hit, miss, pending]);
    assert.equal(agg.graded, 2);
    assert.equal(agg.hits, 1);
    assert.equal(agg.hitRate, 0.5);
    assert.equal(agg.missRate, 0.5);
    assert.equal(agg.avgScore, 50);
    assert.ok(Math.abs((agg.avgFollowedReturn ?? 0) - 0) < 1e-9);
  });
});
