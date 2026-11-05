import { NextResponse, type NextRequest } from "next/server";
import calls from "../data/calls/calls.json";

type CallRef = { id: string; analystId: string; bankId: string; tickerId: string };

const rows = calls as CallRef[];
const analystIds = new Set(rows.map((row) => row.analystId));
const bankIds = new Set(rows.map((row) => row.bankId));
const tickerIds = new Set(rows.map((row) => row.tickerId.toUpperCase()));

/**
 * Analyst, bank, and ticker pages read searchParams, so they stay dynamic.
 * notFound() on a dynamic route is Next's bare error document, which is white
 * with JavaScript off. Unknown slugs are rewritten onto a path with no page,
 * which serves the static not-found (dark, logo, visible copy, status 404).
 */
export function middleware(request: NextRequest) {
  const parts = request.nextUrl.pathname.split("/").filter(Boolean);
  if (parts.length !== 2) return NextResponse.next();
  const [kind, raw] = parts;
  const known =
    kind === "analysts"
      ? analystIds.has(raw)
      : kind === "banks"
        ? bankIds.has(raw)
        : kind === "tickers"
          ? tickerIds.has(raw.toUpperCase())
          : true;
  if (known) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/nope-404";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/analysts/:slug", "/banks/:slug", "/tickers/:symbol"],
};
