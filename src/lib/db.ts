import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

function findDemoDatabase(): string | null {
  const candidates = [
    path.join(process.cwd(), "prisma", "banktruth.db"),
    path.join(process.cwd(), "banktruth.db"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Demo deploys ship a seeded SQLite file. Vercel serverless can read the
 * deployment bundle and can write only under /tmp, so the file is copied
 * there before Prisma opens it. A postgres DATABASE_URL bypasses the file.
 */
function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL ?? "";
  if (configured.startsWith("postgres://") || configured.startsWith("postgresql://")) {
    return configured;
  }

  const source = findDemoDatabase();
  if (!source) {
    throw new Error(
      "BankTruth demo database is missing. The build must run `npm run build` so prisma/banktruth.db is seeded and traced into the server bundle.",
    );
  }

  if (process.env.VERCEL) {
    const dest = "/tmp/banktruth.db";
    const sourceStat = fs.statSync(source);
    const destStat = fs.existsSync(dest) ? fs.statSync(dest) : null;
    if (!destStat || destStat.size !== sourceStat.size) {
      fs.copyFileSync(source, dest);
    }
    return `file:${dest}`;
  }

  return `file:${source}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: resolveDatabaseUrl() } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const sqlitePath = path.join(process.cwd(), "prisma", "banktruth.db");
