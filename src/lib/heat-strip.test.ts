import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { readExportedCalls } from "../../scripts/calls-ledger";
import {
  HeatLegend,
  HorizonHeatStrip,
  HORIZON_MONTH_NOTE,
  heatAccessibleName,
  heatStep,
  heatVisible,
} from "../components/ui";
import { readCalibration } from "./gc-grade";
import { HORIZONS, HORIZON_KEYS, gradeCall, outcomeField, type HorizonKey } from "./scoring";

(globalThis as { React?: typeof React }).React = React;

const MONTH_NOTE = "1M, 2M, and 3M are 30, 60, and 90 calendar days.";

function openGrades(): Record<HorizonKey, { score: number | null; gradeable: boolean }> {
  return Object.fromEntries(HORIZON_KEYS.map((key) => [key, { score: null, gradeable: false }])) as Record<
    HorizonKey,
    { score: number | null; gradeable: boolean }
  >;
}

function stripHtml(horizon: HorizonKey, score: number | null, gradeable: boolean): string {
  const grades = openGrades();
  grades[horizon] = { score, gradeable };
  return renderToStaticMarkup(React.createElement(HorizonHeatStrip, { grades }));
}

test("heat bands follow the unrounded score, and EXIT is only an exact graded 0", () => {
  assert.equal(heatStep(null, false), "open");
  assert.equal(heatStep(0, false), "open");
  assert.equal(heatStep(0, true), "exit");
  assert.equal(heatStep(0.193, true), "weak");
  assert.equal(heatStep(0.471, true), "weak");
  assert.equal(heatStep(0.314, true), "weak");
  assert.equal(heatStep(39.912, true), "weak");
  assert.equal(heatStep(40, true), "provisional");
  assert.equal(heatVisible(0, true), "0%");
  assert.equal(heatVisible(0.193, true), "▼ <1%");
  assert.equal(heatVisible(39.912, true), "▼ 39%");
  assert.equal(heatAccessibleName("30 days", 0.193, true), "GC Scale, 30 days: ▼ <1% WEAK");
  assert.equal(heatAccessibleName("30 days", 39.912, true), "GC Scale, 30 days: ▼ 39% WEAK");
  assert.equal(heatAccessibleName("2 weeks", 0, true), "GC Scale, 2 weeks: EXIT LIQUIDITY");
  assert.equal(heatStep(0.193, true), readCalibration(0.193, true).id);
  assert.equal(heatStep(39.912, true), readCalibration(39.912, true).id);
});

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

test("ledger rounding edges print ▼ <1% WEAK or ▼ 39% WEAK, not 0% or 40%", () => {
  const calls = readExportedCalls();
  const cases: Array<[string, HorizonKey, string]> = [
    ["real_0583", "30", "▼ <1% WEAK"],
    ["real_0433", "14", "▼ <1% WEAK"],
    ["real_0507", "60", "▼ <1% WEAK"],
    ["real_0572", "30", "▼ 39% WEAK"],
  ];
  for (const [id, horizon, reading] of cases) {
    const call = calls.find((row) => row.id === id);
    assert.ok(call, id);
    const grade = gradeCall(
      {
        ratingTo: call.ratingTo,
        priceAtCall: call.priceAtCall,
        priceTargetTo: call.priceTargetTo,
        outcomePrice: call[outcomeField(horizon)],
      },
      horizon,
    );
    assert.equal(grade.gradeable, true, id);
    assert.ok(grade.score != null && grade.score > 0, `${id} ${grade.score}`);
    assert.equal(heatStep(grade.score, true), "weak", id);
    const name = heatAccessibleName(HORIZONS[horizon].label, grade.score, true);
    assert.equal(name, `GC Scale, ${HORIZONS[horizon].label}: ${reading}`, id);
    const html = stripHtml(horizon, grade.score, true);
    assert.ok(html.includes(`aria-label="${esc(name)}"`), html);
    assert.ok(html.includes(`title="${esc(name)}"`), html);
    assert.equal(html.includes(">0%<"), false, id);
    assert.ok(html.includes(`>${esc(heatVisible(grade.score, true))}<`), id);
  }
});

test("the heat legend names 0% = EXIT LIQUIDITY, the cold band, and the month horizons", () => {
  assert.equal(HORIZON_MONTH_NOTE, MONTH_NOTE);
  const html = renderToStaticMarkup(React.createElement(HeatLegend));
  assert.doesNotMatch(html, /0% WEAK/);
  assert.match(html, />0% = EXIT LIQUIDITY</);
  assert.match(html, /under 40% cold/);
  assert.ok(html.includes(MONTH_NOTE));
  const methodology = readFileSync(new URL("../app/methodology/page.tsx", import.meta.url), "utf8");
  assert.ok(methodology.includes(MONTH_NOTE));
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.heat-weak \{ background: #14171e; border-color: rgba\(154,154,163,\.22\)/);
  assert.match(css, /\.heat-weak \.heat-v \{ color: #9a9aa3/);
  assert.match(css, /\.heat-weak \.heat-bar \{ opacity: 1/);
  assert.doesNotMatch(css, /a9b8d6|8aa0c8|138,\s*160,\s*200|d9c3ae|ffb36b/);
});
