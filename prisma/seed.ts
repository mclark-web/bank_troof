import { PrismaClient } from "@prisma/client";
import path from "path";
import { RATING_NOTCH } from "../src/lib/labels";
import { aggregateGrades, gradeCall, HORIZONS, type HorizonKey } from "../src/lib/scoring";
import { adjustedClose, clampTargetToSpot, isoDate, pricesForCall } from "../src/lib/quotes";
import { ANALYSTS, BANKS, TICKERS, type TickerSeed } from "./universe";

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

function addDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
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

const RATING_LADDER = ["sell", "underperform", "hold", "buy", "strong_buy"] as const;

function isWeekday(date: Date) {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

function nextWeekday(date: Date) {
  let cursor = new Date(date.getTime());
  while (!isWeekday(cursor)) cursor = addDays(cursor, 1);
  return cursor;
}

function shiftRating(rating: string, delta: number) {
  const index = RATING_LADDER.indexOf(rating as (typeof RATING_LADDER)[number]);
  const start = index < 0 ? 2 : index;
  return RATING_LADDER[Math.max(0, Math.min(RATING_LADDER.length - 1, start + delta))];
}

function fictionalTarget(
  rand: () => number,
  stated: "up" | "flat" | "down",
  matched: boolean,
  future: number | null,
  spot: number,
) {
  let target: number;
  if (future != null && matched) {
    target = streetTarget(future * (1 + (rand() - 0.5) * 0.08), spot);
  } else if (stated === "up") {
    target = streetTarget(spot * (1.1 + rand() * 0.18), spot);
  } else if (stated === "down") {
    target = streetTarget(spot * (0.7 + rand() * 0.14), spot);
  } else {
    target = streetTarget(spot * (0.97 + rand() * 0.06), spot);
  }
  if (target <= 0) target = streetTarget(spot, spot);
  return streetTarget(clampTargetToSpot(target, spot), spot);
}

function realizedMove(
  prices: ReturnType<typeof pricesForCall>,
  spot: number,
): { future: number; truth: "up" | "flat" | "down" } | null {
  const windows: { price: number | null; key: HorizonKey }[] = [
    { price: prices.price90d, key: "90" },
    { price: prices.price60d, key: "60" },
    { price: prices.price30d, key: "30" },
    { price: prices.price14d, key: "14" },
  ];
  for (const window of windows) {
    if (window.price == null) continue;
    const forward = window.price / spot - 1;
    return { future: window.price, truth: trueDirection(forward, HORIZONS[window.key].threshold) };
  }
  return null;
}

async function main() {
  const callRand = mulberry32(20240922);
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
    price14d: number | null;
    price30d: number | null;
    price60d: number | null;
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
      const spot = adjustedClose(ticker.symbol, cursor);
      const prices = pricesForCall(ticker.symbol, cursor);
      const future = prices.price90d;
      if (prices.price14d == null || prices.price30d == null || prices.price60d == null || future == null) {
        throw new Error(
          `Missing adjusted close for ${ticker.symbol} on ${isoDate(cursor)} inside 2 weeks, 30, 60, or 90 days. Refusing to invent a price.`,
        );
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
      target = streetTarget(clampTargetToSpot(target, spot), spot);

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
        price14d: prices.price14d,
        price30d: prices.price30d,
        price60d: prices.price60d,
        price90d: future,
        price1y: prices.price1y,
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

  // July–September 2026 is denser on purpose. The spring book was one call every
  // 35 days and stopped in June, so the newest tape looked stale. These rows use
  // the same adjusted closes. A horizon past 21 Sep 2026 is left null.
  const recentRand = mulberry32(20260921);
  const recentEnd = new Date("2026-09-21T00:00:00.000Z");
  const freshDates = new Set<string>();

  function publishRecent(analyst: (typeof ANALYSTS)[number], ticker: TickerSeed, cursor: Date) {
    const bank = bankBySlug.get(analyst.bankSlug);
    if (!bank) return;
    const accuracy = clamp(0.2 + bank.bias * 0.68 + analyst.personal, 0.12, 0.9);
    const spot = adjustedClose(ticker.symbol, cursor);
    const prices = pricesForCall(ticker.symbol, cursor);
    const moved = realizedMove(prices, spot);
    const matched = moved != null && recentRand() < accuracy;
    const stated: "up" | "flat" | "down" =
      moved == null
        ? recentRand() < 0.42
          ? "up"
          : recentRand() < 0.72
            ? "down"
            : "flat"
        : matched
          ? moved.truth
          : otherDirection(moved.truth, recentRand);
    const key = `${analyst.slug}:${ticker.symbol}`;
    const previous = lastRating.get(key);
    let ratingTo = ratingFor(stated, recentRand);
    let target = fictionalTarget(recentRand, stated, matched, moved?.future ?? null, spot);
    if (previous) {
      const notch = RATING_NOTCH[previous.rating] ?? 3;
      if (stated === "up" && notch < 5) {
        ratingTo = shiftRating(previous.rating, recentRand() < 0.32 ? 2 : 1);
      } else if (stated === "down" && notch > 1) {
        ratingTo = shiftRating(previous.rating, recentRand() < 0.32 ? -2 : -1);
      } else {
        ratingTo = previous.rating;
        const lift = stated === "down" ? -1 : 1;
        const punch = recentRand() < 0.22 ? 0.28 : 0.06 + recentRand() * 0.12;
        target = streetTarget(clampTargetToSpot(previous.target * (1 + lift * punch), spot), spot);
      }
    }

    let action = "initiate";
    const reasons: string[] = [];
    if (previous) {
      const fromNotch = RATING_NOTCH[previous.rating] ?? 3;
      const toNotch = RATING_NOTCH[ratingTo] ?? 3;
      if (toNotch > fromNotch) action = "upgrade";
      else if (toNotch < fromNotch) action = "downgrade";
      else if (target > previous.target * 1.03) action = "target_raise";
      else if (target < previous.target * 0.97) action = "target_cut";
      else action = "reiterate";
      if (Math.abs(toNotch - fromNotch) >= 2) reasons.push("Two-notch rating change");
      if (Math.abs(target - previous.target) / previous.target >= 0.25) {
        reasons.push("Price target moved more than 25%");
      }
    }

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
      price14d: prices.price14d,
      price30d: prices.price30d,
      price60d: prices.price60d,
      price90d: prices.price90d,
      price1y: prices.price1y,
      note: `Demo. ${pick(recentRand, NOTES[action] ?? NOTES.reiterate)}`,
      controversial: reasons.length > 0,
      controversialReason: reasons.length > 0 ? reasons.join(". ") + "." : null,
      source: "demo",
    });
    freshDates.add(isoDate(cursor));
    lastRating.set(key, { rating: ratingTo, target });
    sequence += 1;
    const covered = coverage.get(analyst.slug) ?? [];
    if (!covered.some((item) => item.symbol === ticker.symbol)) covered.push(ticker);
  }

  for (const analyst of ANALYSTS) {
    const names = coverage.get(analyst.slug) ?? [];
    if (!bankBySlug.get(analyst.bankSlug) || names.length === 0) continue;
    let cursor = nextWeekday(addDays(new Date("2026-07-01T00:00:00.000Z"), ANALYSTS.indexOf(analyst) % 5));
    let turn = ANALYSTS.indexOf(analyst) % names.length;
    while (cursor <= recentEnd) {
      publishRecent(analyst, names[turn % names.length], cursor);
      turn += 1;
      cursor = nextWeekday(addDays(cursor, 7 + Math.floor(recentRand() * 3)));
    }
  }

  const showcase = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "NFLX", "JPM", "UNH", "XOM", "WMT", "CAT"];
  for (const symbol of showcase) {
    if (calls.some((call) => call.tickerId === symbol && isoDate(call.callDate) >= "2026-09-01")) continue;
    const ticker = TICKERS.find((item) => item.symbol === symbol);
    if (!ticker) throw new Error(`Showcase ticker ${symbol} is not in the universe.`);
    const analyst =
      ANALYSTS.find((item) => (coverage.get(item.slug) ?? []).some((name) => name.symbol === symbol)) ??
      ANALYSTS.find((item) => item.sector === ticker.sector);
    if (!analyst) throw new Error(`No demo analyst can file a September call on ${symbol}.`);
    publishRecent(analyst, ticker, new Date("2026-09-16T00:00:00.000Z"));
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
  const canary = calls.find((call) => call.id === "call_0024");
  const canarySpot = adjustedClose("NFLX", new Date("2026-04-21T00:00:00.000Z"));
  if (!canary || canary.tickerId !== "NFLX" || canary.callDate.toISOString().slice(0, 10) !== "2026-04-21") {
    throw new Error("call_0024 is not the NFLX call on 2026-04-21.");
  }
  if (canary.priceAtCall !== canarySpot || canary.price90d == null) {
    throw new Error(`call_0024 price_at_call ${canary.priceAtCall} does not match the adjusted close ${canarySpot}.`);
  }
  for (const call of calls) {
    const spot = adjustedClose(call.tickerId, call.callDate);
    if (call.priceAtCall !== spot) {
      throw new Error(`${call.id} ${call.tickerId} price_at_call ${call.priceAtCall} does not match adjusted close ${spot}.`);
    }
    const expected = pricesForCall(call.tickerId, call.callDate);
    if (
      call.price14d !== expected.price14d ||
      call.price30d !== expected.price30d ||
      call.price60d !== expected.price60d ||
      call.price90d !== expected.price90d ||
      call.price1y !== expected.price1y
    ) {
      throw new Error(`${call.id} ${call.tickerId} horizon price does not match the adjusted close.`);
    }
    const multiple = call.priceTargetTo / call.priceAtCall;
    if (multiple < 0.5 || multiple > 1.6) {
      throw new Error(`${call.id} target ${call.priceTargetTo} is outside a plausible band around ${call.priceAtCall}.`);
    }
    if (isoDate(call.callDate) > "2026-09-21") {
      throw new Error(`${call.id} is dated after the price history.`);
    }
  }

  const changeActions = new Set(["upgrade", "downgrade", "target_raise", "target_cut"]);
  const changes = calls.filter((call) => changeActions.has(call.action));
  const recentChanges = changes.filter((call) => isoDate(call.callDate) >= "2026-07-01");
  const september = calls.filter((call) => isoDate(call.callDate) >= "2026-09-01");
  const newest = calls.reduce((latest, call) => (call.callDate > latest.callDate ? call : latest));
  if (recentChanges.length / changes.length < 0.3) {
    throw new Error(
      `Only ${recentChanges.length} of ${changes.length} rating or target changes fall in Jul–Sep 2026.`,
    );
  }
  if (september.length < 60 || isoDate(newest.callDate) < "2026-09-15") {
    throw new Error(
      `September book is thin (${september.length} calls, newest ${isoDate(newest.callDate)}).`,
    );
  }
  const septemberSymbols = new Set(september.map((call) => call.tickerId));
  for (const symbol of ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "JPM", "UNH", "XOM", "WMT"]) {
    if (!septemberSymbols.has(symbol)) {
      throw new Error(`${symbol} has no September 2026 demo call.`);
    }
  }

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
  const byMonth = new Map<string, number>();
  for (const call of calls) {
    const month = isoDate(call.callDate).slice(0, 7);
    if (month < "2026-03") continue;
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
  }
  console.log(
    `Jul–Sep changes: ${recentChanges.length}/${changes.length}. September calls: ${september.length}. Fresh dates: ${freshDates.size}.`,
  );
  console.log(
    [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => `${month}=${count}`)
      .join("  "),
  );
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
