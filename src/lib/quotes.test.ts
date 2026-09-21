import assert from "node:assert/strict";
import test from "node:test";
import { adjustedClose, bindHistoricalPrices, forwardClose, isoDate, addUtcDays } from "./quotes";

test("NFLX 21 Apr 2026 is the post-split adjusted close in the 90s", () => {
  const price = adjustedClose("NFLX", new Date("2026-04-21T00:00:00.000Z"));
  assert.equal(price, 92.58);
  assert.ok(price > 90 && price < 100);
});

test("NFLX 30 Jul 2024 is the same split-adjusted scale", () => {
  const july = adjustedClose("NFLX", new Date("2024-07-30T00:00:00.000Z"));
  assert.equal(july, 62.26);
  const april = adjustedClose("NFLX", new Date("2026-04-21T00:00:00.000Z"));
  assert.ok(april / july < 3);
});

test("a closed session uses the prior adjusted close and does not invent one", () => {
  const sunday = new Date("2026-04-19T00:00:00.000Z");
  const friday = adjustedClose("NFLX", new Date("2026-04-17T00:00:00.000Z"));
  assert.equal(adjustedClose("NFLX", sunday), friday);
  assert.equal(friday, 97.31);
});

test("a 90-day window is the adjusted close on that calendar date", () => {
  const call = new Date("2026-04-21T00:00:00.000Z");
  const later = addUtcDays(call, 90);
  assert.equal(isoDate(later), "2026-07-20");
  const forward = forwardClose("NFLX", call, 90);
  assert.equal(forward, adjustedClose("NFLX", later));
  assert.ok(forward != null && forward > 60 && forward < 90);
});

test("missing history throws instead of inventing a price", () => {
  assert.throws(() => adjustedClose("TSLA", new Date("2026-04-21T00:00:00.000Z")), /Refusing to invent/);
  assert.throws(() => adjustedClose("NFLX", new Date("2020-01-02T00:00:00.000Z")), /Refusing to invent/);
  assert.throws(() => adjustedClose("NFLX", new Date("2027-01-04T00:00:00.000Z")), /Refusing to invent/);
});

test("import rejects a price that is not the adjusted close", () => {
  assert.throws(
    () =>
      bindHistoricalPrices({
        ticker: "NFLX",
        date: "2026-04-21",
        priceAtCall: 47.14,
        price30d: null,
        price90d: null,
        price1y: null,
      }),
    /47\.14/,
  );
  const bound = bindHistoricalPrices({
    ticker: "NFLX",
    date: "2026-04-21",
    priceAtCall: 92.58,
    price30d: null,
    price90d: null,
    price1y: null,
  });
  assert.equal(bound.priceAtCall, 92.58);
  assert.equal(bound.price90d, forwardClose("NFLX", new Date("2026-04-21T00:00:00.000Z"), 90));
});
