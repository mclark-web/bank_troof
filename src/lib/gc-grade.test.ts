import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gradeCall } from "./scoring";
import { percentShares, readCalibration, readCallCalibration, readMean } from "./gc-grade";

describe("readCalibration", () => {
  it("draws an open window as empty glass and exit liquidity", () => {
    assert.deepEqual(readCalibration(null, false), { id: "exit", percent: 0, tube: 0 });
    assert.deepEqual(readCalibration(80, false), { id: "exit", percent: 0, tube: 0 });
    assert.deepEqual(readCalibration(undefined, true), { id: "exit", percent: 0, tube: 0 });
  });

  it("keeps a graded zero off the exit label", () => {
    const reading = readCalibration(0, true);
    assert.equal(reading.id, "weak");
    assert.equal(reading.percent, 0);
    assert.ok(reading.tube > 0);
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
    assert.equal(readCalibration(miss.score, miss.gradeable).id, "weak");
    assert.equal(readCalibration(hit.score, false).id, "exit");
  });
});

describe("readMean and call windows", () => {
  it("averages only the numbers it is given", () => {
    assert.equal(readMean([]).id, "exit");
    assert.equal(readMean([80, 60]).percent, 70);
    assert.equal(readMean([80, 60]).id, "strong");
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
