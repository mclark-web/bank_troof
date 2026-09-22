import Link from "next/link";
import { formatDate, pct, returnTone, usd } from "@/lib/format";
import { actionLabel, ratingLabel } from "@/lib/labels";
import type { BoardRow, ScoredCall } from "@/lib/queries";
import { ratingChange } from "@/lib/queries";
import { outcomeField, type HorizonKey } from "@/lib/scoring";
import { GradePill, hrefWith, PointsCell, RatingPill, SupersessionNotes } from "./ui";

export type BookView = "all" | "active" | "superseded";

export function parseBook(value: string | undefined): BookView {
  if (value === "active" || value === "superseded") return value;
  return "all";
}

export function BoardTable({
  rows,
  emphasize = "score",
}: {
  rows: BoardRow[];
  emphasize?: "score" | "miss";
}) {
  return (
    <div className="panel overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>{rows[0]?.kind === "bank" ? "Bank" : "Analyst"}</th>
            <th className="hidden sm:table-cell">Desk</th>
            <th>
              Active
              <span className="mt-1 block font-sans text-[10px] font-normal normal-case tracking-normal text-faint">
                graded
              </span>
            </th>
            <th>Hit</th>
            <th>Miss</th>
            <th className="hidden md:table-cell">If followed</th>
            <th>
              Chad
              <span className="mt-1 block font-sans text-[10px] font-normal normal-case tracking-normal text-faint">
                1 = Chud · 10 = Chad
              </span>
            </th>
            <th>
              Overall factor
              <span className="mt-1 block font-sans text-[10px] font-normal normal-case tracking-normal text-faint">
                active avg /100
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.href}>
              <td className="num text-faint">{index + 1}</td>
              <td>
                <Link href={row.href} className="font-medium hover:text-brass">
                  {row.name}
                </Link>
                <p className="text-xs text-faint sm:hidden">{row.subtitle}</p>
              </td>
              <td className="hidden text-muted sm:table-cell">{row.subtitle}</td>
              <td className="num">
                {row.aggregate.graded}
                {row.superseded > 0 ? (
                  <span className="mt-1 block font-sans text-[10px] font-normal normal-case tracking-normal text-faint">
                    {row.superseded} superseded
                  </span>
                ) : null}
              </td>
              <td className="num">{row.aggregate.hitRate == null ? "—" : `${Math.round(row.aggregate.hitRate * 100)}%`}</td>
              <td className={emphasize === "miss" ? "num text-miss" : "num text-muted"}>
                {row.aggregate.missRate == null ? "—" : `${Math.round(row.aggregate.missRate * 100)}%`}
              </td>
              <td className={`num hidden md:table-cell ${returnTone(row.aggregate.avgFollowedReturn)}`}>
                {pct(row.aggregate.avgFollowedReturn)}
              </td>
              <td>
                <span className="num text-2xl leading-none">{row.placement.chad ?? "—"}</span>
                <span className="num text-[11px] text-faint">/10</span>
              </td>
              <td>
                <PointsCell score={row.aggregate.avgScore} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CallTable({
  calls,
  horizon,
  showAnalyst = false,
  showTicker = true,
}: {
  calls: ScoredCall[];
  horizon: HorizonKey;
  showAnalyst?: boolean;
  showTicker?: boolean;
}) {
  return (
    <div className="panel overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            {showTicker ? <th>Ticker</th> : null}
            {showAnalyst ? <th>Analyst</th> : null}
            <th>Action</th>
            <th>Rating</th>
            <th className="hidden lg:table-cell">Target</th>
            <th className="hidden md:table-cell">Then</th>
            <th>After</th>
            <th>Return</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => {
            const grade = call.grades[horizon];
            const after = call[outcomeField(horizon)];
            return (
              <tr key={call.id}>
                <td className="whitespace-nowrap">
                  <Link href={`/calls/${call.id}`} className="hover:text-brass">
                    {formatDate(call.callDate)}
                  </Link>
                  {call.controversial ? (
                    <span className="mt-1 block text-[10px] uppercase tracking-wider text-brass">Controversial</span>
                  ) : null}
                  <SupersessionNotes mark={call.supersession} />
                </td>
                {showTicker ? (
                  <td>
                    <Link href={`/tickers/${call.ticker.symbol}`} className="num font-medium hover:text-brass">
                      {call.ticker.symbol}
                    </Link>
                    <p className="text-xs text-faint">{call.ticker.name}</p>
                  </td>
                ) : null}
                {showAnalyst ? (
                  <td>
                    <Link href={`/analysts/${call.analyst.slug}`} className="hover:text-brass">
                      {call.analyst.name}
                    </Link>
                    <p className="text-xs text-faint">{call.bank.shortName}</p>
                  </td>
                ) : null}
                <td className="text-muted">{actionLabel(call.action)}</td>
                <td>
                  <RatingPill rating={call.ratingTo} />
                  <p className="mt-1 hidden text-[11px] text-faint xl:block">{ratingChange(call)}</p>
                </td>
                <td className="num hidden lg:table-cell">{usd(call.priceTargetTo)}</td>
                <td className="num hidden text-muted md:table-cell">{usd(call.priceAtCall)}</td>
                <td className="num">{usd(after)}</td>
                <td className={`num ${returnTone(grade.forwardReturn)}`}>{pct(grade.forwardReturn)}</td>
                <td>
                  <GradePill result={grade.directionResult} />
                  {call.supersession.status === "nullified" ? (
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-faint">Not scored</p>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CallBook({
  calls,
  horizon,
  book,
  path,
  current,
  showAnalyst = false,
  showTicker = true,
  perSection = 40,
}: {
  calls: ScoredCall[];
  horizon: HorizonKey;
  book: BookView;
  path: string;
  current: Record<string, string | undefined>;
  showAnalyst?: boolean;
  showTicker?: boolean;
  perSection?: number;
}) {
  const active = calls.filter((call) => call.supersession.status === "active");
  const superseded = calls.filter((call) => call.supersession.status === "nullified");
  const showActive = book !== "superseded";
  const showSuperseded = book !== "active";

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Which calls to show">
        <Link href={hrefWith(path, current, { book: "active" })} className={book === "active" ? "chip-on" : "chip"} aria-current={book === "active" ? "true" : undefined}>
          Active <span className="num ml-1">{active.length}</span>
        </Link>
        <Link
          href={hrefWith(path, current, { book: "superseded" })}
          className={book === "superseded" ? "chip-on" : "chip"}
          aria-current={book === "superseded" ? "true" : undefined}
        >
          Superseded <span className="num ml-1">{superseded.length}</span>
        </Link>
        <Link href={hrefWith(path, current, { book: null })} className={book === "all" ? "chip-on" : "chip"} aria-current={book === "all" ? "true" : undefined}>
          All
        </Link>
      </div>
      {showActive ? (
        <BookSection
          title="Active book"
          lede="These calls count toward the overall factor once the horizon has a price. An open window is listed and is not in the average yet."
          calls={active.slice(0, perSection)}
          total={active.length}
          empty="No active calls in this cut."
          horizon={horizon}
          showAnalyst={showAnalyst}
          showTicker={showTicker}
        />
      ) : null}
      {showSuperseded ? (
        <BookSection
          title="Superseded / nullified"
          lede="History only. A later call on the same ticker within 90 days replaced these. The notes stay. They do not enter the overall factor."
          calls={superseded.slice(0, perSection)}
          total={superseded.length}
          empty="No superseded calls in this cut."
          horizon={horizon}
          showAnalyst={showAnalyst}
          showTicker={showTicker}
          className={showActive ? "mt-8" : ""}
        />
      ) : null}
    </div>
  );
}

function BookSection({
  title,
  lede,
  calls,
  total,
  empty,
  horizon,
  showAnalyst,
  showTicker,
  className = "",
}: {
  title: string;
  lede: string;
  calls: ScoredCall[];
  total: number;
  empty: string;
  horizon: HorizonKey;
  showAnalyst: boolean;
  showTicker: boolean;
  className?: string;
}) {
  return (
    <section className={className}>
      <h3 className="font-serif text-xl">{title}</h3>
      <p className="mb-3 mt-1 max-w-2xl text-sm leading-6 text-muted">{lede}</p>
      {total === 0 ? (
        <p className="panel px-4 py-8 text-center text-sm text-muted">{empty}</p>
      ) : (
        <CallTable calls={calls} horizon={horizon} showAnalyst={showAnalyst} showTicker={showTicker} />
      )}
      {total > calls.length ? (
        <p className="mt-3 text-xs text-faint">
          Showing the {calls.length} most recent of {total}.
        </p>
      ) : null}
    </section>
  );
}

export function ConsensusBar({ buckets, total }: { buckets: { buy: number; hold: number; sell: number }; total: number }) {
  if (total === 0) return <p className="text-sm text-muted">No current ratings in the sample.</p>;
  const parts = [
    { key: "buy", label: "Buy", count: buckets.buy, className: "bg-hit" },
    { key: "hold", label: "Hold", count: buckets.hold, className: "bg-[#d9d0c1]" },
    { key: "sell", label: "Sell", count: buckets.sell, className: "bg-miss" },
  ];
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-white/5" aria-hidden>
        {parts.map((part) =>
          part.count > 0 ? (
            <div key={part.key} className={part.className} style={{ width: `${(part.count / total) * 100}%` }} />
          ) : null,
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-4 text-sm">
        {parts.map((part) => (
          <li key={part.key} className="text-muted">
            <span className="text-ink">{part.label}</span>{" "}
            <span className="num">
              {part.count} · {Math.round((part.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-faint">
        Latest rating from each analyst still in the sample. {ratingLabel("strong_buy")} counts with Buy; Underperform counts with Sell.
      </p>
    </div>
  );
}
