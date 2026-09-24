import type { Metadata } from "next";
import Link from "next/link";
import { AnalystsBoard, parseBoardBook, parseBoardHorizon, parseBoardKind } from "@/components/analysts-board";
import { ScaleLegend, ScoreBar } from "@/components/ui";
import { listAnalysts, loadCalls } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Analysts",
  description:
    "Street calls graded against prices adjusted for splits and dividends. Two recent calls use the raw close on the call date. Sample names, real closes, on the GradedCalls Analysts board.",
};

export default async function AnalystsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const horizonValue = Array.isArray(raw.horizon) ? raw.horizon[0] : raw.horizon;
  const kindValue = Array.isArray(raw.kind) ? raw.kind[0] : raw.kind;
  const bookValue = Array.isArray(raw.book) ? raw.book[0] : raw.book;
  const [calls, rows] = await Promise.all([loadCalls(), listAnalysts()]);

  return (
    <div>
      <AnalystsBoard
        calls={calls}
        horizon={parseBoardHorizon(horizonValue)}
        kind={parseBoardKind(kindValue)}
        book={parseBoardBook(bookValue)}
      />

      <section className="mt-12">
        <h2 className="font-sans text-2xl tracking-tight">Analyst directory</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          The 90-day overall factor for each sample name. The tube is that same 0–100 average. Superseded calls stay out of it.
        </p>
        <ScaleLegend className="mb-3 mt-3" />
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Analyst</th>
                <th>Firm</th>
                <th className="hidden sm:table-cell">Sector</th>
                <th>N</th>
                <th>Hit</th>
                <th>
                  Overall factor
                  <span className="mt-1 block font-sans text-xs font-normal normal-case tracking-normal text-faint">/100 · GC 1–10</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ analyst, aggregate, placement }) => (
                <tr key={analyst.id}>
                  <td>
                    <Link href={`/analysts/${analyst.slug}`} className="font-medium hover:text-brass">
                      {analyst.name}
                    </Link>
                    <p className="text-xs text-faint sm:hidden">{analyst.sector}</p>
                  </td>
                  <td>
                    <Link href={`/banks/${analyst.bank.slug}`} className="text-muted hover:text-brass">
                      {analyst.bank.shortName}
                    </Link>
                  </td>
                  <td className="hidden text-muted sm:table-cell">{analyst.sector}</td>
                  <td className="num">{aggregate.graded}</td>
                  <td className="num">{aggregate.hitRate == null ? "—" : `${Math.round(aggregate.hitRate * 100)}%`}</td>
                  <td>
                    <ScoreBar score={aggregate.avgScore} placement={placement} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
