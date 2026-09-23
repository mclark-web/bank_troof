import path from "path";
import { PrismaClient } from "@prisma/client";
import { applyCallFeed } from "../src/lib/imports/apply";
import { CsvCallFeed } from "../src/lib/imports/csv-feed";

const fileArg = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
const replace = process.argv.includes("--replace");

if (!fileArg) {
  console.error("Usage: npm run import:calls -- <file.csv> [--replace]");
  process.exit(1);
}

const dbPath = path.join(process.cwd(), "prisma", "banktruth.db");
const prisma = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } });

applyCallFeed(prisma, new CsvCallFeed(path.resolve(fileArg)), { replace })
  .then((result) => {
    console.log(`Imported ${result.calls} calls from ${result.source}${replace ? " (replaced existing rows)" : ""}.`);
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
