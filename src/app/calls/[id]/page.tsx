import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GradeLedger } from "@/components/grade-ledger";
import { RecommendationPill, SupersessionNotes } from "@/components/ui";
import { callHeadline, formatDate, usd } from "@/lib/format";
import { callPageTitle, deskRatingNote, directionForGradingLabel, recommendationLabel } from "@/lib/labels";
import { getCall } from "@/lib/queries";
import { SPLIT_ADJUSTED } from "@/lib/splits";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const call = await getCall(id);
  if (!call) return { title: "Call" };
  return {
    title: callPageTitle(call.ticker.symbol, call),
    description: `${call.analyst.name}: ${recommendationLabel(call)} on ${call.ticker.symbol}. Sample grade from GradedCalls Analysts.`,
  };
}

export default async function CallPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const call = await getCall(id);
  if (!call) notFound();
  const headline = callHeadline({
    action: call.action,
    symbol: call.ticker.symbol,
    ratingTo: call.ratingTo,
  });

  return (
    <div>
      <p className="kicker">Call grade</p>
      <h1 className="mt-2 max-w-3xl font-serif text-4xl leading-tight tracking-tight md:text-5xl">
        <Link href={`/analysts/${call.analyst.slug}`} className="hover:text-brass">
          {call.analyst.name}
        </Link>{" "}
        <span className="text-muted">{headline}</span>
      </h1>
      <p className="mt-3 text-sm text-muted">
        <Link href={`/banks/${call.bank.slug}`} className="hover:text-brass">
          {call.bank.name}
        </Link>
        {" · "}
        {formatDate(call.callDate)}
        {" · "}
        <Link href={`/tickers/${call.ticker.symbol}`} className="hover:text-brass">
          {call.ticker.symbol}
        </Link>
        {" · "}
        {call.ticker.sector}
      </p>

      <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact
          label="Recommendation"
          value={<RecommendationPill call={call} />}
          hint={deskRatingNote(call)}
        />
        <Fact label="Price target" value={usd(call.priceTargetTo)} hint={call.priceTargetFrom != null ? `Prior ${usd(call.priceTargetFrom)}` : "No prior target"} />
        <Fact label="Price at call" value={usd(call.priceAtCall)} hint={SPLIT_ADJUSTED[call.ticker.symbol] ? "Split-adjusted close" : "Adjusted close"} />
        <Fact
          label="Direction for grading"
          value={<span className="text-base text-muted">{directionForGradingLabel(call.ratingTo)}</span>}
          hint="Buy, Hold, or Sell bucket used by the score."
        />
      </dl>
      {SPLIT_ADJUSTED[call.ticker.symbol] ? (
        <p className="mt-3 text-xs text-faint">
          {call.ticker.symbol} prices are split-adjusted ({SPLIT_ADJUSTED[call.ticker.symbol].split}). The price at the call, the target, and later prints use the same scale.
        </p>
      ) : null}

      {call.controversial ? (
        <p className="mt-4 rounded-md border border-brass/40 bg-brass/10 px-4 py-3 text-sm text-brass">
          Flagged controversial. {call.controversialReason}
        </p>
      ) : null}

      {call.supersession.nullifiedNote || call.supersession.supersedesNote ? (
        <div
          className={
            call.supersession.status === "nullified"
              ? "mt-4 rounded-md border border-miss/40 bg-miss/10 px-4 py-3 text-sm text-muted"
              : "mt-4 rounded-md border border-brass/40 bg-brass/10 px-4 py-3 text-sm text-muted"
          }
        >
          <SupersessionNotes mark={call.supersession} />
          <p className="mt-2 leading-6">
            {call.supersession.status === "nullified"
              ? "The date, recommendation, desk rating, target, entry price, and horizon outcomes stay on this page. This call is left out of the overall factor, the GC score, and the hit rate."
              : "This call is in the active book and counts toward the overall factor. The prior call stays visible and does not score."}
          </p>
          <p className="mt-2">
            <Link href="/methodology#supersession" className="text-brass hover:text-ink">
              How the 90-day rule works
            </Link>
          </p>
        </div>
      ) : null}

      <blockquote className="mt-6 max-w-3xl border-l-2 border-brass/70 pl-4 text-lg leading-8 text-ink/90">
        {call.note}
      </blockquote>
      <p className="mt-2 text-xs text-faint">Sample note. Not a published research excerpt.</p>

      <h2 className="mb-3 mt-10 font-serif text-3xl">The grade</h2>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-muted">
        The large number is the GC score for that window, on the GC Scale from 1 to 10. GC 1 is a poor track record. GC 10 is an excellent one. The same card shows the full score out of 100. Under 40 the GC score is 1–4 and the tube reads WEAK. From 40 up to 70 it is 5–7 and the tube reads PROVISIONAL. At or above 70 it is 8–10 and the tube reads STRONG. A missing print is an empty glass at 0% and reads EXIT LIQUIDITY. A hit is a full direction match. Near-misses earn 35 of 70 direction points and do not count in the hit rate.
      </p>
      <GradeLedger call={call} />

      <p className="mt-6 text-sm text-muted">
        <Link href="/methodology" className="text-brass hover:text-ink">
          Read the full formula
        </Link>
      </p>
    </div>
  );
}

function Fact({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="panel px-4 py-3">
      <dt className="font-mono text-xs uppercase tracking-[0.16em] text-faint">{label}</dt>
      <dd className="mt-1 text-lg">{value}</dd>
      {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}
