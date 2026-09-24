import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gradeCall } from "./scoring";
import { GC_GRADE_LABEL, GC_SCALE_LABEL, boardHealth, percentShares, readBoardMean, readCalibration, readCallCalibration, readMean } from "./gc-grade";

describe("brand labels", () => {
  it("names the tube GC Scale and prints the four grades in uppercase", () => {
    assert.equal(GC_SCALE_LABEL, "GC Scale");
    assert.deepEqual(GC_GRADE_LABEL, {
      strong: "STRONG",
      weak: "WEAK",
      provisional: "PROVISIONAL",
      exit: "EXIT LIQUIDITY",
    });
    for (const label of [GC_SCALE_LABEL, ...Object.values(GC_GRADE_LABEL)]) {
      assert.doesNotMatch(label, /chad|chud|charoof|grade calibration|ch-factor/i);
    }
  });
});

describe("readCalibration", () => {
  it("returns an empty reading when the window is not gradeable", () => {
    assert.deepEqual(readCalibration(null, false), { id: "exit", percent: 0, tube: 0 });
    assert.deepEqual(readCalibration(80, false), { id: "exit", percent: 0, tube: 0 });
    assert.deepEqual(readCalibration(undefined, true), { id: "exit", percent: 0, tube: 0 });
  });

  it("draws a graded zero as empty glass and exit liquidity", () => {
    assert.deepEqual(readCalibration(0, true), { id: "exit", percent: 0, tube: 0 });
    const hair = readCalibration(0.4, true);
    assert.equal(hair.id, "weak");
    assert.equal(hair.percent, 0);
    assert.ok(hair.tube > 0);
  });

  it("bands the real 0–100 score without changing it", () => {
    assert.equal(readCalibration(69.9, true).id, "provisional");
    assert.equal(readCalibration(70, true).id, "strong");
    assert.equal(readCalibration(39.9, true).id, "weak");
    assert.equal(readCalibration(40, true).id, "provisional");
    assert.equal(readCalibration(84.2, true).percent, 84);
    assert.equal(readCalibration(140, true).percent, 100);
  });

  it("labels a real price grade from gradeCall, and does not replace that grade", () => {
    const hit = gradeCall({ ratingTo: "buy", priceAtCall: 100, priceTargetTo: 112, outcomePrice: 110 }, "90");
    const miss = gradeCall({ ratingTo: "buy", priceAtCall: 100, priceTargetTo: 130, outcomePrice: 90 }, "90");
    assert.equal(hit.gradeable, true);
    assert.equal(miss.gradeable, true);
    assert.equal(readCalibration(hit.score, hit.gradeable).id, "strong");
    assert.equal(miss.score, 0);
    assert.equal(readCalibration(miss.score, miss.gradeable).id, "exit");
    assert.equal(readCalibration(hit.score, false).id, "exit");
  });
});

describe("readMean and call windows", () => {
  it("averages only the numbers it is given", () => {
    assert.equal(readMean([]).id, "exit");
    assert.equal(readMean([80, 60]).percent, 70);
    assert.equal(readMean([80, 60]).id, "strong");
  });

  it("renders an empty board mean as ungraded and a graded zero as exit", () => {
    assert.deepEqual(readBoardMean([]), { state: "ungraded" });
    const zero = readBoardMean([0, 0]);
    assert.equal(zero.state, "graded");
    if (zero.state === "graded") {
      assert.equal(zero.reading.id, "exit");
      assert.equal(zero.reading.percent, 0);
      assert.equal(zero.reading.tube, 0);
    }
    const mixed = readBoardMean([0, 80]);
    assert.equal(mixed.state, "graded");
    if (mixed.state === "graded") assert.equal(mixed.reading.id, "provisional");
  });

  it("uses one horizon when that window is selected", () => {
    const grades = [
      { score: 90, gradeable: true },
      { score: null, gradeable: false },
    ];
    assert.equal(readCallCalibration(grades, 1).id, "exit");
    assert.equal(readCallCalibration(grades, 0).id, "strong");
    assert.equal(readCallCalibration(grades, "all").id, "strong");
    assert.equal(readCallCalibration([{ score: null, gradeable: false }], "all").id, "exit");
  });
});

describe("percentShares", () => {
  it("sums to 100 when there is a graded book", () => {
    const shares = percentShares({ strong: 41, provisional: 22, weak: 37, exit: 10 }, ["strong", "provisional", "weak"]);
    assert.equal(shares.strong + shares.provisional + shares.weak, 100);
    assert.equal(shares.exit, 0);
    assert.equal(shares.strong, 41);
  });

  it("stays at zero when nothing has a print", () => {
    const shares = percentShares({ strong: 0, provisional: 0, weak: 0, exit: 4 }, ["strong", "provisional", "weak"]);
    assert.deepEqual(shares, { strong: 0, provisional: 0, weak: 0, exit: 0 });
  });
});

describe("board health", () => {
  it("counts graded-zero calls and leaves open windows out", () => {
    const health = boardHealth([
      { score: 80, gradeable: true },
      { score: 0, gradeable: true },
      { score: 0, gradeable: true },
      { score: 55, gradeable: true },
      { score: 20, gradeable: true },
      { score: null, gradeable: false },
      { score: 90, gradeable: false },
    ]);
    assert.equal(health.graded, 5);
    assert.equal(health.counts.exit, 2);
    assert.equal(health.counts.strong, 1);
    assert.equal(health.counts.provisional, 1);
    assert.equal(health.counts.weak, 1);
    assert.equal(health.shares.strong + health.shares.provisional + health.shares.weak + health.shares.exit, 100);
    assert.ok(health.shares.exit > 0);
  });

  it("is empty when every window is still open", () => {
    const health = boardHealth([
      { score: null, gradeable: false },
      { score: 0, gradeable: false },
    ]);
    assert.equal(health.graded, 0);
    assert.equal(health.counts.exit, 0);
    assert.deepEqual(health.shares, { strong: 0, provisional: 0, weak: 0, exit: 0 });
  });
});
