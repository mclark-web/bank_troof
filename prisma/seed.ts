import { PrismaClient } from "@prisma/client";
import path from "path";
import { aggregateGrades, gradeCall } from "../src/lib/scoring";
import { isoDate } from "../src/lib/quotes";
import { inspectSupersession } from "../src/lib/supersession";
import { assertLedgerInSync, coverageFromCalls, readExportedCalls } from "../scripts/calls-ledger";
import { ANALYSTS, BANKS, TICKERS } from "./universe";

process.env.DATABASE_URL = `file:${path.join(process.cwd(), "prisma", "banktruth.db")}`;

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

/**
 * Banks, analysts, and tickers still come from the universe.
 * Calls come from data/calls/calls.json, which calls:export writes from the CSV.
 */
async function main() {
  assertLedgerInSync();
  const calls = readExportedCalls().map((call) => ({
    ...call,
    callDate: new Date(call.callDate),
  }));

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
      bio: "",
    })),
  });

  const coverageRows = coverageFromCalls(calls);
  await prisma.coverage.createMany({ data: coverageRows });
  await prisma.call.createMany({ data: calls });

  const supersession = inspectSupersession(
    calls.map((call) => ({
      id: call.id,
      analystId: call.analystId,
      ticker: call.tickerId,
      callDate: call.callDate,
    })),
  );
  console.log(
    `90-day supersession: in-window pairs ${supersession.scan.inWindowPairs}, analyst+ticker groups ${supersession.scan.analystTickerGroupsWithInWindowPair}, nullified ${supersession.scan.callsNullified}, still active ${supersession.scan.callsActive}, outside-window pairs ${supersession.scan.outsideWindowPairs}, same-day groups ${supersession.scan.sameDay.length}, missing dates ${supersession.scan.missingDates.length}, ticker aliases ${supersession.scan.tickerAliases.length}.`,
  );

  const byBank = new Map<string, ReturnType<typeof gradeCall>[]>();
  for (const call of calls) {
    if (!supersession.marks.get(call.id)?.countsForScoring) continue;
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
  console.log("90D bank scores (public ledger, nullified calls excluded):");
  for (const row of board) {
    const hit = row.hitRate == null ? "—" : `${Math.round(row.hitRate * 100)}%`;
    console.log(`  ${row.slug.padEnd(16)} score ${String(Math.round(row.avgScore ?? 0)).padStart(3)}  hit ${hit.padStart(4)}  n=${row.graded}`);
  }
  console.log(`Newest call: ${isoDate(calls.reduce((latest, call) => (call.callDate > latest.callDate ? call : latest)).callDate)}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
