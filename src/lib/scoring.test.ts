import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GC_PROVISIONAL_LINE, GC_STRONG_LINE, readCalibration } from "./gc-grade";
import { aggregateGrades, CHUD_LINE, formatPoints, GC_BANDS, GC_WEAK_LINE, gradeCall, HORIZONS, HORIZON_KEYS, placeChad } from "./scoring";

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
  it("uses the same 70 and 40 lines as the tube", () => {
    assert.equal(CHUD_LINE, 70);
    assert.equal(GC_STRONG_LINE, 70);
    assert.equal(CHUD_LINE, GC_STRONG_LINE);
    assert.equal(GC_WEAK_LINE, 40);
    assert.equal(GC_PROVISIONAL_LINE, 40);
    assert.equal(GC_WEAK_LINE, GC_PROVISIONAL_LINE);
    assert.equal(formatPoints(92), "92");
    assert.equal(formatPoints(null), "—");
  });

  it("maps each ten points to one GC step, with 90–100 as GC 10", () => {
    assert.equal(placeChad(0).chad, null);
    assert.equal(placeChad(0.1).chad, 1);
    assert.equal(placeChad(9.9).chad, 1);
    assert.equal(placeChad(10).chad, 2);
    assert.equal(placeChad(39.9).chad, 4);
    assert.equal(placeChad(40).chad, 5);
    assert.equal(placeChad(50).chad, 6);
    assert.equal(placeChad(69.9).chad, 7);
    assert.equal(placeChad(70).chad, 8);
    assert.equal(placeChad(80).chad, 9);
    assert.equal(placeChad(88).chad, 9);
    assert.equal(placeChad(90).chad, 10);
    assert.equal(placeChad(92).chad, 10);
    assert.equal(placeChad(100).chad, 10);
    assert.equal(placeChad(null).chad, null);
    assert.equal(placeChad(-5).chad, null);
    assert.equal(placeChad(140).chad, 10);
  });

  it("puts WEAK, PROVISIONAL, and STRONG on the same badge bands as the tube", () => {
    assert.equal(placeChad(39.9).side, "chud");
    assert.equal(readCalibration(39.9, true).id, "weak");
    assert.equal(placeChad(40).side, "mid");
    assert.equal(readCalibration(40, true).id, "provisional");
    assert.equal(placeChad(69.9).side, "mid");
    assert.equal(readCalibration(69.9, true).id, "provisional");
    assert.equal(placeChad(70).side, "chad");
    assert.equal(readCalibration(70, true).id, "strong");
    assert.equal(placeChad(65).side, "mid");
    assert.equal(placeChad(65).chad, 7);
    for (const band of GC_BANDS) {
      const sample = band.gc === 10 ? 100 : band.min === 0 ? 5 : band.min;
      const placement = placeChad(sample);
      const reading = readCalibration(sample, true);
      assert.equal(placement.chad, band.gc);
      if (band.grade === "STRONG") {
        assert.equal(placement.side, "chad");
        assert.equal(reading.id, "strong");
        assert.ok(band.gc >= 8 && band.gc <= 10);
      } else if (band.grade === "PROVISIONAL") {
        assert.equal(placement.side, "mid");
        assert.equal(reading.id, "provisional");
        assert.ok(band.gc >= 5 && band.gc <= 7);
      } else {
        assert.equal(placement.side, "chud");
        assert.equal(reading.id, "weak");
        assert.ok(band.gc >= 1 && band.gc <= 4);
      }
    }
  });

  it("places an average from the absolute score, not from who else scored", () => {
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
    assert.equal(placeChad(agg.avgScore).side, "mid");
    assert.equal(placeChad(agg.avgScore).chad, 6);
    assert.equal(placeChad(92).chad, 10);
    assert.equal(placeChad(72).chad, 8);
  });

  it("draws a graded zero as EXIT LIQUIDITY with a dash, not GC 1", () => {
    const placed = placeChad(0);
    assert.equal(placed.chad, null);
    assert.equal(placed.side, null);
    assert.match(placed.label ?? "", /EXIT LIQUIDITY/);
    assert.match(placed.label ?? "", /dash/);
    assert.match(placed.label ?? "", /GC Scale/);
    assert.doesNotMatch(placed.label ?? "", /GC 1|chad|chud|charoof|peer|top 30/i);
    assert.deepEqual(readCalibration(0, true), { id: "exit", percent: 0, tube: 0 });
    assert.equal(placeChad(0.1).chad, 1);
    assert.equal(readCalibration(0.1, true).id, "weak");
  });

  it("states the GC Scale and does not use the old placement names", () => {
    const labels = [0.1, 39.9, 40, 50, 69.9, 70, 80, 88, 100].map((score) => placeChad(score).label ?? "");
    assert.match(labels[0] ?? "", /GC Scale/);
    for (const label of labels) {
      assert.match(label, /GC/);
      assert.match(label, /40|70/);
      assert.doesNotMatch(label, /chad|chud|charoof|grade calibration|ch-factor|peer|top 30/i);
    }
    assert.match(placeChad(0.1).label ?? "", /WEAK/);
    assert.match(placeChad(50).label ?? "", /PROVISIONAL/);
    assert.match(placeChad(80).label ?? "", /STRONG/);
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
