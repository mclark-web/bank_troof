import { pct, pctUnsigned, scoreText, usd } from "@/lib/format";
import { ratingLabel } from "@/lib/labels";
import { formatChadScore, HORIZONS, HORIZON_KEYS, type CallGrade, type HorizonKey } from "@/lib/scoring";
import type { ScoredCall } from "@/lib/queries";
import { GradePill, ScaleLegend } from "./ui";

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
                <p className="flex items-baseline gap-2">
                  <span className="num text-5xl leading-none">{formatChadScore(grade.score)}</span>
                  <span className="num text-xl text-faint">/ 10</span>
                </p>
                <ScaleLegend className="mt-2" />
              </div>
            ) : null}
            {grade.gradeable ? (
              <dl className="mt-4 space-y-2 text-sm">
                <Row k="Raw points" v={`${scoreText(grade.score)} / 100`} />
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
