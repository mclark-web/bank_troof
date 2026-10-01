import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { leaderboardLede } from "./leaderboard-lede";
import { HORIZONS, HORIZON_KEYS } from "./scoring";

const views = ["analysts", "banks", "offenders"] as const;
const ranks = ["points", "gc"] as const;

describe("leaderboardLede", () => {
  it("uses the selected horizon label on every view and sort", () => {
    for (const horizon of HORIZON_KEYS) {
      const label = HORIZONS[horizon].label;
      for (const view of views) {
        for (const rank of ranks) {
          const lede = leaderboardLede(view, horizon, rank);
          assert.match(lede, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
          for (const other of HORIZON_KEYS) {
            if (other === horizon) continue;
            assert.equal(lede.includes(HORIZONS[other].label), false, `${view} ${horizon} ${rank} leaked ${other}`);
          }
        }
      }
    }
  });

  it("names the active sort", () => {
    assert.equal(
      leaderboardLede("analysts", "90", "points"),
      "Ranked by overall factor: the average 0–100 grade of active calls over 90 days. Superseded calls don't score.",
    );
    assert.equal(
      leaderboardLede("analysts", "14", "points"),
      "Ranked by overall factor: the average 0–100 grade of active calls over 2 weeks. Superseded calls don't score.",
    );
    assert.equal(
      leaderboardLede("banks", "14", "points"),
      "Ranked by overall factor: the average 0–100 grade of active calls over 2 weeks. Superseded calls don't score.",
    );
    const gc = leaderboardLede("analysts", "90", "gc");
    assert.match(gc, /Sorted by the GC score of that factor over 90 days/);
    assert.match(gc, /Names in the same bucket keep the higher overall factor ahead/);
    assert.doesNotMatch(gc, /Ranked by overall factor/);
    const offenders = leaderboardLede("offenders", "90", "points");
    assert.match(offenders, /Lowest overall factor first over 90 days/);
    assert.doesNotMatch(offenders, /Ranked by overall factor/);
    const offendersGc = leaderboardLede("offenders", "30", "gc");
    assert.match(offendersGc, /Lowest overall factor first over 30 days/);
    assert.match(offendersGc, /Sorted by the GC score of that factor/);
    assert.match(offendersGc, /higher overall factor ahead/);
  });
});
