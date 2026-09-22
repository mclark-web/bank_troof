import Link from "next/link";
import { formatDate, usd } from "@/lib/format";
import { actionLabel, ratingLabel } from "@/lib/labels";
import type { ScoredCallBase } from "@/lib/queries";
import { HORIZONS, HORIZON_KEYS, type CallGrade, type HorizonKey } from "@/lib/scoring";
import { GradePill, RatingPill } from "./ui";

export function FollowUpBadge() {
  return (
    <span className="mt-1 inline-flex rounded-full border border-brass/50 bg-brass/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-brass">
      Follow-up within 90d
    </span>
  );
}

function horizonStatus(grade: CallGrade): string {
  if (!grade.gradeable || !grade.directionResult) return "Ungraded";
  if (grade.directionResult === "hit") return "Hit";
  if (grade.directionResult === "near") return "Near";
  return "Miss";
}

export function PriorCallPanel({
  call,
  emphasize,
  compact = false,
}: {
  call: ScoredCallBase;
  emphasize?: HorizonKey;
  compact?: boolean;
}) {
  const focus = emphasize ?? "90";
  const focusGrade = call.grades[focus];
  return (
    <aside aria-label="Prior call within 90 days" className={compact ? "py-1" : "panel p-4"}>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass">Prior call (within 90 days)</p>
      <p className="mt-2 text-sm text-ink">
        <Link href={`/calls/${call.id}`} className="hover:text-brass">
          {formatDate(call.callDate)}
        </Link>
        <span className="text-muted"> · {actionLabel(call.action)} · </span>
        <RatingPill rating={call.ratingTo} />
        {call.ratingFrom ? <span className="text-xs text-faint"> from {ratingLabel(call.ratingFrom)}</span> : null}
      </p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-faint">Price target</dt>
          <dd className="num text-ink">
            {usd(call.priceTargetTo)}
            {call.priceTargetFrom != null ? <span className="text-xs text-faint"> from {usd(call.priceTargetFrom)}</span> : null}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-faint">Entry price</dt>
          <dd className="num text-ink">{usd(call.priceAtCall)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-faint">{HORIZONS[focus].short} status</dt>
          <dd className="mt-1 flex items-center gap-2">
            <GradePill result={focusGrade.directionResult} />
            <span className="text-xs text-faint">{horizonStatus(focusGrade)}</span>
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-faint">Record</dt>
          <dd>
            <Link href={`/calls/${call.id}`} className="text-sm text-brass hover:text-ink">
              Open prior call
            </Link>
          </dd>
        </div>
      </dl>
      <ul className="mt-3 flex flex-wrap gap-2">
        {HORIZON_KEYS.map((horizon) => {
          const grade = call.grades[horizon];
          const current = horizon === focus;
          return (
            <li
              key={horizon}
              className={
                current
                  ? "rounded-full border border-brass/50 bg-brass/10 px-2 py-1 text-[11px] text-brass"
                  : "rounded-full border border-line px-2 py-1 text-[11px] text-muted"
              }
            >
              <span className="num">{HORIZONS[horizon].short}</span> {horizonStatus(grade)}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
