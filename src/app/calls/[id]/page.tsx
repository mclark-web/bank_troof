import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GradeLedger } from "@/components/grade-ledger";
import { RatingPill } from "@/components/ui";
import { callHeadline, formatDate, usd } from "@/lib/format";
import { actionLabel, ratingLabel } from "@/lib/labels";
import { callPeerScores, getCall } from "@/lib/queries";
import { SPLIT_ADJUSTED } from "@/lib/splits";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const call = await getCall(id);
  if (!call) return { title: "Call" };
  return {
    title: `${call.ticker.symbol} ${ratingLabel(call.ratingTo)}`,
    description: `${call.analyst.name} ${actionLabel(call.action).toLowerCase()} ${call.ticker.symbol}. Sample grade from BankTruth.`,
  };
}

export default async function CallPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const call = await getCall(id);
  if (!call) notFound();
  const peers = await callPeerScores();
  const headline = callHeadline({
    action: call.action,
    symbol: call.ticker.symbol,
    ratingTo: call.ratingTo,
    ratingLabel: ratingLabel(call.ratingTo),
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
        <Fact label="Action" value={actionLabel(call.action)} />
        <Fact label="Rating" value={<RatingPill rating={call.ratingTo} />} hint={call.ratingFrom ? `From ${ratingLabel(call.ratingFrom)}` : "First mark in the sample"} />
        <Fact label="Price target" value={usd(call.priceTargetTo)} hint={call.priceTargetFrom != null ? `Prior ${usd(call.priceTargetFrom)}` : "No prior target"} />
        <Fact label="Price at call" value={usd(call.priceAtCall)} hint={SPLIT_ADJUSTED[call.ticker.symbol] ? "Split-adjusted" : undefined} />
      </dl>
      {SPLIT_ADJUSTED[call.ticker.symbol] ? (
        <p className="mt-3 text-xs text-faint">
          {call.ticker.symbol} demo prices are split-adjusted ({SPLIT_ADJUSTED[call.ticker.symbol].split}). Targets and later prints use the same scale, so the grade is unchanged.
        </p>
      ) : null}

      {call.controversial ? (
        <p className="mt-4 rounded-md border border-brass/40 bg-brass/10 px-4 py-3 text-sm text-brass">
          Flagged controversial. {call.controversialReason}
        </p>
      ) : null}

      <blockquote className="mt-6 max-w-3xl border-l-2 border-brass/70 pl-4 text-lg leading-8 text-ink/90">
        {call.note}
      </blockquote>
      <p className="mt-2 text-xs text-faint">Sample note. Not a published research excerpt.</p>

      <h2 className="mb-3 mt-10 font-serif text-3xl">The grade</h2>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-muted">
        The large number is the Chad score for that window, an integer from 1 to 10. 1 is Chud. 10 is Chad. The same card shows the full score out of 100. It gets chuddy under 70. Top 30% of calls at that horizon earns chaddiness, if the score also cleared 70. A hit is a full direction match. Near-misses earn 35 of 70 direction points and do not count in the hit rate.
      </p>
      <GradeLedger call={call} peers={peers} />

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
      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{label}</dt>
      <dd className="mt-1 text-lg">{value}</dd>
      {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}
