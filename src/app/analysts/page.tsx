import type { Metadata } from "next";
import Link from "next/link";
import { AnalystsBoard, parseBoardBook, parseBoardHorizon, parseBoardKind, prepareAnalystsBoard } from "@/components/analysts-board";
import { ScaleLegend, ScoreBar, hrefWith } from "@/components/ui";
import { listAnalysts, loadCalls } from "@/lib/queries";
import { routeMeta } from "@/lib/site-urls";

const DIRECTORY_PAGE = 40;

function parsePage(value: string | undefined): number {
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) return 1;
  return page;
}

export const metadata: Metadata = {
  title: "Analysts",
  description:
    "Street calls graded against prices adjusted for splits and dividends. Public news sources and adjusted closes, on the GradedCalls Analysts board.",
  ...routeMeta("/analysts"),
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
  const pageValue = Array.isArray(raw.page) ? raw.page[0] : raw.page;
  const horizon = parseBoardHorizon(horizonValue);
  const kind = parseBoardKind(kindValue);
  const book = parseBoardBook(bookValue);
  const [calls, rows] = await Promise.all([loadCalls(), listAnalysts()]);
  const pageCount = Math.max(1, Math.ceil(rows.length / DIRECTORY_PAGE));
  const page = Math.min(parsePage(pageValue), pageCount);
  const start = (page - 1) * DIRECTORY_PAGE;
  const directory = rows.slice(start, start + DIRECTORY_PAGE);
  const directoryQuery = {
    horizon: horizon === "all" ? undefined : horizon,
    kind: kind === "all" ? undefined : kind,
    book: book === "active" ? undefined : book,
  };

  return (
    <div>
      <AnalystsBoard {...prepareAnalystsBoard(calls, horizon, kind, book)} horizon={horizon} kind={kind} book={book} />

      <section className="mt-12">
        <h2 className="font-sans text-2xl tracking-tight">Analyst directory</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          90-day overall factor; superseded calls excluded.
        </p>
        <ScaleLegend className="mb-3 mt-3" />
        <div className="panel stack-table" tabIndex={0} role="region" aria-label="Analyst directory, scrollable">
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
              {directory.map(({ analyst, aggregate, placement }) => (
                <tr key={analyst.id}>
                  <td data-label="Analyst">
                    <Link href={`/analysts/${analyst.slug}`} className="font-medium hover:text-brass">
                      {analyst.name}
                    </Link>
                    <p className="text-xs text-faint sm:hidden">{analyst.sector}</p>
                  </td>
                  <td data-label="Firm">
                    <Link href={`/banks/${analyst.bank.slug}`} className="text-muted hover:text-brass">
                      {analyst.bank.shortName}
                    </Link>
                  </td>
                  <td className="hidden text-muted sm:table-cell" data-label="Sector">{analyst.sector}</td>
                  <td className="num" data-label="N">{aggregate.graded}</td>
                  <td className="num" data-label="Hit">{aggregate.hitRate == null ? "—" : `${Math.round(aggregate.hitRate * 100)}%`}</td>
                  <td data-label="Overall factor">
                    <ScoreBar score={aggregate.avgScore} placement={placement} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <nav className="mt-3 flex flex-wrap items-center gap-2" aria-label="Analyst directory pages">
          <p className="mr-2 text-sm text-muted">
            Showing {start + 1}–{start + directory.length} of {rows.length}.
          </p>
          {page > 1 ? (
            <a className="chip" href={hrefWith("/analysts", directoryQuery, { page: page === 2 ? null : String(page - 1) })}>
              Previous
            </a>
          ) : null}
          <span className="inline-flex min-h-11 items-center px-2 text-sm text-faint">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <a className="chip" href={hrefWith("/analysts", directoryQuery, { page: String(page + 1) })}>
              Next
            </a>
          ) : null}
        </nav>
      </section>
    </div>
  );
}
