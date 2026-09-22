import path from "path";
import { PrismaClient } from "@prisma/client";
import { recommendationLabel } from "../src/lib/labels";
import { inspectSupersession } from "../src/lib/supersession";

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${path.join(process.cwd(), "prisma", "banktruth.db")}` } },
});

async function main() {
  const calls = await prisma.call.findMany({ include: { ticker: true, analyst: true } });
  const inspection = inspectSupersession(
    calls.map((call) => ({
      id: call.id,
      analystId: call.analystId,
      ticker: call.ticker.symbol,
      callDate: call.callDate,
    })),
  );
  const byPair = new Map<string, typeof calls>();
  for (const call of calls) {
    const key = `${call.analystId}|${call.ticker.symbol}`;
    const list = byPair.get(key) ?? [];
    list.push(call);
    byPair.set(key, list);
  }
  const streaks: { key: string; nullified: number; active: number; dates: string[] }[] = [];
  for (const [key, list] of byPair) {
    const sorted = [...list].sort((a, b) => a.callDate.getTime() - b.callDate.getTime() || a.id.localeCompare(b.id));
    let nullified = 0;
    let active = 0;
    const dates: string[] = [];
    for (const call of sorted) {
      const mark = inspection.marks.get(call.id);
      if (!mark) continue;
      if (mark.status === "nullified") nullified += 1;
      else active += 1;
      dates.push(`${call.callDate.toISOString().slice(0, 10)}${mark.status === "nullified" ? "*" : ""}`);
    }
    if (nullified > 0) streaks.push({ key, nullified, active, dates });
  }
  streaks.sort((a, b) => b.nullified - a.nullified || b.dates.length - a.dates.length);
  const chainOfThree = streaks.filter((streak) => streak.nullified >= 2).length;
  console.log(
    JSON.stringify(
      {
        calls: inspection.scan.calls,
        inWindowPairs: inspection.scan.inWindowPairs,
        groups: inspection.scan.analystTickerGroupsWithInWindowPair,
        nullified: inspection.scan.callsNullified,
        active: inspection.scan.callsActive,
        outside: inspection.scan.outsideWindowPairs,
        sameDay: inspection.scan.sameDay.length,
        missingDates: inspection.scan.missingDates.length,
        aliases: inspection.scan.tickerAliases,
        duplicateIds: inspection.scan.duplicateIds,
        chainOfThreeOrMore: chainOfThree,
        longest: streaks.slice(0, 5),
      },
      null,
      2,
    ),
  );
  const sample = streaks.find((streak) => streak.nullified >= 2) ?? streaks[0];
  const [analystId, ticker] = sample.key.split("|");
  const analyst = calls.find((call) => call.analystId === analystId);
  console.log("EXAMPLE", analyst?.analyst.slug, analyst?.analyst.name, ticker);
  const rows = calls
    .filter((call) => call.analystId === analystId && call.ticker.symbol === ticker)
    .sort((a, b) => a.callDate.getTime() - b.callDate.getTime() || a.id.localeCompare(b.id));
  for (const call of rows) {
    const mark = inspection.marks.get(call.id);
    console.log(
      [
        call.id,
        call.callDate.toISOString().slice(0, 10),
        recommendationLabel(call),
        call.ratingTo,
        mark?.status,
        mark?.nullifiedNote ?? "",
        mark?.supersedesNote ?? "",
      ].join(" | "),
    );
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
