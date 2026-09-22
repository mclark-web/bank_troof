import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CallTable } from "@/components/tables";
import { AggregateStats, Avatar, HorizonChips, PageIntro } from "@/components/ui";
import { WatchButton } from "@/components/watch";
import { prisma } from "@/lib/db";
import { parseHorizon } from "@/lib/scoring";
import { getAnalyst, rankedPeerScores, scoreAggregate } from "@/lib/queries";

type Params = { slug: string };

export async function generateStaticParams() {
  const analysts = await prisma.analyst.findMany({ select: { slug: true } });
  return analysts.map((analyst) => ({ slug: analyst.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAnalyst(slug);
  if (!data) return { title: "Analyst" };
  return {
    title: data.analyst.name,
    description: `${data.analyst.name}, fictional ${data.analyst.title} at ${data.analyst.bank.name} in the Charoof Analysts demo.`,
  };
}

export default async function AnalystPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const raw = await searchParams;
  const horizonValue = Array.isArray(raw.horizon) ? raw.horizon[0] : raw.horizon;
  const focus = Array.isArray(raw.focus) ? raw.focus[0] : raw.focus;
  const horizon = parseHorizon(horizonValue);
  const data = await getAnalyst(slug);
  if (!data) notFound();
  const { analyst, calls } = data;
  const visible = focus === "controversial" ? calls.filter((call) => call.controversial) : calls;
  const aggregate = scoreAggregate(calls, horizon);
  const nullified = calls.filter((call) => call.supersession.status === "nullified").length;
  const peers = await rankedPeerScores("analyst", horizon);
  const shown = visible.slice(0, 40);

  return (
    <div>
      <PageIntro kicker="Analyst scorecard" title={analyst.name} lede={analyst.bio}>
        <WatchButton kind="analyst" slug={analyst.slug} label={analyst.name} meta={`${analyst.bank.shortName} · ${analyst.sector}`} />
      </PageIntro>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={analyst.name} seed={analyst.slug} />
        <div className="text-sm text-muted">
          <p>
            {analyst.title} ·{" "}
            <Link href={`/banks/${analyst.bank.slug}`} className="text-ink hover:text-brass">
              {analyst.bank.name}
            </Link>
          </p>
          <p className="mt-1">
            {analyst.sector} · sample coverage since {analyst.startedYear}
          </p>
          <p className="mt-1 text-faint">{analyst.bank.headquarters}</p>
        </div>
      </div>
      <div className="panel mb-6 p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">Record</h2>
          <HorizonChips path={`/analysts/${analyst.slug}`} current={{ focus }} horizon={horizon} />
        </div>
        <AggregateStats aggregate={aggregate} horizon={horizon} peers={peers} />
        {nullified > 0 ? (
          <p className="mt-4 text-xs leading-5 text-faint">
            {nullified} earlier {nullified === 1 ? "call stays" : "calls stay"} in the list and {nullified === 1 ? "is" : "are"} left out of this record. A later call on the same ticker within 90 days replaces the prior one for scoring.
          </p>
        ) : null}
      </div>
      <section className="mb-8">
        <h2 className="mb-3 font-serif text-2xl">Coverage</h2>
        <ul className="flex flex-wrap gap-2">
          {analyst.coverage.map((item) => (
            <li key={item.tickerId}>
              <Link href={`/tickers/${item.ticker.symbol}`} className="chip">
                <span className="num mr-2 text-ink">{item.ticker.symbol}</span>
                {item.ticker.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-2xl">Calls</h2>
          <div className="flex gap-2">
            <Link href={`/analysts/${analyst.slug}?horizon=${horizon}`} className={focus === "controversial" ? "chip" : "chip-on"}>
              All
            </Link>
            <Link
              href={`/analysts/${analyst.slug}?horizon=${horizon}&focus=controversial`}
              className={focus === "controversial" ? "chip-on" : "chip"}
            >
              Controversial
            </Link>
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="panel px-4 py-8 text-center text-sm text-muted">No calls in this cut.</p>
        ) : (
          <CallTable calls={shown} horizon={horizon} />
        )}
        {visible.length > shown.length ? (
          <p className="mt-3 text-xs text-faint">Showing the {shown.length} most recent of {visible.length} calls.</p>
        ) : null}
      </section>
    </div>
  );
}
