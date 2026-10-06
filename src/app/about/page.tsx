import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { DATASET } from "@/lib/labels";

export const metadata: Metadata = {
  title: "About",
  description:
    "GradedCalls Analysts grades sourced sell-side calls against historical prices. Not investment advice.",
};

export default function AboutPage() {
  return (
    <article className="about-prose max-w-3xl">
      <PageIntro
        kicker="About"
        title="Banks make the calls. We grade them."
        lede="GradedCalls Analysts scores sourced recommendations against the prices that followed. The calls come from public news pages. The closes are historical. The grade is a formula, not advice."
      />

      <section className="space-y-4 text-sm leading-7 text-muted">
        <h2 className="font-serif text-3xl text-ink">What this ledger is</h2>
        <p>
          Calls in this build come from public news sources. Each call page links to that page. Notes restate the rating and target. They are not a quotation of a research report, and they are not a biography. Firm names are the firms named in those sources. GradedCalls Analysts is not those firms, and it does not speak for anyone who works there. Price history runs through {DATASET.asOfLabel}.
        </p>
        <p>
          Prices are Yahoo Finance adjusted closes (adjusted for splits and dividends). The windows are 14 calendar days, 30 days, 60 days, 90 days, and 1 year. A window that has not elapsed stays ungraded and reads Not graded yet. A graded score of exactly 0 is an empty glass and reads EXIT LIQUIDITY. The badge is a dash, not GC 1.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-7 text-muted">
        <h2 className="font-serif text-3xl text-ink">How to read a grade</h2>
        <p>
          The overall factor is the average 0–100 grade of active calls. The GC score is that average on the GC Scale, from 1 to 10. 70+ is STRONG, 40–69 PROVISIONAL, under 40 WEAK; a graded 0 is EXIT LIQUIDITY. Superseded calls stay in the history and do not enter the factor.
        </p>
        <p>
          The formula, the windows, and the band lines are written out on the{" "}
          <Link href="/methodology" className="text-brass hover:text-ink">
            methodology
          </Link>{" "}
          page. The{" "}
          <Link href="/calls" className="text-brass hover:text-ink">
            call book
          </Link>{" "}
          is the book those grades are computed from. Leaderboards, analyst scorecards, banks, and tickers all read the same book.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-7 text-muted">
        <h2 className="font-serif text-3xl text-ink">What it is not</h2>
        <p>
          Nothing here is investment, financial, legal, or tax advice. GradedCalls Analysts is not an adviser, not a broker, and not affiliated with any bank or ratings publisher. A donation, if one is ever accepted, does not buy a grade or move a rank. Past accuracy is a description of a finished window, not a forecast of the next one.
        </p>
        <p>
          The limits are in the{" "}
          <Link href="/disclaimer" className="text-brass hover:text-ink">
            disclaimer
          </Link>
          . The draft terms and the donations note sit beside it.
        </p>
      </section>
    </article>
  );
}
