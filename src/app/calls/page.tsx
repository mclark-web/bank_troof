import type { Metadata } from "next";
import { CallBook, parseBook } from "@/components/tables";
import { HorizonChips, PageIntro } from "@/components/ui";
import { loadCalls } from "@/lib/queries";
import { parseHorizon } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Calls",
  description:
    "The GradedCalls Analysts sample book: each recommendation, the price that followed, and the grade at the horizon you pick.",
};

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const horizonValue = Array.isArray(raw.horizon) ? raw.horizon[0] : raw.horizon;
  const bookValue = Array.isArray(raw.book) ? raw.book[0] : raw.book;
  const horizon = parseHorizon(horizonValue);
  const book = parseBook(bookValue);
  const calls = await loadCalls();
  const current = {
    horizon: horizon === "90" ? undefined : horizon,
    book: book === "all" ? undefined : book,
  };

  return (
    <div>
      <PageIntro
        kicker="Calls"
        title="The sample book"
        lede="Every call in this vintage. Pick a horizon to read the grade that window already has. An open window stays ungraded. A graded score of exactly 0 reads EXIT LIQUIDITY, with an empty glass and a dash, not GC 1."
      />
      <div className="mb-6">
        <HorizonChips path="/calls" current={current} horizon={horizon} />
      </div>
      <CallBook
        calls={calls}
        horizon={horizon}
        book={book}
        path="/calls"
        current={current}
        showAnalyst
        showTicker
      />
    </div>
  );
}
