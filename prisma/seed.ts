import { PrismaClient } from "@prisma/client";
import path from "path";
import { RATING_NOTCH } from "../src/lib/labels";
import { aggregateGrades, gradeCall } from "../src/lib/scoring";
import { PRICE_ANCHORS, trendPrice } from "../src/lib/price-anchors";
import { ANALYSTS, AS_OF, BANKS, PATH_START, TICKERS, type TickerSeed } from "./universe";

process.env.DATABASE_URL = `file:${path.join(process.cwd(), "prisma", "banktruth.db")}`;

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return function rand() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function addDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dayIndex(date: Date) {
  return Math.round((date.getTime() - PATH_START.getTime()) / 86400000);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function streetTarget(value: number, spot: number) {
  if (spot >= 80) return Math.round(value);
  if (spot >= 20) return Math.round(value * 2) / 2;
  return Math.round(value * 20) / 20;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const MEDIA_ANCHOR: Record<string, string> = {
  "helen-voss": "NFLX",
  "camille-brooks": "DIS",
  "jonathan-hale": "TMUS",
};

const NOTES: Record<string, string[]> = {
  initiate: [
    "Opened coverage with a fresh model and a twelve-month target.",
    "Initiation note leans on relative valuation versus the coverage group.",
    "New coverage. The target assumes margins hold near the last print.",
  ],
  upgrade: [
    "Moved up a notch after the quarter cleared a low bar.",
    "Upgrade cites a cleaner setup into the next two prints.",
    "Rating change follows a round of channel checks that ran ahead of the model.",
  ],
  downgrade: [
    "Cut the rating as the multiple stopped paying for the growth rate.",
    "Downgrade reflects slower orders than the prior note assumed.",
    "Moved down a notch. The target now sits closer to the base case.",
  ],
  reiterate: [
    "Reiterated. No change to the rating after the update.",
    "Same rating. The target was refreshed for the latest share count.",
    "Kept the rating and walked through what would force a change.",
  ],
  target_raise: [
    "Target moved up with the rating unchanged.",
    "Raised the target on a higher out-year margin assumption.",
  ],
  target_cut: [
    "Target came down. The rating stayed put.",
    "Cut the target to reflect a lower multiple versus the group.",
  ],
};

type Path = {
  ticker: TickerSeed;
  prices: number[];
};

function buildPaths(rand: () => number): Map<string, Path> {
  const totalDays = dayIndex(AS_OF);
  const paths = new Map<string, Path>();
  for (const ticker of TICKERS) {
    const anchors = PRICE_ANCHORS[ticker.symbol];
    if (!anchors) throw new Error(`Missing price anchors for ${ticker.symbol}`);
    const prices: number[] = [];
    const band = Math.min(0.06, Math.max(0.025, ticker.vol * 0.12));
    const dailyVol = Math.min(0.012, ticker.vol / Math.sqrt(365));
    let logDev = 0;
    for (let i = 0; i <= totalDays; i += 1) {
      const trend = trendPrice(anchors, addDays(PATH_START, i));
      const shock = clamp(gaussian(rand), -2.5, 2.5) * dailyVol;
      logDev = clamp(logDev * 0.97 + shock, -band, band);
      const price = trend * Math.exp(logDev);
      if (price < trend * 0.92 || price > trend * 1.08) {
        throw new Error(`${ticker.symbol} left the historical band on day ${i}`);
      }
      prices.push(Math.max(1.5, price));
    }
    paths.set(ticker.symbol, { ticker, prices });
  }
  return paths;
}

function priceOn(path: Path, date: Date): number | null {
  const index = dayIndex(date);
  if (index < 0 || index >= path.prices.length) return null;
  return round2(path.prices[index]);
}

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function otherDirection(direction: "up" | "flat" | "down", rand: () => number) {
  const options = (["up", "flat", "down"] as const).filter((item) => item !== direction);
  return options[Math.floor(rand() * options.length)];
}

function ratingFor(direction: "up" | "flat" | "down", rand: () => number) {
  if (direction === "up") return rand() < 0.22 ? "strong_buy" : "buy";
  if (direction === "down") return rand() < 0.55 ? "sell" : "underperform";
  return "hold";
}

function trueDirection(forward: number, threshold: number): "up" | "flat" | "down" {
  if (forward >= threshold) return "up";
  if (forward <= -threshold) return "down";
  return "flat";
}

async function main() {
  const pathRand = mulberry32(20240921);
  const callRand = mulberry32(20240922);
  const paths = buildPaths(pathRand);
  const bankBySlug = new Map(BANKS.map((bank) => [bank.slug, bank]));
  const tickersBySector = new Map<string, TickerSeed[]>();
  for (const ticker of TICKERS) {
    const list = tickersBySector.get(ticker.sector) ?? [];
    list.push(ticker);
    tickersBySector.set(ticker.sector, list);
  }

  const coverage = new Map<string, TickerSeed[]>();
  for (const analyst of ANALYSTS) {
    const pool = [...(tickersBySector.get(analyst.sector) ?? [])];
    if (analyst.sector === "Technology") {
      const media = tickersBySector.get("Media") ?? [];
      if (analyst.slug.endsWith("cho") || analyst.slug.includes("lin") || analyst.slug.includes("brooks")) {
        pool.push(...media.slice(0, 2));
      }
    }
    const count = Math.min(pool.length, pool.length > 6 ? 5 : Math.min(pool.length, 5));
    const chosen: TickerSeed[] = [];
    const bag = [...pool];
    while (chosen.length < count && bag.length > 0) {
      const index = Math.floor(callRand() * bag.length);
      chosen.push(bag.splice(index, 1)[0]);
    }
    const extra = MEDIA_ANCHOR[analyst.slug];
    if (extra) {
      const ticker = TICKERS.find((item) => item.symbol === extra);
      if (ticker && !chosen.some((item) => item.symbol === extra)) chosen.push(ticker);
    }
    coverage.set(analyst.slug, chosen);
  }

  type CallRow = {
    id: string;
    analystId: string;
    bankId: string;
    tickerId: string;
    callDate: Date;
    action: string;
    ratingFrom: string | null;
    ratingTo: string;
    priceTargetFrom: number | null;
    priceTargetTo: number;
    priceAtCall: number;
    price30d: number | null;
    price90d: number | null;
    price1y: number | null;
    note: string;
    controversial: boolean;
    controversialReason: string | null;
    source: string;
  };

  const calls: CallRow[] = [];
  const lastRating = new Map<string, { rating: string; target: number }>();
  let sequence = 1;
  const scheduleStart = new Date("2024-02-06T00:00:00.000Z");
  const scheduleEnd = new Date("2026-06-16T00:00:00.000Z");

  for (const analyst of ANALYSTS) {
    const bank = bankBySlug.get(analyst.bankSlug);
    if (!bank) continue;
    const names = coverage.get(analyst.slug) ?? [];
    if (names.length === 0) continue;
    const accuracy = clamp(0.2 + bank.bias * 0.68 + analyst.personal, 0.12, 0.9);
    let cursor = addDays(scheduleStart, ANALYSTS.indexOf(analyst) % 11);
    let turn = 0;
    while (cursor <= scheduleEnd) {
      const ticker = names[turn % names.length];
      const path = paths.get(ticker.symbol);
      if (!path) {
        cursor = addDays(cursor, 35);
        turn += 1;
        continue;
      }
      const spot = priceOn(path, cursor);
      const future = priceOn(path, addDays(cursor, 90));
      if (spot == null || future == null) {
        cursor = addDays(cursor, 35);
        turn += 1;
        continue;
      }
      const forward = future / spot - 1;
      const truth = trueDirection(forward, 0.05);
      const stated = callRand() < accuracy ? truth : otherDirection(truth, callRand);
      const ratingTo = ratingFor(stated, callRand);
      const key = `${analyst.slug}:${ticker.symbol}`;
      const previous = lastRating.get(key);
      let target: number;
      if (stated === truth) {
        target = streetTarget(future * (1 + (callRand() - 0.5) * 0.08), spot);
      } else if (stated === "up") {
        target = streetTarget(spot * (1.1 + callRand() * 0.18), spot);
      } else if (stated === "down") {
        target = streetTarget(spot * (0.7 + callRand() * 0.14), spot);
      } else {
        target = streetTarget(spot * (0.97 + callRand() * 0.06), spot);
      }
      if (target <= 0) target = streetTarget(spot, spot);

      let action = "initiate";
      if (previous) {
        const fromNotch = RATING_NOTCH[previous.rating] ?? 3;
        const toNotch = RATING_NOTCH[ratingTo] ?? 3;
        if (toNotch > fromNotch) action = "upgrade";
        else if (toNotch < fromNotch) action = "downgrade";
        else if (target > previous.target * 1.03) action = "target_raise";
        else if (target < previous.target * 0.97) action = "target_cut";
        else action = "reiterate";
      }

      const reasons: string[] = [];
      if (previous && Math.abs((RATING_NOTCH[ratingTo] ?? 3) - (RATING_NOTCH[previous.rating] ?? 3)) >= 2) {
        reasons.push("Two-notch rating change");
      }
      if (previous && Math.abs(target - previous.target) / previous.target >= 0.25) {
        reasons.push("Price target moved more than 25%");
      }

      const price30 = priceOn(path, addDays(cursor, 30));
      const price90 = addDays(cursor, 90) <= AS_OF ? future : null;
      const price365 = priceOn(path, addDays(cursor, 365));

      calls.push({
        id: `call_${String(sequence).padStart(4, "0")}`,
        analystId: analyst.slug,
        bankId: analyst.bankSlug,
        tickerId: ticker.symbol,
        callDate: cursor,
        action,
        ratingFrom: previous?.rating ?? null,
        ratingTo,
        priceTargetFrom: previous?.target ?? null,
        priceTargetTo: target,
        priceAtCall: spot,
        price30d: price30 != null && addDays(cursor, 30) <= AS_OF ? price30 : null,
        price90d: price90,
        price1y: price365 != null && addDays(cursor, 365) <= AS_OF ? price365 : null,
        note: pick(callRand, NOTES[action] ?? NOTES.reiterate),
        controversial: reasons.length > 0,
        controversialReason: reasons.length > 0 ? reasons.join(". ") + "." : null,
        source: "demo",
      });
      lastRating.set(key, { rating: ratingTo, target });
      sequence += 1;
      turn += 1;
      cursor = addDays(cursor, 35);
    }
  }

  await prisma.call.deleteMany();
  await prisma.coverage.deleteMany();
  await prisma.analyst.deleteMany();
  await prisma.bank.deleteMany();
  await prisma.ticker.deleteMany();

  await prisma.bank.createMany({
    data: BANKS.map((bank) => ({
      id: bank.slug,
      slug: bank.slug,
      name: bank.name,
      shortName: bank.shortName,
      headquarters: bank.headquarters,
      description: bank.description,
    })),
  });
  await prisma.ticker.createMany({
    data: TICKERS.map((ticker) => ({
      id: ticker.symbol,
      symbol: ticker.symbol,
      name: ticker.name,
      sector: ticker.sector,
      industry: ticker.industry,
      exchange: ticker.exchange,
    })),
  });
  await prisma.analyst.createMany({
    data: ANALYSTS.map((analyst) => ({
      id: analyst.slug,
      slug: analyst.slug,
      name: analyst.name,
      title: analyst.title,
      bankId: analyst.bankSlug,
      sector: analyst.sector,
      startedYear: analyst.startedYear,
      bio: `${analyst.name} is a fictional ${analyst.title.toLowerCase()} on the sample ${bankBySlug.get(analyst.bankSlug)?.shortName} desk, focused on ${analyst.sector.toLowerCase()}. Calls, targets, and this biography are demonstration data.`,
    })),
  });

  const coverageRows = ANALYSTS.flatMap((analyst) =>
    (coverage.get(analyst.slug) ?? []).map((ticker) => ({
      analystId: analyst.slug,
      tickerId: ticker.symbol,
    })),
  );
  await prisma.coverage.createMany({ data: coverageRows });
  await prisma.call.createMany({ data: calls });

  const byBank = new Map<string, ReturnType<typeof gradeCall>[]>();
  for (const call of calls) {
    const list = byBank.get(call.bankId) ?? [];
    list.push(
      gradeCall(
        {
          ratingTo: call.ratingTo,
          priceAtCall: call.priceAtCall,
          priceTargetTo: call.priceTargetTo,
          outcomePrice: call.price90d,
        },
        "90",
      ),
    );
    byBank.set(call.bankId, list);
  }
  const board = [...byBank.entries()]
    .map(([slug, grades]) => ({ slug, ...aggregateGrades(grades) }))
    .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));

  console.log(`Seeded ${BANKS.length} banks, ${ANALYSTS.length} analysts, ${TICKERS.length} tickers, ${calls.length} calls.`);
  console.log("90D bank scores (demo):");
  for (const row of board) {
    const hit = row.hitRate == null ? "—" : `${Math.round(row.hitRate * 100)}%`;
    console.log(`  ${row.slug.padEnd(16)} score ${String(Math.round(row.avgScore ?? 0)).padStart(3)}  hit ${hit.padStart(4)}  n=${row.graded}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
