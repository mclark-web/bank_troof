import { cache } from "react";
import type { Analyst, Bank, Call, Ticker } from "@prisma/client";
import { prisma } from "./db";
import { consensusBucket, ratingLabel } from "./labels";
import {
  aggregateGrades,
  gradeCall,
  minimumSample,
  placeChad,
  type Aggregate,
  type CallGrade,
  type ChadPlacement,
  type HorizonKey,
} from "./scoring";

export type ScoredCall = Call & {
  analyst: Analyst & { bank: Bank };
  bank: Bank;
  ticker: Ticker;
  grades: Record<HorizonKey, CallGrade>;
};

export type BoardRow = {
  kind: "analyst" | "bank";
  slug: string;
  name: string;
  subtitle: string;
  href: string;
  sector?: string;
  aggregate: Aggregate;
  placement: ChadPlacement;
};

function gradeStored(call: Call): Record<HorizonKey, CallGrade> {
  const base = {
    ratingTo: call.ratingTo,
    priceAtCall: call.priceAtCall,
    priceTargetTo: call.priceTargetTo,
  };
  return {
    "30": gradeCall({ ...base, outcomePrice: call.price30d }, "30"),
    "90": gradeCall({ ...base, outcomePrice: call.price90d }, "90"),
    "365": gradeCall({ ...base, outcomePrice: call.price1y }, "365"),
  };
}

export const loadCalls = cache(async (): Promise<ScoredCall[]> => {
  const calls = await prisma.call.findMany({
    include: {
      analyst: { include: { bank: true } },
      bank: true,
      ticker: true,
    },
    orderBy: { callDate: "desc" },
  });
  return calls.map((call) => ({ ...call, grades: gradeStored(call) }));
});

export const loadSectors = cache(async (): Promise<string[]> => {
  const rows = await prisma.ticker.findMany({
    distinct: ["sector"],
    select: { sector: true },
    orderBy: { sector: "asc" },
  });
  return rows.map((row) => row.sector);
});

function filterCalls(calls: ScoredCall[], horizon: HorizonKey, sector?: string | null) {
  return calls.filter((call) => {
    if (sector && call.ticker.sector !== sector) return false;
    return call.grades[horizon].gradeable;
  });
}

export type RankKey = "points" | "chad";

function compareBoard(a: BoardRow, b: BoardRow, order: "score" | "low", rank: RankKey) {
  const direction = order === "low" ? 1 : -1;
  if (rank === "chad") {
    const shown = ((a.placement.chad ?? (order === "low" ? 99 : -1)) - (b.placement.chad ?? (order === "low" ? 99 : -1))) * direction;
    if (shown !== 0) return shown;
  }
  const points = ((a.aggregate.avgScore ?? (order === "low" ? 999 : -1)) - (b.aggregate.avgScore ?? (order === "low" ? 999 : -1))) * direction;
  if (Math.abs(points) > 1e-6) return points;
  const tie = order === "low" ? (b.aggregate.missRate ?? -1) - (a.aggregate.missRate ?? -1) : (b.aggregate.hitRate ?? -1) - (a.aggregate.hitRate ?? -1);
  if (Math.abs(tie) > 0.0001) return tie;
  return a.name.localeCompare(b.name);
}

export async function leaderboard(options: {
  horizon: HorizonKey;
  sector?: string | null;
  entity: "analyst" | "bank";
  order: "score" | "low";
  rank?: RankKey;
}): Promise<{ rows: BoardRow[]; minimum: number; considered: number }> {
  const calls = await loadCalls();
  const graded = filterCalls(calls, options.horizon, options.sector);
  const groups = new Map<string, ScoredCall[]>();
  for (const call of graded) {
    const key = options.entity === "analyst" ? call.analystId : call.bankId;
    const list = groups.get(key) ?? [];
    list.push(call);
    groups.set(key, list);
  }
  const minimum = minimumSample(options.entity, options.sector);
  const rows: Omit<BoardRow, "placement">[] = [];
  for (const [key, group] of groups) {
    const sample = group[0];
    const aggregate = aggregateGrades(group.map((call) => call.grades[options.horizon]));
    if (aggregate.graded < minimum) continue;
    if (options.entity === "analyst") {
      rows.push({
        kind: "analyst",
        slug: sample.analyst.slug,
        name: sample.analyst.name,
        subtitle: `${sample.bank.shortName} · ${sample.analyst.sector}`,
        href: `/analysts/${sample.analyst.slug}`,
        sector: sample.analyst.sector,
        aggregate,
      });
    } else {
      rows.push({
        kind: "bank",
        slug: sample.bank.slug,
        name: sample.bank.name,
        subtitle: sample.bank.headquarters,
        href: `/banks/${sample.bank.slug}`,
        aggregate,
      });
    }
    void key;
  }
  const peers = rows.map((row) => row.aggregate.avgScore).filter((score): score is number => score != null);
  const placed = rows.map((row) => ({ ...row, placement: placeChad(row.aggregate.avgScore, peers) }));
  const rank = options.rank ?? "points";
  placed.sort((a, b) => compareBoard(a, b, options.order, rank));
  return { rows: placed, minimum, considered: groups.size };
}

export async function getHome() {
  const [calls, sectors] = await Promise.all([loadCalls(), loadSectors()]);
  const analysts = await leaderboard({ horizon: "90", entity: "analyst", order: "score" });
  const banks = await leaderboard({ horizon: "90", entity: "bank", order: "score" });
  const offenders = await leaderboard({ horizon: "90", entity: "bank", order: "low" });
  const directional = calls.filter((call) => call.grades["90"].followedReturn != null && call.grades["90"].gradeable);
  const featuredHit = [...directional].sort(
    (a, b) => (b.grades["90"].followedReturn ?? 0) - (a.grades["90"].followedReturn ?? 0),
  )[0];
  const featuredMiss = [...directional].sort(
    (a, b) => (a.grades["90"].followedReturn ?? 0) - (b.grades["90"].followedReturn ?? 0),
  )[0];
  const controversial = calls
    .filter((call) => call.controversial && call.grades["90"].gradeable)
    .slice(0, 5);
  const tape = calls.filter((call) => call.grades["90"].gradeable).slice(0, 7);
  const analystCount = new Set(calls.map((call) => call.analystId)).size;
  const bankCount = new Set(calls.map((call) => call.bankId)).size;
  const graded90 = calls.filter((call) => call.grades["90"].gradeable).length;
  return {
    calls,
    sectors,
    analysts: analysts.rows.slice(0, 5),
    banks: banks.rows.slice(0, 5),
    offenders: offenders.rows.slice(0, 5),
    featuredHit,
    featuredMiss,
    controversial,
    tape,
    analystCount,
    bankCount,
    tickerCount: new Set(calls.map((call) => call.tickerId)).size,
    callCount: calls.length,
    graded90,
  };
}

export async function getAnalyst(slug: string) {
  const analyst = await prisma.analyst.findUnique({
    where: { slug },
    include: {
      bank: true,
      coverage: { include: { ticker: true } },
    },
  });
  if (!analyst) return null;
  const calls = (await loadCalls()).filter((call) => call.analystId === analyst.id);
  return { analyst, calls };
}

export async function getBank(slug: string) {
  const bank = await prisma.bank.findUnique({
    where: { slug },
    include: { analysts: { orderBy: { name: "asc" } } },
  });
  if (!bank) return null;
  const calls = (await loadCalls()).filter((call) => call.bankId === bank.id);
  return { bank, calls };
}

export async function getTicker(symbol: string) {
  const ticker = await prisma.ticker.findUnique({
    where: { symbol: symbol.toUpperCase() },
    include: { coverage: { include: { analyst: { include: { bank: true } } } } },
  });
  if (!ticker) return null;
  const calls = (await loadCalls()).filter((call) => call.tickerId === ticker.id);
  return { ticker, calls };
}

export async function getCall(id: string) {
  const calls = await loadCalls();
  return calls.find((call) => call.id === id) ?? null;
}

export async function listAnalysts() {
  const analysts = await prisma.analyst.findMany({
    include: { bank: true },
    orderBy: { name: "asc" },
  });
  const calls = await loadCalls();
  const peers = await rankedPeerScores("analyst", "90");
  return analysts.map((analyst) => {
    const mine = calls.filter((call) => call.analystId === analyst.id);
    const aggregate = aggregateGrades(mine.map((call) => call.grades["90"]));
    return {
      analyst,
      aggregate,
      placement: placeChad(aggregate.avgScore, peers),
      calls: mine.length,
    };
  });
}

export async function listBanks() {
  const banks = await prisma.bank.findMany({
    include: { analysts: true },
    orderBy: { name: "asc" },
  });
  const calls = await loadCalls();
  const peers = await rankedPeerScores("bank", "90");
  return banks.map((bank) => {
    const aggregate = aggregateGrades(
      calls.filter((call) => call.bankId === bank.id).map((call) => call.grades["90"]),
    );
    return { bank, aggregate, placement: placeChad(aggregate.avgScore, peers) };
  });
}

export async function listTickers() {
  const tickers = await prisma.ticker.findMany({ orderBy: { symbol: "asc" } });
  const calls = await loadCalls();
  const peers = await rankedPeerScores("ticker", "90");
  return tickers.map((ticker) => {
    const mine = calls.filter((call) => call.tickerId === ticker.id);
    const latest = new Map<string, ScoredCall>();
    for (const call of [...mine].reverse()) {
      latest.set(call.analystId, call);
    }
    const current = [...latest.values()];
    const buckets = { buy: 0, hold: 0, sell: 0 };
    for (const call of current) {
      const bucket = consensusBucket(call.ratingTo);
      if (bucket) buckets[bucket] += 1;
    }
    const aggregate = aggregateGrades(mine.map((call) => call.grades["90"]));
    return {
      ticker,
      aggregate,
      placement: placeChad(aggregate.avgScore, peers),
      buckets,
      voices: current.length,
    };
  });
}

const BANK_ALIASES: Record<string, string> = {
  goldman: "gs",
  jpmorgan: "jpm",
  "morgan-stanley": "ms",
  bofa: "bac bofa",
  citi: "c",
  "wells-fargo": "wfc",
  deutsche: "db",
  barclays: "bcs",
  ubs: "ubs",
};

function words(value: string) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function matchesQuery(text: string, query: string) {
  const q = query.toLowerCase();
  const hay = text.toLowerCase();
  if (q.length >= 3 && hay.includes(q)) return true;
  return words(hay).some((word) => word === q || (q.length >= 2 && word.startsWith(q) && word.length <= q.length + 2));
}

export async function searchAll(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return { analysts: [], banks: [], tickers: [] };
  const [analysts, banks, tickers] = await Promise.all([
    prisma.analyst.findMany({ include: { bank: true }, orderBy: { name: "asc" } }),
    prisma.bank.findMany({ orderBy: { name: "asc" } }),
    prisma.ticker.findMany({ orderBy: { symbol: "asc" } }),
  ]);
  return {
    analysts: analysts.filter((analyst) =>
      matchesQuery(`${analyst.name} ${analyst.sector} ${analyst.bank.shortName}`, q),
    ),
    banks: banks.filter((bank) =>
      matchesQuery(`${bank.name} ${bank.shortName} ${bank.slug} ${BANK_ALIASES[bank.slug] ?? ""}`, q),
    ),
    tickers: tickers.filter((ticker) => {
      if (ticker.symbol.toLowerCase() === q) return true;
      return matchesQuery(`${ticker.name} ${ticker.sector}`, q);
    }),
  };
}

export function sectorBreakdown(calls: ScoredCall[], horizon: HorizonKey) {
  const groups = new Map<string, ScoredCall[]>();
  for (const call of calls) {
    if (!call.grades[horizon].gradeable) continue;
    const list = groups.get(call.ticker.sector) ?? [];
    list.push(call);
    groups.set(call.ticker.sector, list);
  }
  return [...groups.entries()]
    .map(([sector, group]) => ({
      sector,
      aggregate: aggregateGrades(group.map((call) => call.grades[horizon])),
    }))
    .sort((a, b) => b.aggregate.graded - a.aggregate.graded);
}

export function latestConsensus(calls: ScoredCall[]) {
  const latest = new Map<string, ScoredCall>();
  const ordered = [...calls].sort((a, b) => a.callDate.getTime() - b.callDate.getTime());
  for (const call of ordered) latest.set(call.analystId, call);
  const current = [...latest.values()];
  const buckets = { buy: 0, hold: 0, sell: 0 };
  for (const call of current) {
    const bucket = consensusBucket(call.ratingTo);
    if (bucket) buckets[bucket] += 1;
  }
  return { current, buckets, total: current.length };
}

export function analystRowsForCalls(calls: ScoredCall[], horizon: HorizonKey): BoardRow[] {
  const groups = new Map<string, ScoredCall[]>();
  for (const call of calls) {
    if (!call.grades[horizon].gradeable) continue;
    const list = groups.get(call.analystId) ?? [];
    list.push(call);
    groups.set(call.analystId, list);
  }
  const drafts = [...groups.values()].map((group) => {
    const sample = group[0];
    return {
      kind: "analyst" as const,
      slug: sample.analyst.slug,
      name: sample.analyst.name,
      subtitle: sample.bank.shortName,
      href: `/analysts/${sample.analyst.slug}`,
      aggregate: aggregateGrades(group.map((call) => call.grades[horizon])),
    };
  });
  const peers = drafts.map((row) => row.aggregate.avgScore).filter((score): score is number => score != null);
  return drafts
    .map((row) => ({ ...row, placement: placeChad(row.aggregate.avgScore, peers) }))
    .sort((a, b) => compareBoard(a, b, "score", "points"));
}

export async function rankedPeerScores(entity: "analyst" | "bank" | "ticker", horizon: HorizonKey): Promise<number[]> {
  const calls = await loadCalls();
  const groups = new Map<string, ScoredCall[]>();
  for (const call of calls) {
    if (!call.grades[horizon].gradeable) continue;
    const key = entity === "analyst" ? call.analystId : entity === "bank" ? call.bankId : call.tickerId;
    const list = groups.get(key) ?? [];
    list.push(call);
    groups.set(key, list);
  }
  const minimum = entity === "ticker" ? 1 : minimumSample(entity, null);
  const scores: number[] = [];
  for (const group of groups.values()) {
    const aggregate = aggregateGrades(group.map((call) => call.grades[horizon]));
    if (aggregate.graded >= minimum && aggregate.avgScore != null) scores.push(aggregate.avgScore);
  }
  return scores;
}

export async function callPeerScores(): Promise<Record<HorizonKey, number[]>> {
  const calls = await loadCalls();
  const scores: Record<HorizonKey, number[]> = { "30": [], "90": [], "365": [] };
  for (const call of calls) {
    for (const horizon of ["30", "90", "365"] as const) {
      const grade = call.grades[horizon];
      if (grade.gradeable && grade.score != null) scores[horizon].push(grade.score);
    }
  }
  return scores;
}

export function ratingChange(call: { ratingFrom: string | null; ratingTo: string }) {
  if (!call.ratingFrom || call.ratingFrom === call.ratingTo) return ratingLabel(call.ratingTo);
  return `${ratingLabel(call.ratingFrom)} → ${ratingLabel(call.ratingTo)}`;
}

export async function entityScores(input: { analysts: string[]; banks: string[]; tickers: string[] }) {
  const calls = await loadCalls();
  const [analystPeers, bankPeers, tickerPeers] = await Promise.all([
    rankedPeerScores("analyst", "90"),
    rankedPeerScores("bank", "90"),
    rankedPeerScores("ticker", "90"),
  ]);
  const analysts = input.analysts.slice(0, 40).map((slug) => {
    const mine = calls.filter((call) => call.analyst.slug === slug);
    const sample = mine[0];
    const aggregate = aggregateGrades(mine.map((call) => call.grades["90"]));
    return {
      slug,
      name: sample?.analyst.name ?? slug,
      meta: sample ? `${sample.bank.shortName} · ${sample.analyst.sector}` : "",
      href: `/analysts/${slug}`,
      aggregate,
      placement: placeChad(aggregate.avgScore, analystPeers),
      found: Boolean(sample),
    };
  });
  const banks = input.banks.slice(0, 40).map((slug) => {
    const mine = calls.filter((call) => call.bank.slug === slug);
    const sample = mine[0];
    const aggregate = aggregateGrades(mine.map((call) => call.grades["90"]));
    return {
      slug,
      name: sample?.bank.name ?? slug,
      meta: sample?.bank.headquarters ?? "",
      href: `/banks/${slug}`,
      aggregate,
      placement: placeChad(aggregate.avgScore, bankPeers),
      found: Boolean(sample),
    };
  });
  const tickers = input.tickers.slice(0, 40).map((symbol) => {
    const mine = calls.filter((call) => call.ticker.symbol === symbol.toUpperCase());
    const sample = mine[0];
    const aggregate = aggregateGrades(mine.map((call) => call.grades["90"]));
    return {
      slug: symbol.toUpperCase(),
      name: sample ? `${sample.ticker.symbol} · ${sample.ticker.name}` : symbol.toUpperCase(),
      meta: sample?.ticker.sector ?? "",
      href: `/tickers/${symbol.toUpperCase()}`,
      aggregate,
      placement: placeChad(aggregate.avgScore, tickerPeers),
      found: Boolean(sample),
    };
  });
  return { analysts, banks, tickers };
}
