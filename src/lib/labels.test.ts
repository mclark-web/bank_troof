import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { callHeadline } from "./format";
import {
  callPageTitle,
  deskRatingNote,
  directionForGradingLabel,
  recommendationLabel,
  recommendationTone,
} from "./labels";

describe("recommendation labels", () => {
  it("labels call_0933 as a target raise, not a Sell headline", () => {
    const call = { action: "target_raise", ratingFrom: "sell", ratingTo: "sell" };
    assert.equal(recommendationLabel(call), "Target raise");
    assert.equal(callPageTitle("CAT", call), "CAT Target raise");
    assert.equal(directionForGradingLabel(call.ratingTo), "Sell");
    assert.equal(recommendationTone(call), "up");
    assert.equal(deskRatingNote(call), "Desk rating stays Sell");
    const headline = callHeadline({ action: call.action, symbol: "CAT", ratingTo: call.ratingTo });
    assert.equal(headline, "raised the CAT target");
    assert.doesNotMatch(headline, /sell/i);
    assert.doesNotMatch(recommendationLabel(call), /sell/i);
  });

  it("keeps a target cut off the Buy headline", () => {
    const call = { action: "target_cut", ratingFrom: "buy", ratingTo: "buy" };
    assert.equal(recommendationLabel(call), "Target cut");
    assert.equal(recommendationTone(call), "down");
    assert.equal(callHeadline({ action: call.action, symbol: "CAT", ratingTo: call.ratingTo }), "cut the CAT target");
    assert.equal(directionForGradingLabel("buy"), "Buy");
  });

  it("builds the recommendation from the action and the desk rating", () => {
    assert.equal(recommendationLabel({ action: "initiate", ratingTo: "buy" }), "Initiate Buy");
    assert.equal(recommendationLabel({ action: "upgrade", ratingFrom: "hold", ratingTo: "overweight" }), "Upgrade to Overweight");
    assert.equal(recommendationLabel({ action: "downgrade", ratingFrom: "buy", ratingTo: "neutral" }), "Downgrade to Neutral");
    assert.equal(recommendationLabel({ action: "reiterate", ratingTo: "outperform" }), "Reiterate Outperform");
    assert.equal(recommendationLabel({ action: "reiterate", ratingFrom: "overweight", ratingTo: "overweight" }), "Reiterate Overweight");
    assert.equal(recommendationLabel({ action: "reiterate", ratingTo: "neutral" }), "Maintain Neutral");
    assert.equal(recommendationLabel({ action: "reiterate", ratingTo: "hold" }), "Maintain Hold");
    assert.equal(recommendationLabel({ action: "reiterate", ratingTo: "equal_weight" }), "Maintain Equal-Weight");
    assert.equal(directionForGradingLabel("overweight"), "Buy");
    assert.equal(directionForGradingLabel("underperform"), "Sell");
    assert.equal(directionForGradingLabel("equal_weight"), "Hold");
    assert.equal(
      callHeadline({ action: "downgrade", symbol: "CAT", ratingTo: "sell" }),
      "downgraded CAT to Sell",
    );
    assert.equal(
      callHeadline({ action: "reiterate", symbol: "CAT", ratingTo: "neutral" }),
      "maintained Neutral on CAT",
    );
  });
});
