import assert from "node:assert/strict";
import test from "node:test";
import { PRICE_ANCHORS, trendPrice } from "./price-anchors";

function on(symbol: string, iso: string) {
  return trendPrice(PRICE_ANCHORS[symbol], new Date(`${iso}T00:00:00.000Z`));
}

test("NFLX stays on one post-split scale from 2024 into April 2026", () => {
  const april = on("NFLX", "2026-04-21");
  const july = on("NFLX", "2024-07-30");
  assert.ok(april > 90 && april < 100, `Apr 2026 ${april}`);
  assert.ok(july > 58 && july < 72, `Jul 2024 ${july}`);
  assert.ok(april / july < 3, `scale mix ${april / july}`);
});

test("mega-cap trends match the split-adjusted band on the audited dates", () => {
  const cases: [string, string, number, number][] = [
    ["NVDA", "2024-02-09", 60, 90],
    ["NVDA", "2026-05-31", 190, 230],
    ["AAPL", "2026-04-29", 250, 300],
    ["AMZN", "2026-04-22", 230, 290],
    ["GOOGL", "2026-04-22", 330, 420],
    ["META", "2026-04-22", 540, 680],
    ["AVGO", "2024-02-07", 100, 150],
    ["AVGO", "2026-04-29", 380, 460],
    ["WMT", "2026-04-25", 115, 145],
    ["MSFT", "2026-04-30", 380, 440],
  ];
  for (const [symbol, iso, low, high] of cases) {
    const price = on(symbol, iso);
    assert.ok(price > low && price < high, `${symbol} ${iso} ${price}`);
  }
});

test("each anchor date reproduces its close", () => {
  for (const [symbol, anchors] of Object.entries(PRICE_ANCHORS)) {
    for (const anchor of anchors) {
      const price = on(symbol, anchor.date);
      assert.ok(Math.abs(price - anchor.price) < 1e-6, `${symbol} ${anchor.date} ${price}`);
    }
  }
});
