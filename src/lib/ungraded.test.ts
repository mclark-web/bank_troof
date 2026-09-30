import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GcUngraded } from "../components/gc-tube";
import { GradePill } from "../components/ui";

(globalThis as { React?: typeof React }).React = React;

test("an ungraded compact glass announces GC Scale, not graded yet", () => {
  const html = renderToStaticMarkup(React.createElement(GcUngraded, { compact: true }));
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="GC Scale, not graded yet"/);
  assert.match(html, /gc-ungraded-glass/);
  assert.match(html, /Not graded yet/);
  assert.doesNotMatch(html, /<p[^>]*aria-label/);
  assert.doesNotMatch(html, /EXIT LIQUIDITY|0%/);
});

test("a missing direction result uses the ungraded glass, not a grade pill", () => {
  const html = renderToStaticMarkup(React.createElement(GradePill, { result: null }));
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="GC Scale, not graded yet"/);
  assert.match(html, /Not graded yet/);
  assert.doesNotMatch(html, /EXIT LIQUIDITY/);
});

test("board health copy includes graded-zero calls and the price line names dividends", async () => {
  const { loadCalls } = await import("./queries");
  const { boardHealth } = await import("./gc-grade");
  const { default: AnalystsPage } = await import("../app/analysts/page");
  const calls = await loadCalls();
  const active = calls.filter((call) => call.supersession.countsForScoring);
  const health = boardHealth(active.map((call) => call.grades["30"]));
  const withPrint = active.filter((call) => call.grades["30"].gradeable && call.grades["30"].score != null).length;
  assert.equal(health.graded, withPrint);
  assert.ok(health.counts.exit > 0);
  const html = renderToStaticMarkup(await AnalystsPage({ searchParams: Promise.resolve({}) }));
  assert.match(html, new RegExp(`Shares of the ${health.graded} active calls that already have a 30-day print`));
  assert.match(html, /Prices · Yahoo Finance · split- and dividend-adjusted/);
  assert.doesNotMatch(html, /split-adj/);
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="GC Scale, not graded yet"/);
});
