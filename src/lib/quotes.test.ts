import assert from "node:assert/strict";
import test from "node:test";
import { adjustedClose, bindHistoricalPrices, forwardClose, isoDate, addUtcDays, tradingSession } from "./quotes";

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

test("Labor Day 2026 files on the Friday session, and UNH uses that close", () => {
  const labor = new Date("2026-09-07T00:00:00.000Z");
  const session = tradingSession("UNH", labor);
  assert.equal(isoDate(session), "2026-09-04");
  assert.equal(adjustedClose("UNH", session), 397.14);
  assert.equal(adjustedClose("UNH", labor), 397.14);
  for (const symbol of ["COP", "AAPL", "ORCL", "AVGO", "MSFT", "LLY", "NVDA", "AMZN"]) {
    assert.equal(isoDate(tradingSession(symbol, labor)), "2026-09-04");
    assert.equal(adjustedClose(symbol, labor), adjustedClose(symbol, session));
  }
});

test("a closed session uses the prior adjusted close and does not invent one", () => {
  const sunday = new Date("2026-04-19T00:00:00.000Z");
  const friday = adjustedClose("NFLX", new Date("2026-04-17T00:00:00.000Z"));
  assert.equal(adjustedClose("NFLX", sunday), friday);
  assert.equal(friday, 97.31);
});

test("each horizon is the adjusted close that many calendar days later", () => {
  const call = new Date("2026-04-21T00:00:00.000Z");
  for (const days of [14, 30, 60, 90]) {
    const later = addUtcDays(call, days);
    const forward = forwardClose("NFLX", call, days);
    assert.equal(forward, adjustedClose("NFLX", later), isoDate(later));
    assert.ok(forward != null && forward > 50 && forward < 120);
  }
  assert.equal(isoDate(addUtcDays(call, 14)), "2026-05-05");
  assert.equal(isoDate(addUtcDays(call, 60)), "2026-06-20");
  assert.equal(isoDate(addUtcDays(call, 90)), "2026-07-20");
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
        price14d: null,
        price30d: null,
        price60d: null,
        price90d: null,
        price1y: null,
      }),
    /47\.14/,
  );
  const bound = bindHistoricalPrices({
    ticker: "NFLX",
    date: "2026-04-21",
    priceAtCall: 92.58,
    price14d: null,
    price30d: null,
    price60d: null,
    price90d: null,
    price1y: null,
  });
  assert.equal(bound.priceAtCall, 92.58);
  assert.equal(bound.price14d, forwardClose("NFLX", new Date("2026-04-21T00:00:00.000Z"), 14));
  assert.equal(bound.price60d, forwardClose("NFLX", new Date("2026-04-21T00:00:00.000Z"), 60));
  assert.equal(bound.price90d, forwardClose("NFLX", new Date("2026-04-21T00:00:00.000Z"), 90));
});
