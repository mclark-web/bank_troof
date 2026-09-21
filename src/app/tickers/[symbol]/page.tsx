import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CallTable, ConsensusBar } from "@/components/tables";
import { AggregateStats, HorizonChips, PageIntro, ScoreBar } from "@/components/ui";
import { WatchButton } from "@/components/watch";
import { prisma } from "@/lib/db";
import { ratingLabel } from "@/lib/labels";
import { aggregateGrades, parseHorizon } from "@/lib/scoring";
import { analystRowsForCalls, getTicker, latestConsensus } from "@/lib/queries";
import { SPLIT_ADJUSTED } from "@/lib/splits";

type Params = { symbol: string };

export async function generateStaticParams() {
  const tickers = await prisma.ticker.findMany({ select: { symbol: true } });
  return tickers.map((ticker) => ({ symbol: ticker.symbol }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { symbol } = await params;
  const data = await getTicker(symbol);
  if (!data) return { title: "Ticker" };
  return {
    title: data.ticker.symbol,
    description: `Sample consensus and historical call grades for ${data.ticker.name}.`,
  };
}

export default async function TickerPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { symbol } = await params;
  const raw = await searchParams;
  const horizon = parseHorizon(Array.isArray(raw.horizon) ? raw.horizon[0] : raw.horizon);
  const data = await getTicker(symbol);
  if (!data) notFound();
  const { ticker, calls } = data;
  const consensus = latestConsensus(calls);
  const aggregate = aggregateGrades(calls.map((call) => call.grades[horizon]));
  const byAnalyst = analystRowsForCalls(calls, horizon);
  const hitPct = aggregate.hitRate == null ? null : Math.round(aggregate.hitRate * 100);

  return (
    <div>
      <PageIntro
        kicker={`${ticker.exchange} · ${ticker.sector}`}
        title={ticker.symbol}
        lede={`${ticker.name} · ${ticker.industry}. Historical grades below use the sample calls only. Consensus is the latest rating from each fictional analyst, not a live street tally.`}
      >
        <WatchButton kind="ticker" slug={ticker.symbol} label={ticker.symbol} meta={ticker.name} />
      </PageIntro>
      {SPLIT_ADJUSTED[ticker.symbol] ? (
        <p className="mb-6 max-w-3xl text-sm leading-6 text-muted">
          Sample prices for {ticker.symbol} are split-adjusted for the {SPLIT_ADJUSTED[ticker.symbol].split}. The whole series uses that scale, so returns and Chad grades are unchanged by the split.
        </p>
      ) : null}

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel p-5">
          <h2 className="font-serif text-2xl">Consensus in the sample</h2>
          <div className="mt-4">
            <ConsensusBar buckets={consensus.buckets} total={consensus.total} />
          </div>
          {consensus.current.length > 0 ? (
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {consensus.current
                .sort((a, b) => b.callDate.getTime() - a.callDate.getTime())
                .map((call) => (
                  <li key={call.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <Link href={`/analysts/${call.analyst.slug}`} className="hover:text-brass">
                      {call.analyst.name}
                      <span className="text-faint"> · {call.bank.shortName}</span>
                    </Link>
                    <Link href={`/calls/${call.id}`} className="num text-xs uppercase tracking-wide text-muted hover:text-brass">
                      {ratingLabel(call.ratingTo)}
                    </Link>
                  </li>
                ))}
            </ul>
          ) : null}
        </section>
        <section className="panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl">Who was right</h2>
            <HorizonChips path={`/tickers/${ticker.symbol}`} current={{}} horizon={horizon} />
          </div>
          <AggregateStats aggregate={aggregate} horizon={horizon} />
          <p className="mt-4 text-sm leading-6 text-muted">
            {hitPct == null
              ? "No graded calls in this window yet."
              : `Under that grade, calls on ${ticker.symbol} were a full hit ${hitPct}% of the time. Hit rate is not the rank.`}
          </p>
        </section>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-serif text-2xl">Accuracy on this name</h2>
        {byAnalyst.length === 0 ? (
          <p className="panel px-4 py-8 text-center text-sm text-muted">No graded calls for this horizon.</p>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Analyst</th>
                  <th>Firm</th>
                  <th>N</th>
                  <th>Hit</th>
                  <th>
                    Chad
                    <span className="mt-1 block font-sans text-[10px] font-normal normal-case tracking-normal text-faint">1–10 · /100</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {byAnalyst.map((row) => (
                  <tr key={row.slug}>
                    <td>
                      <Link href={row.href} className="hover:text-brass">
                        {row.name}
                      </Link>
                    </td>
                    <td className="text-muted">{row.subtitle}</td>
                    <td className="num">{row.aggregate.graded}</td>
                    <td className="num">{row.aggregate.hitRate == null ? "—" : `${Math.round(row.aggregate.hitRate * 100)}%`}</td>
                    <td>
                      <ScoreBar score={row.aggregate.avgScore} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-serif text-2xl">Call history</h2>
        <CallTable calls={calls.slice(0, 40)} horizon={horizon} showAnalyst showTicker={false} />
      </section>
    </div>
  );
}
