import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GRADED_CALLS_HUB_HREF, LogoLink } from "../components/logo-link";

(globalThis as { React?: typeof React }).React = React;

test("the header logo links to the hub in the same tab", () => {
  const html = renderToStaticMarkup(React.createElement(LogoLink));
  const open = html.match(/<a\b[^>]*>/)?.[0] ?? "";
  assert.equal(GRADED_CALLS_HUB_HREF, "https://charoof.vercel.app");
  assert.match(open, /href="https:\/\/charoof\.vercel\.app"/);
  assert.match(open, /aria-label="GradedCalls"/);
  assert.match(html, /alt="GradedCalls"/);
  assert.doesNotMatch(open, /\btarget=/);
  assert.equal(html.replace(/<[^>]+>/g, "").replace(/\s+/g, ""), "GradedCalls");

  const chrome = readFileSync(new URL("../components/chrome.tsx", import.meta.url), "utf8");
  assert.match(chrome, /<LogoLink\s*\/>/);
  assert.doesNotMatch(chrome, /href="\/"/);

  const globalError = readFileSync(new URL("../app/global-error.tsx", import.meta.url), "utf8");
  assert.match(globalError, /<LogoLink\s*\/>/);
  assert.match(html, /src="\/gradedcalls-mark-transparent\.png"/);
  assert.match(html, /width="44"/);
  assert.match(html, /height="44"/);
  assert.match(html, /background-color:transparent/);
  assert.doesNotMatch(html, /gradedcalls-mark\.png/);

  const errorPage = readFileSync(new URL("../app/error.tsx", import.meta.url), "utf8");
  assert.match(errorPage, /onClick=\{reset\}/);
  assert.doesNotMatch(errorPage, /\bretry\b/);
  assert.match(globalError, /onClick=\{reset\}/);
  assert.doesNotMatch(globalError, /\bretry\b/);
});
