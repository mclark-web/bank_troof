import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregateGrades, formatChadScore, formatPoints, gradeCall, toChadExact, toChadScore } from "./scoring";

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
});

describe("toChadScore", () => {
  it("maps the raw poles onto the integers 1 Chud and 10 Chad", () => {
    assert.equal(toChadExact(0), 1);
    assert.equal(toChadExact(100), 10);
    assert.equal(toChadExact(50), 5.5);
    assert.equal(toChadScore(0), 1);
    assert.equal(toChadScore(100), 10);
    assert.equal(toChadScore(50), 6);
    assert.equal(toChadScore(92), 9);
    assert.equal(formatChadScore(92), "9");
    assert.equal(formatChadScore(null), "—");
    assert.equal(formatPoints(92), "92");
    assert.equal(formatPoints(82.44), "82.4");
    assert.equal(formatPoints(null), "—");
    for (const raw of [0, 25, 50, 75, 92, 100]) {
      const shown = toChadScore(raw);
      assert.equal(Number.isInteger(shown), true);
      assert.ok(shown != null && shown >= 1 && shown <= 10);
    }
  });

  it("clamps out-of-range raw scores and ignores an empty grade", () => {
    assert.equal(toChadScore(140), 10);
    assert.equal(toChadScore(-5), 1);
    assert.equal(toChadScore(null), null);
  });

  it("rounds the map of the average, not the average of the rounded grades", () => {
    const hit = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: null, outcomePrice: 110 },
      "90",
    );
    const miss = gradeCall(
      { ratingTo: "buy", priceAtCall: 100, priceTargetTo: null, outcomePrice: 90 },
      "90",
    );
    const agg = aggregateGrades([hit, miss]);
    assert.equal(toChadExact(agg.avgScore), 5.5);
    assert.equal(toChadScore(agg.avgScore), 6);
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
