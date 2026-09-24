import type { Metadata } from "next";
import { CallBook, parseBook } from "@/components/tables";
import { HorizonChips, PageIntro } from "@/components/ui";
import { loadCalls } from "@/lib/queries";
import { parseHorizon } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Calls",
  description:
    "The most recent calls in the GradedCalls Analysts sample: 40 of the active book and 40 of the superseded book.",
};

const SHOWN_PER_SECTION = 40;

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
  const activeTotal = calls.filter((call) => call.supersession.status === "active").length;
  const supersededTotal = calls.filter((call) => call.supersession.status === "nullified").length;
  const activeShown = Math.min(SHOWN_PER_SECTION, activeTotal);
  const supersededShown = Math.min(SHOWN_PER_SECTION, supersededTotal);
  const counts =
    book === "active"
      ? `Showing ${activeShown} of ${activeTotal} active.`
      : book === "superseded"
        ? `Showing ${supersededShown} of ${supersededTotal} superseded.`
        : `Showing ${activeShown} of ${activeTotal} active, ${supersededShown} of ${supersededTotal} superseded.`;
  const current = {
    horizon: horizon === "90" ? undefined : horizon,
    book: book === "all" ? undefined : book,
  };

  return (
    <div>
      <PageIntro
        kicker="Calls"
        title="The sample book"
        lede="The most recent calls in this vintage. Pick a horizon to read the grade that window already has. An open window stays ungraded. A graded score of exactly 0 reads EXIT LIQUIDITY, with an empty glass and a dash, not GC 1."
      />
      <p className="mb-6 text-sm leading-6 text-muted">{counts}</p>
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
        perSection={SHOWN_PER_SECTION}
      />
    </div>
  );
}
