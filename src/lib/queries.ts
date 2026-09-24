import { cache } from "react";
import type { Analyst, Bank, Call, Ticker } from "@prisma/client";
import { prisma } from "./db";
import { pricesForCall } from "./quotes";
import { consensusBucket } from "./labels";
import {
  gradeCall,
  HORIZON_KEYS,
  minimumSample,
  outcomeField,
  placeChad,
  type Aggregate,
  type CallGrade,
  type ChadPlacement,
  type HorizonKey,
} from "./scoring";
import { overallFactor, type OverallFactor } from "./overall-factor";
import { annotateSupersession, compareCallChronology, type SupersessionMark } from "./supersession";

export type ScoredCall = Call & {
  analyst: Analyst & { bank: Bank };
  bank: Bank;
  ticker: Ticker;
  grades: Record<HorizonKey, CallGrade>;
  supersession: SupersessionMark;
};

export type BoardRow = {
  kind: "analyst" | "bank";
  slug: string;
  name: string;
  subtitle: string;
  href: string;
  sector?: string;
  aggregate: Aggregate;
  /** Nullified calls in the same cut. They do not enter `aggregate`. */
  superseded: number;
  placement: ChadPlacement;
};

const CLOSED_LONGEST_FIRST: HorizonKey[] = ["365", "90", "60", "30", "14"];

/** Longest horizon that already has a print. Null when every window is still open. */
export function longestClosed(call: ScoredCall): { horizon: HorizonKey; grade: CallGrade } | null {
  for (const horizon of CLOSED_LONGEST_FIRST) {
    const grade = call.grades[horizon];
    if (grade.gradeable) return { horizon, grade };
  }
  return null;
}

function gradeStored(call: Call): Record<HorizonKey, CallGrade> {
  const base = {
    ratingTo: call.ratingTo,
    priceAtCall: call.priceAtCall,
    priceTargetTo: call.priceTargetTo,
  };
  return Object.fromEntries(
    HORIZON_KEYS.map((horizon) => [horizon, gradeCall({ ...base, outcomePrice: call[outcomeField(horizon)] }, horizon)]),
  ) as Record<HorizonKey, CallGrade>;
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
  const marks = annotateSupersession(
    calls.map((call) => ({
      id: call.id,
      analystId: call.analystId,
      ticker: call.ticker.symbol,
      callDate: call.callDate,
    })),
  );
  return calls.map((call) => {
    const prices = pricesForCall(call.ticker.symbol, call.callDate);
    const priced = { ...call, ...prices };
    const supersession = marks.get(call.id);
    if (!supersession) throw new Error(`No supersession mark for ${call.id}.`);
    return { ...priced, grades: gradeStored(priced), supersession };
  });
});

/** Overall factor for one horizon. Active graded calls only; nullified calls stay in `superseded`. */
export function factorForCalls(calls: ScoredCall[], horizon: HorizonKey): OverallFactor {
  return overallFactor(
    calls.map((call) => ({
      grade: call.grades[horizon],
      countsForScoring: call.supersession.countsForScoring,
      nullified: call.supersession.status === "nullified",
    })),
  );
}

/** Report-card fields of the overall factor. Profiles and boards both read this. */
export function scoreAggregate(calls: ScoredCall[], horizon: HorizonKey): Aggregate {
  return factorForCalls(calls, horizon).aggregate;
}

export const loadSectors = cache(async (): Promise<string[]> => {
  const rows = await prisma.ticker.findMany({
    distinct: ["sector"],
    select: { sector: true },
    orderBy: { sector: "asc" },
  });
  return rows.map((row) => row.sector);
});

export type RankKey = "points" | "gc";

function compareBoard(a: BoardRow, b: BoardRow, order: "score" | "low", rank: RankKey) {
  const direction = order === "low" ? 1 : -1;
  if (rank === "gc") {
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
  const scoped = options.sector ? calls.filter((call) => call.ticker.sector === options.sector) : calls;
  const groups = new Map<string, ScoredCall[]>();
  for (const call of scoped) {
    const key = options.entity === "analyst" ? call.analystId : call.bankId;
    const list = groups.get(key) ?? [];
    list.push(call);
    groups.set(key, list);
  }
  const minimum = minimumSample(options.entity, options.sector);
  const rows: Omit<BoardRow, "placement">[] = [];
  let considered = 0;
  for (const group of groups.values()) {
    const sample = group[0];
    const factor = factorForCalls(group, options.horizon);
    if (factor.activeGraded === 0) continue;
    considered += 1;
    if (factor.activeGraded < minimum) continue;
    if (options.entity === "analyst") {
      rows.push({
        kind: "analyst",
        slug: sample.analyst.slug,
        name: sample.analyst.name,
        subtitle: `${sample.bank.shortName} · ${sample.analyst.sector}`,
        href: `/analysts/${sample.analyst.slug}`,
        sector: sample.analyst.sector,
        aggregate: factor.aggregate,
        superseded: factor.superseded,
      });
    } else {
      rows.push({
        kind: "bank",
        slug: sample.bank.slug,
        name: sample.bank.name,
        subtitle: sample.bank.headquarters,
        href: `/banks/${sample.bank.slug}`,
        aggregate: factor.aggregate,
        superseded: factor.superseded,
      });
    }
  }
  const placed = rows.map((row) => ({ ...row, placement: placeChad(row.aggregate.avgScore) }));
  const rank = options.rank ?? "points";
  placed.sort((a, b) => compareBoard(a, b, options.order, rank));
  return { rows: placed, minimum, considered };
}

export async function getHome() {
  const [calls, sectors] = await Promise.all([loadCalls(), loadSectors()]);
  const analysts = await leaderboard({ horizon: "90", entity: "analyst", order: "score" });
  const banks = await leaderboard({ horizon: "90", entity: "bank", order: "score" });
  const offenders = await leaderboard({ horizon: "90", entity: "bank", order: "low" });
  const scoring = calls.filter((call) => call.supersession.countsForScoring);
  const directional = scoring.filter((call) => call.grades["90"].followedReturn != null && call.grades["90"].gradeable);
  const featuredHit = [...directional].sort(
    (a, b) => (b.grades["90"].followedReturn ?? 0) - (a.grades["90"].followedReturn ?? 0),
  )[0];
  const featuredMiss = [...directional].sort(
    (a, b) => (a.grades["90"].followedReturn ?? 0) - (b.grades["90"].followedReturn ?? 0),
  )[0];
  const controversial = calls.filter((call) => call.controversial).slice(0, 5);
  const tape = calls.slice(0, 8);
  const analystCount = new Set(calls.map((call) => call.analystId)).size;
  const bankCount = new Set(calls.map((call) => call.bankId)).size;
  const graded90 = scoring.filter((call) => call.grades["90"].gradeable).length;
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
  return analysts.map((analyst) => {
    const mine = calls.filter((call) => call.analystId === analyst.id);
    const aggregate = scoreAggregate(mine, "90");
    return {
      analyst,
      aggregate,
      placement: placeChad(aggregate.avgScore),
      calls: mine.filter((call) => call.supersession.countsForScoring).length,
    };
  });
}

export async function listBanks() {
  const banks = await prisma.bank.findMany({
    include: { analysts: true },
    orderBy: { name: "asc" },
  });
  const calls = await loadCalls();
  return banks.map((bank) => {
    const aggregate = scoreAggregate(
      calls.filter((call) => call.bankId === bank.id),
      "90",
    );
    return { bank, aggregate, placement: placeChad(aggregate.avgScore) };
  });
}

export async function listTickers() {
  const tickers = await prisma.ticker.findMany({ orderBy: { symbol: "asc" } });
  const calls = await loadCalls();
  return tickers.map((ticker) => {
    const mine = calls.filter((call) => call.tickerId === ticker.id);
    const consensus = latestConsensus(mine);
    const aggregate = scoreAggregate(mine, "90");
    return {
      ticker,
      aggregate,
      placement: placeChad(aggregate.avgScore),
      buckets: consensus.buckets,
      voices: consensus.total,
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
    const list = groups.get(call.ticker.sector) ?? [];
    list.push(call);
    groups.set(call.ticker.sector, list);
  }
  return [...groups.entries()]
    .map(([sector, group]) => {
      const factor = factorForCalls(group, horizon);
      return { sector, aggregate: factor.aggregate, superseded: factor.superseded };
    })
    .filter((item) => item.aggregate.graded > 0)
    .sort((a, b) => b.aggregate.graded - a.aggregate.graded);
}

export function latestConsensus(calls: ScoredCall[]) {
  const latest = new Map<string, ScoredCall>();
  const ordered = calls
    .filter((call) => call.supersession.countsForScoring)
    .sort(compareCallChronology);
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
    const list = groups.get(call.analystId) ?? [];
    list.push(call);
    groups.set(call.analystId, list);
  }
  const drafts = [...groups.values()]
    .map((group) => {
      const sample = group[0];
      const factor = factorForCalls(group, horizon);
      return {
        kind: "analyst" as const,
        slug: sample.analyst.slug,
        name: sample.analyst.name,
        subtitle: sample.bank.shortName,
        href: `/analysts/${sample.analyst.slug}`,
        aggregate: factor.aggregate,
        superseded: factor.superseded,
      };
    })
    .filter((row) => row.aggregate.graded > 0);
  return drafts
    .map((row) => ({ ...row, placement: placeChad(row.aggregate.avgScore) }))
    .sort((a, b) => compareBoard(a, b, "score", "points"));
}

function publishedFactor(calls: ScoredCall[]) {
  const factor = factorForCalls(calls, "90");
  return {
    aggregate: factor.aggregate,
    overallFactor: {
      score: factor.score,
      activeGraded: factor.activeGraded,
      superseded: factor.superseded,
      hitRate: factor.hitRate,
    },
  };
}

export async function entityScores(input: { analysts: string[]; banks: string[]; tickers: string[] }) {
  const calls = await loadCalls();
  const analysts = input.analysts.slice(0, 40).map((slug) => {
    const mine = calls.filter((call) => call.analyst.slug === slug);
    const sample = mine[0];
    const factor = publishedFactor(mine);
    return {
      slug,
      name: sample?.analyst.name ?? slug,
      meta: sample ? `${sample.bank.shortName} · ${sample.analyst.sector}` : "",
      href: `/analysts/${slug}`,
      ...factor,
      placement: placeChad(factor.overallFactor.score),
      found: Boolean(sample),
    };
  });
  const banks = input.banks.slice(0, 40).map((slug) => {
    const mine = calls.filter((call) => call.bank.slug === slug);
    const sample = mine[0];
    const factor = publishedFactor(mine);
    return {
      slug,
      name: sample?.bank.name ?? slug,
      meta: sample?.bank.headquarters ?? "",
      href: `/banks/${slug}`,
      ...factor,
      placement: placeChad(factor.overallFactor.score),
      found: Boolean(sample),
    };
  });
  const tickers = input.tickers.slice(0, 40).map((symbol) => {
    const mine = calls.filter((call) => call.ticker.symbol === symbol.toUpperCase());
    const sample = mine[0];
    const factor = publishedFactor(mine);
    return {
      slug: symbol.toUpperCase(),
      name: sample ? `${sample.ticker.symbol} · ${sample.ticker.name}` : symbol.toUpperCase(),
      meta: sample?.ticker.sector ?? "",
      href: `/tickers/${symbol.toUpperCase()}`,
      ...factor,
      placement: placeChad(factor.overallFactor.score),
      found: Boolean(sample),
    };
  });
  return { analysts, banks, tickers };
}
