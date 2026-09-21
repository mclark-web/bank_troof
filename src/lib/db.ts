import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const sourceDb = path.join(process.cwd(), "prisma", "banktruth.db");

function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL ?? "";
  if (configured.startsWith("postgres://") || configured.startsWith("postgresql://")) {
    return configured;
  }
  if (process.env.VERCEL) {
    const dest = "/tmp/banktruth.db";
    try {
      if (!fs.existsSync(dest) && fs.existsSync(sourceDb)) {
        fs.copyFileSync(sourceDb, dest);
      }
      if (fs.existsSync(dest)) return `file:${dest}`;
    } catch {
      // Fall through to the build artifact path.
    }
  }
  return `file:${sourceDb}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: resolveDatabaseUrl() } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const sqlitePath = sourceDb;
