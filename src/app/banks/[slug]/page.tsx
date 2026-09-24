import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CallBook, parseBook } from "@/components/tables";
import { HorizonChips, OverallFactorCard, PageIntro, ScoreBar } from "@/components/ui";
import { WatchButton } from "@/components/watch";
import { prisma } from "@/lib/db";
import { parseHorizon } from "@/lib/scoring";
import { analystRowsForCalls, factorForCalls, getBank, sectorBreakdown } from "@/lib/queries";

type Params = { slug: string };

export async function generateStaticParams() {
  const banks = await prisma.bank.findMany({ select: { slug: true } });
  return banks.map((bank) => ({ slug: bank.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBank(slug);
  if (!data) return { title: "Bank" };
  return {
    title: data.bank.name,
    description: `Sample scorecard for the ${data.bank.name} desk in the GradedCalls Analysts demo.`,
  };
}

export default async function BankPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const raw = await searchParams;
  const horizon = parseHorizon(Array.isArray(raw.horizon) ? raw.horizon[0] : raw.horizon);
  const book = parseBook(Array.isArray(raw.book) ? raw.book[0] : raw.book);
  const data = await getBank(slug);
  if (!data) notFound();
  const { bank, calls } = data;
  const factor = factorForCalls(calls, horizon);
  const sectors = sectorBreakdown(calls, horizon);
  const roster = analystRowsForCalls(calls, horizon);
  const maxGraded = Math.max(...sectors.map((item) => item.aggregate.graded), 1);
  const current = {
    horizon: horizon === "90" ? undefined : horizon,
    book: book === "all" ? undefined : book,
  };

  return (
    <div>
      <PageIntro kicker="Firm scorecard" title={bank.name} lede={bank.description}>
        <WatchButton kind="bank" slug={bank.slug} label={bank.name} meta={bank.headquarters} />
      </PageIntro>
      <p className="mb-6 text-sm text-muted">
        {bank.headquarters} · {bank.analysts.length} fictional analysts in the sample
      </p>
      <div className="panel mb-8 p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">Overall factor</h2>
          <HorizonChips path={`/banks/${bank.slug}`} current={current} horizon={horizon} />
        </div>
        <OverallFactorCard factor={factor} horizon={horizon} />
      </div>
      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="font-serif text-2xl">By sector</h2>
          <ul className="mt-4 space-y-3">
            {sectors.map((item) => (
              <li key={item.sector}>
                <div className="mb-1 flex justify-between text-sm">
                  <Link href={`/leaderboards?view=banks&sector=${encodeURIComponent(item.sector)}`} className="hover:text-brass">
                    {item.sector}
                  </Link>
                  <span className="num text-muted">
                    {item.aggregate.hitRate == null ? "—" : `${Math.round(item.aggregate.hitRate * 100)}% hit`} · n=
                    {item.aggregate.graded}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-brass/80"
                    style={{ width: `${(item.aggregate.graded / maxGraded) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel overflow-hidden">
          <h2 className="border-b border-line px-5 py-4 font-serif text-2xl">Roster</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Analyst</th>
                <th>Hit</th>
                <th>
                  Overall factor
                  <span className="mt-1 block font-sans text-xs font-normal normal-case tracking-normal text-faint">/100 · GC 1–10</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {roster.map((row) => (
                <tr key={row.slug}>
                  <td>
                    <Link href={row.href} className="hover:text-brass">
                      {row.name}
                    </Link>
                    <p className="text-xs text-faint">{row.subtitle}</p>
                  </td>
                  <td className="num">{row.aggregate.hitRate == null ? "—" : `${Math.round(row.aggregate.hitRate * 100)}%`}</td>
                  <td>
                    <ScoreBar score={row.aggregate.avgScore} placement={row.placement} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="mb-3 font-serif text-2xl">Calls</h2>
        <CallBook
          calls={calls}
          horizon={horizon}
          book={book}
          path={`/banks/${bank.slug}`}
          current={current}
          showAnalyst
        />
      </section>
    </div>
  );
}
