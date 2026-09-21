import { pct, pctUnsigned, usd } from "@/lib/format";
import { ratingLabel } from "@/lib/labels";
import { formatChadScore, formatPoints, HORIZONS, HORIZON_KEYS, type CallGrade, type HorizonKey } from "@/lib/scoring";
import type { ScoredCall } from "@/lib/queries";
import { GradePill, SideNote } from "./ui";

function expectation(grade: CallGrade, rating: string, horizon: HorizonKey) {
  const hurdle = pctUnsigned(grade.threshold, 0);
  const window = HORIZONS[horizon].label;
  if (grade.expected === "up") {
    return `${ratingLabel(rating)} expects the shares to rise at least ${hurdle} over ${window}.`;
  }
  if (grade.expected === "down") {
    return `${ratingLabel(rating)} expects a decline of at least ${hurdle} over ${window}.`;
  }
  return `${ratingLabel(rating)} expects the absolute move to stay within ${hurdle} over ${window}.`;
}

function priceFor(call: ScoredCall, horizon: HorizonKey) {
  if (horizon === "30") return call.price30d;
  if (horizon === "90") return call.price90d;
  return call.price1y;
}

export function GradeLedger({ call }: { call: ScoredCall }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {HORIZON_KEYS.map((horizon) => {
        const grade = call.grades[horizon];
        const spec = HORIZONS[horizon];
        const after = priceFor(call, horizon);
        return (
          <article key={horizon} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="kicker">{spec.short}</p>
                <p className="mt-1 text-sm text-muted">{spec.label} after the call</p>
              </div>
              <GradePill result={grade.directionResult} />
            </div>
            {grade.gradeable ? (
              <div className="mt-4">
                <p className="flex items-end gap-2">
                  <span className="num text-6xl leading-none">{formatChadScore(grade.score)}</span>
                  <span className="mb-1 text-sm text-muted">
                    / 10
                    <span className="mt-0.5 block text-[11px]">
                      <span className="text-miss">1 = Chud</span>
                      <span className="text-faint"> → </span>
                      <span className="text-hit">10 = Chad</span>
                    </span>
                  </span>
                </p>
                <p className="mt-3 num text-xl text-ink">
                  Score {formatPoints(grade.score)}
                  <span className="text-faint">/100</span>
                </p>
                <div className="mt-2 h-1.5 max-w-[12rem] overflow-hidden rounded-full bg-white/10" aria-hidden>
                  <div
                    className="h-full bg-brass"
                    style={{ width: `${grade.score == null ? 0 : Math.min(100, Math.max(0, grade.score))}%` }}
                  />
                </div>
                <SideNote raw={grade.score} className="mt-2" />
              </div>
            ) : null}
            {grade.gradeable ? (
              <dl className="mt-4 space-y-2 text-sm">
                <Row k="Price at call" v={usd(call.priceAtCall)} />
                <Row k="Price after" v={usd(after)} />
                <Row k="Forward return" v={pct(grade.forwardReturn)} />
                <Row k="Direction points" v={`${grade.directionPoints} / 70`} />
                <Row
                  k="Target points"
                  v={grade.targetPoints == null ? "No target · direction scaled to 100" : `${grade.targetPoints.toFixed(1)} / 30`}
                />
                <Row k="Target error" v={grade.targetError == null ? "—" : pctUnsigned(grade.targetError)} />
                <Row k="If followed" v={grade.followedReturn == null ? "Hold excluded" : pct(grade.followedReturn)} />
              </dl>
            ) : (
              <p className="mt-6 text-sm leading-6 text-muted">
                This window has no recorded price in the sample, so the call stays ungraded. Open windows are left out of hit rate and score.
              </p>
            )}
            <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-faint">{expectation(grade, call.ratingTo, horizon)}</p>
          </article>
        );
      })}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-faint">{k}</dt>
      <dd className="num text-right text-ink">{v}</dd>
    </div>
  );
}
