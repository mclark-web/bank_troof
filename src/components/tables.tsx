import Link from "next/link";
import { formatDate, pct, returnTone, usd } from "@/lib/format";
import { actionLabel, ratingLabel } from "@/lib/labels";
import type { BoardRow, ScoredCall } from "@/lib/queries";
import { ratingChange } from "@/lib/queries";
import type { HorizonKey } from "@/lib/scoring";
import { GradePill, RatingPill, ScoreBar } from "./ui";

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
            <th>N</th>
            <th>Hit</th>
            <th>Miss</th>
            <th className="hidden md:table-cell">If followed</th>
            <th>Score</th>
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
              <td className="num">{row.aggregate.graded}</td>
              <td className="num">{row.aggregate.hitRate == null ? "—" : `${Math.round(row.aggregate.hitRate * 100)}%`}</td>
              <td className={emphasize === "miss" ? "num text-miss" : "num text-muted"}>
                {row.aggregate.missRate == null ? "—" : `${Math.round(row.aggregate.missRate * 100)}%`}
              </td>
              <td className={`num hidden md:table-cell ${returnTone(row.aggregate.avgFollowedReturn)}`}>
                {pct(row.aggregate.avgFollowedReturn)}
              </td>
              <td>
                <ScoreBar score={row.aggregate.avgScore} />
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
            const after = horizon === "30" ? call.price30d : horizon === "90" ? call.price90d : call.price1y;
            return (
              <tr key={call.id}>
                <td className="whitespace-nowrap">
                  <Link href={`/calls/${call.id}`} className="hover:text-brass">
                    {formatDate(call.callDate)}
                  </Link>
                  {call.controversial ? (
                    <span className="mt-1 block text-[10px] uppercase tracking-wider text-brass">Controversial</span>
                  ) : null}
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
