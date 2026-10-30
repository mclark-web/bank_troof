import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { IncomingMessage } from "node:http";
import test from "node:test";
import { format as formatUrl } from "node:url";
import type { Redirect } from "next/dist/lib/load-custom-routes";
import { getRedirectStatus, modifyRouteRegex } from "next/dist/lib/redirect-status";
import type { BaseNextRequest } from "next/dist/server/base-http";
import { addRequestMeta } from "next/dist/server/request-meta";
import { stringifyQuery } from "next/dist/server/server-route-utils";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { matchHas, prepareDestination } from "next/dist/shared/lib/router/utils/prepare-destination";
import { normalizeRepeatedSlashes } from "next/dist/shared/lib/utils";
import nextConfig from "../next.config";
import { SITE_URL } from "../src/lib/site-urls";

const deploymentHost = ["vercel", "app"].join(".");
const legacyHost = `bank-troof.${deploymentHost}`;

function redirectTo(
  rule: Redirect,
  host: string,
  pathname: string,
  query: Record<string, string>,
): { status: number; location: string } | null {
  const match = getPathMatch(rule.source, {
    strict: true,
    removeUnnamedParams: true,
    regexModifier: (regex) => modifyRouteRegex(regex, ["/_next"]),
    sensitive: false,
  });
  const params = match(pathname);
  if (!params) return null;
  const req = { headers: { host }, url: pathname } as IncomingMessage;
  if (rule.has || rule.missing) {
    const hasParams = matchHas(req, query, rule.has, rule.missing);
    if (!hasParams) return null;
    Object.assign(params, hasParams);
  }
  addRequestMeta(req, "initQuery", { ...query });
  const { parsedDestination } = prepareDestination({
    appendParamsToQuery: false,
    destination: rule.destination,
    params,
    query,
  });
  const search = stringifyQuery(req as unknown as BaseNextRequest, parsedDestination.query);
  const pathnameOut = normalizeRepeatedSlashes(parsedDestination.pathname || "");
  return {
    status: getRedirectStatus(rule),
    location: formatUrl({
      protocol: parsedDestination.protocol,
      hostname: parsedDestination.hostname,
      pathname: pathnameOut,
      search,
      slashes: true,
    }),
  };
}

test("legacy production host redirects permanently with path and query preserved", async () => {
  const redirects = nextConfig.redirects;
  if (!redirects) throw new Error("redirects missing");
  const rules = await redirects();
  assert.equal(rules.length, 1);
  const rule = rules[0];
  assert.equal(rule.source, "/:path*");
  assert.equal(rule.permanent, true);
  assert.equal("statusCode" in rule ? rule.statusCode : undefined, undefined);
  assert.deepEqual(rule.has, [{ type: "host", value: legacyHost }]);
  assert.equal(rule.destination, `${SITE_URL}/:path*`);
  assert.equal(getRedirectStatus(rule), 308);
  assert.equal(new URL(SITE_URL).hostname === legacyHost, false);

  const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.match(config, /import \{ SITE_URL \} from "\.\/src\/lib\/site-urls"/);
  assert.match(config, /destination: `\$\{SITE_URL\}\/:path\*`/);
  assert.doesNotMatch(config, /gradedcalls\.com/);

  const call = redirectTo(rule, legacyHost, "/calls/real_0001", { tab: "notes", x: "1" });
  assert.deepEqual(call, {
    status: 308,
    location: `${SITE_URL}/calls/real_0001?tab=notes&x=1`,
  });

  const nested = redirectTo(rule, legacyHost, "/analysts/aaron-rakers", { view: "full" });
  assert.equal(nested?.location, `${SITE_URL}/analysts/aaron-rakers?view=full`);

  const spaced = redirectTo(rule, legacyHost, "/about", { q: "a b" });
  assert.equal(spaced?.status, 308);
  assert.equal(spaced?.location, `${SITE_URL}/about?q=a%20b`);

  const root = redirectTo(rule, legacyHost, "/", { from: "old" });
  assert.equal(root?.location, `${SITE_URL}?from=old`);
  assert.equal(redirectTo(rule, legacyHost, "/", {})?.location, SITE_URL);

  const previewGit = `bank-troof-git-cursor-vercel-host-redirect-hoonu.${deploymentHost}`;
  const previewHash = `bank-troof-abc123-hoonu.${deploymentHost}`;
  assert.equal(redirectTo(rule, previewGit, "/calls/real_0001", { tab: "notes", x: "1" }), null);
  assert.equal(redirectTo(rule, previewHash, "/about", { q: "1" }), null);
  assert.equal(redirectTo(rule, new URL(SITE_URL).hostname, "/calls/real_0001", { tab: "notes" }), null);
  assert.equal(redirectTo(rule, `not-${legacyHost}`, "/calls/real_0001", { tab: "notes" }), null);
  assert.equal(redirectTo(rule, `${legacyHost}.evil.example`, "/", {}), null);

  assert.ok(call);
  const landed = new URL(call.location);
  assert.equal(landed.hostname, new URL(SITE_URL).hostname);
  assert.equal(landed.hostname === legacyHost, false);
  assert.equal(call.location.toLowerCase().includes(deploymentHost), false);
  const again = redirectTo(rule, landed.hostname, landed.pathname, {
    tab: landed.searchParams.get("tab") ?? "",
    x: landed.searchParams.get("x") ?? "",
  });
  assert.equal(again, null);
});
