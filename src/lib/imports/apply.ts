import type { PrismaClient } from "@prisma/client";
import type { CallFeedAdapter } from "./types";

export async function applyCallFeed(
  prisma: PrismaClient,
  adapter: CallFeedAdapter,
  options: { replace?: boolean } = {},
): Promise<{ calls: number; source: string }> {
  const records = await adapter.pull();
  if (options.replace) {
    await prisma.call.deleteMany();
    await prisma.coverage.deleteMany();
    await prisma.analyst.deleteMany();
    await prisma.bank.deleteMany();
    await prisma.ticker.deleteMany();
  }

  for (const record of records) {
    await prisma.bank.upsert({
      where: { id: record.bankSlug },
      update: {
        name: record.bankName,
        shortName: record.bankShort,
        headquarters: record.headquarters,
      },
      create: {
        id: record.bankSlug,
        slug: record.bankSlug,
        name: record.bankName,
        shortName: record.bankShort,
        headquarters: record.headquarters,
        description:
          "Profile created from an imported call feed. Replace this description when a licensed source is connected.",
      },
    });
    await prisma.ticker.upsert({
      where: { id: record.ticker },
      update: { name: record.company, sector: record.sector, industry: record.industry, exchange: record.exchange },
      create: {
        id: record.ticker,
        symbol: record.ticker,
        name: record.company,
        sector: record.sector,
        industry: record.industry,
        exchange: record.exchange,
      },
    });
    await prisma.analyst.upsert({
      where: { id: record.analystSlug },
      update: { name: record.analystName, title: record.analystTitle, sector: record.sector, bankId: record.bankSlug },
      create: {
        id: record.analystSlug,
        slug: record.analystSlug,
        name: record.analystName,
        title: record.analystTitle,
        bankId: record.bankSlug,
        sector: record.sector,
        bio: `${record.analystName} was added from an imported call feed.`,
        startedYear: 2020,
      },
    });
    await prisma.coverage.upsert({
      where: { analystId_tickerId: { analystId: record.analystSlug, tickerId: record.ticker } },
      update: {},
      create: { analystId: record.analystSlug, tickerId: record.ticker },
    });
    const callData = {
      analystId: record.analystSlug,
      bankId: record.bankSlug,
      tickerId: record.ticker,
      callDate: new Date(`${record.date}T00:00:00.000Z`),
      action: record.action,
      ratingFrom: record.ratingFrom,
      ratingTo: record.ratingTo,
      priceTargetFrom: record.priceTargetFrom,
      priceTargetTo: record.priceTargetTo,
      priceAtCall: record.priceAtCall,
      price30d: record.price30d,
      price90d: record.price90d,
      price1y: record.price1y,
      note: record.note,
      controversial: false,
      controversialReason: null,
      source: adapter.name,
    };
    await prisma.call.upsert({
      where: { id: record.id },
      update: callData,
      create: { id: record.id, ...callData },
    });
  }

  return { calls: records.length, source: adapter.name };
}
