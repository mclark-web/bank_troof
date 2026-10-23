import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const origin = "https://bank-troof.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [analysts, banks, tickers, calls] = await Promise.all([
    prisma.analyst.findMany({ select: { slug: true } }),
    prisma.bank.findMany({ select: { slug: true } }),
    prisma.ticker.findMany({ select: { symbol: true } }),
    prisma.call.findMany({ select: { id: true, analystId: true, bankId: true } }),
  ]);
  const analystIds = new Set(calls.map((row) => row.analystId));
  const bankIds = new Set(calls.map((row) => row.bankId));
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
    ...analysts.filter((row) => analystIds.has(row.slug)).map((row) => `/analysts/${row.slug}`),
    ...banks.filter((row) => bankIds.has(row.slug)).map((row) => `/banks/${row.slug}`),
    ...tickers.map((row) => `/tickers/${row.symbol}`),
    ...calls.map((row) => `/calls/${row.id}`),
  ];
  return paths.map((path) => ({ url: `${origin}${path === "/" ? "" : path}` }));
}
