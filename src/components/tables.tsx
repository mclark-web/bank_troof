import Link from "next/link";
import { Fragment } from "react";
import { FollowUpBadge, PriorCallPanel } from "@/components/prior-call";
import { formatDate, pct, returnTone, usd } from "@/lib/format";
import { actionLabel, ratingLabel } from "@/lib/labels";
import type { BoardRow, ScoredCall } from "@/lib/queries";
import { ratingChange } from "@/lib/queries";
import { outcomeField, type HorizonKey } from "@/lib/scoring";
import { GradePill, PointsCell, RatingPill } from "./ui";

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
            <th>
              Chad
              <span className="mt-1 block font-sans text-[10px] font-normal normal-case tracking-normal text-faint">
                1 = Chud · 10 = Chad
              </span>
            </th>
            <th>
              Score
              <span className="mt-1 block font-sans text-[10px] font-normal normal-case tracking-normal text-faint">
                out of 100
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
              <td className="num">{row.aggregate.graded}</td>
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

function tickerGroups(calls: ScoredCall[]) {
  const groups = new Map<string, ScoredCall[]>();
  for (const call of calls) {
    const list = groups.get(call.tickerId) ?? [];
    list.push(call);
    groups.set(call.tickerId, list);
  }
  return [...groups.values()]
    .map((group) => {
      const ordered = [...group].sort((a, b) => a.callDate.getTime() - b.callDate.getTime() || a.id.localeCompare(b.id));
      return {
        ticker: ordered[0].ticker,
        calls: ordered,
        newest: Math.max(...ordered.map((call) => call.callDate.getTime())),
        hasFollowUp: ordered.some((call) => call.followUpWithin90Days),
      };
    })
    .sort((a, b) => b.newest - a.newest || a.ticker.symbol.localeCompare(b.ticker.symbol));
}

export function CallTable({
  calls,
  horizon,
  showAnalyst = false,
  showTicker = true,
  groupByTicker = false,
  showPriorPanel = false,
}: {
  calls: ScoredCall[];
  horizon: HorizonKey;
  showAnalyst?: boolean;
  showTicker?: boolean;
  groupByTicker?: boolean;
  showPriorPanel?: boolean;
}) {
  const tickerColumn = showTicker && !groupByTicker;
  const columnCount = 8 + (tickerColumn ? 1 : 0) + (showAnalyst ? 1 : 0);
  const groups = groupByTicker ? tickerGroups(calls) : null;

  function renderCall(call: ScoredCall) {
    const grade = call.grades[horizon];
    const after = call[outcomeField(horizon)];
    return (
      <Fragment key={call.id}>
        <tr>
          <td className="whitespace-nowrap">
            <Link href={`/calls/${call.id}`} className="hover:text-brass">
              {formatDate(call.callDate)}
            </Link>
            {call.followUpWithin90Days ? <span className="block"><FollowUpBadge /></span> : null}
            {call.controversial ? (
              <span className="mt-1 block text-[10px] uppercase tracking-wider text-brass">Controversial</span>
            ) : null}
            {call.priorCall && !showPriorPanel ? (
              <Link href={`/calls/${call.priorCall.id}`} className="mt-1 block text-[10px] uppercase tracking-wider text-brass">
                Prior call
              </Link>
            ) : null}
          </td>
          {tickerColumn ? (
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
        {showPriorPanel && call.priorCall ? (
          <tr>
            <td colSpan={columnCount} className="bg-inset/80">
              <PriorCallPanel call={call.priorCall} emphasize={horizon} compact />
            </td>
          </tr>
        ) : null}
      </Fragment>
    );
  }

  return (
    <div className="panel overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            {tickerColumn ? <th>Ticker</th> : null}
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
          {groups
            ? groups.map((group) => (
                <Fragment key={group.ticker.id}>
                  <tr>
                    <td colSpan={columnCount} className="bg-[#101318]">
                      <Link href={`/tickers/${group.ticker.symbol}`} className="num font-medium hover:text-brass">
                        {group.ticker.symbol}
                      </Link>
                      <span className="ml-2 text-xs text-faint">{group.ticker.name}</span>
                      {group.hasFollowUp ? (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-brass">Updated call in this chain</span>
                      ) : null}
                    </td>
                  </tr>
                  {group.calls.map((call) => renderCall(call))}
                </Fragment>
              ))
            : calls.map((call) => renderCall(call))}
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
        Latest rating from each analyst still in the sample. A follow-up within 90 days does not erase the prior call. {ratingLabel("strong_buy")} counts with Buy; Underperform counts with Sell.
      </p>
    </div>
  );
}
