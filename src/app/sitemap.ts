import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site-urls";

const origin = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [analysts, banks, tickers, calls] = await Promise.all([
    prisma.analyst.findMany({ select: { slug: true } }),
    prisma.bank.findMany({ select: { slug: true } }),
    prisma.ticker.findMany({ select: { symbol: true } }),
    prisma.call.findMany({ select: { id: true } }),
  ]);
  const paths = [
    "/",
    "/about",
    "/analysts",
    "/banks",
    "/calls",
    "/disclaimer",
    "/donate",
    "/leaderboards",
    "/methodology",
    "/search",
    "/terms",
    "/tickers",
    "/watchlist",
    ...analysts.map((row) => `/analysts/${row.slug}`),
    ...banks.map((row) => `/banks/${row.slug}`),
    ...tickers.map((row) => `/tickers/${row.symbol}`),
    ...calls.map((row) => `/calls/${row.id}`),
  ];
  return paths.map((path) => ({ url: `${origin}${path === "/" ? "" : path}` }));
}
