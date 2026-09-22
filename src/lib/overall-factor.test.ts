import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { overallFactor, type FactorCall } from "./overall-factor";
import { aggregateGrades, gradeCall, type CallGrade } from "./scoring";

function graded(score: number, hit: boolean): CallGrade {
  const grade = gradeCall(
    {
      ratingTo: "buy",
      priceAtCall: 100,
      priceTargetTo: null,
      outcomePrice: hit ? 110 : 90,
    },
    "90",
  );
  return { ...grade, score, hit, gradeable: true };
}

function row(score: number, hit: boolean, live: boolean): FactorCall {
  return {
    grade: graded(score, hit),
    countsForScoring: live,
    nullified: !live,
  };
}

describe("overall factor", () => {
  it("averages active graded calls and leaves superseded calls out", () => {
    const calls = [row(80, true, true), row(40, false, true), row(100, true, false), row(0, false, false)];
    const factor = overallFactor(calls);
    const activeOnly = aggregateGrades([graded(80, true), graded(40, false)]);

    assert.equal(factor.score, 60);
    assert.equal(factor.score, activeOnly.avgScore);
    assert.equal(factor.activeGraded, 2);
    assert.equal(factor.superseded, 2);
    assert.equal(factor.hitRate, 0.5);
    assert.equal(factor.aggregate.hits, 1);
    assert.equal(factor.aggregate.graded, activeOnly.graded);
  });

  it("counts a nullified call that has no grade yet", () => {
    const open: CallGrade = {
      gradeable: false,
      forwardReturn: null,
      expected: "up",
      directionResult: null,
      directionPoints: 0,
      targetError: null,
      targetPoints: null,
      score: null,
      hit: null,
      followedReturn: null,
      threshold: 0.05,
      nearFloor: null,
    };
    const factor = overallFactor([
      row(90, true, true),
      { grade: open, countsForScoring: false, nullified: true },
    ]);
    assert.equal(factor.score, 90);
    assert.equal(factor.activeGraded, 1);
    assert.equal(factor.superseded, 1);
    assert.equal(factor.hitRate, 1);
  });

  it("returns an empty factor when every call is superseded", () => {
    const factor = overallFactor([row(100, true, false)]);
    assert.equal(factor.score, null);
    assert.equal(factor.hitRate, null);
    assert.equal(factor.activeGraded, 0);
    assert.equal(factor.superseded, 1);
  });

  it("ignores an active call whose horizon is still open", () => {
    const open: CallGrade = {
      gradeable: false,
      forwardReturn: null,
      expected: null,
      directionResult: null,
      directionPoints: 0,
      targetError: null,
      targetPoints: null,
      score: null,
      hit: null,
      followedReturn: null,
      threshold: 0.05,
      nearFloor: null,
    };
    const factor = overallFactor([
      { grade: open, countsForScoring: true, nullified: false },
      row(70, true, true),
    ]);
    assert.equal(factor.score, 70);
    assert.equal(factor.activeGraded, 1);
    assert.equal(factor.superseded, 0);
  });
});
