import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CallBook, parseBook } from "@/components/tables";
import { Avatar, HorizonChips, hrefWith, OverallFactorCard, PageIntro } from "@/components/ui";
import { WatchButton } from "@/components/watch";
import { prisma } from "@/lib/db";
import { parseHorizon } from "@/lib/scoring";
import { factorForCalls, getAnalyst } from "@/lib/queries";

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
    description: `${data.analyst.name}, fictional ${data.analyst.title} at ${data.analyst.bank.name} in the GradedCalls Analysts demo.`,
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
  const bookValue = Array.isArray(raw.book) ? raw.book[0] : raw.book;
  const horizon = parseHorizon(horizonValue);
  const book = parseBook(bookValue);
  const data = await getAnalyst(slug);
  if (!data) notFound();
  const { analyst, calls } = data;
  const visible = focus === "controversial" ? calls.filter((call) => call.controversial) : calls;
  const factor = factorForCalls(calls, horizon);
  const current = {
    horizon: horizon === "90" ? undefined : horizon,
    focus: focus === "controversial" ? "controversial" : undefined,
    book: book === "all" ? undefined : book,
  };

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
          <h2 className="font-serif text-2xl">Overall factor</h2>
          <HorizonChips path={`/analysts/${analyst.slug}`} current={current} horizon={horizon} />
        </div>
        <OverallFactorCard factor={factor} horizon={horizon} />
      </div>
      <section className="mb-8">
        <h2 className="mb-3 font-serif text-2xl">Coverage</h2>
        <ul className="flex flex-wrap gap-x-2 gap-y-3">
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
          <div className="flex flex-wrap gap-x-2 gap-y-3" role="group" aria-label="Call theme">
            <Link
              href={hrefWith(`/analysts/${analyst.slug}`, current, { focus: null })}
              className={focus === "controversial" ? "chip" : "chip-on"}
            >
              All themes
            </Link>
            <Link
              href={hrefWith(`/analysts/${analyst.slug}`, current, { focus: "controversial" })}
              className={focus === "controversial" ? "chip-on" : "chip"}
            >
              Controversial
            </Link>
          </div>
        </div>
        {focus === "controversial" ? (
          <p className="mb-3 text-sm text-muted">
            This cut is controversial calls only. The overall factor above still uses every active call.
          </p>
        ) : null}
        <CallBook
          calls={visible}
          horizon={horizon}
          book={book}
          path={`/analysts/${analyst.slug}`}
          current={current}
        />
      </section>
    </div>
  );
}
