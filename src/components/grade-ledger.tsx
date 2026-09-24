import { pct, pctUnsigned, usd } from "@/lib/format";
import { readCalibration } from "@/lib/gc-grade";
import { directionForGradingLabel } from "@/lib/labels";
import { formatPoints, HORIZONS, HORIZON_KEYS, outcomeField, placeChad, type CallGrade, type HorizonKey } from "@/lib/scoring";
import type { ScoredCall } from "@/lib/queries";
import { GcTube } from "./gc-tube";
import { GradePill, SideNote } from "./ui";

function expectation(grade: CallGrade, rating: string, horizon: HorizonKey) {
  const hurdle = pctUnsigned(grade.threshold, 0);
  const window = HORIZONS[horizon].label;
  const bucket = directionForGradingLabel(rating);
  if (grade.expected === "up") {
    return `Direction for grading is ${bucket}. That bucket expects the shares to rise at least ${hurdle} over ${window}.`;
  }
  if (grade.expected === "down") {
    return `Direction for grading is ${bucket}. That bucket expects a decline of at least ${hurdle} over ${window}.`;
  }
  return `Direction for grading is ${bucket}. That bucket expects the absolute move to stay within ${hurdle} over ${window}.`;
}

function priceFor(call: ScoredCall, horizon: HorizonKey) {
  return call[outcomeField(horizon)];
}

export function GradeLedger({ call }: { call: ScoredCall }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {HORIZON_KEYS.map((horizon) => {
        const grade = call.grades[horizon];
        const placement = placeChad(grade.gradeable ? grade.score : null);
        const reading = readCalibration(grade.score, grade.gradeable);
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
                  <span className="num text-6xl leading-none">{placement.chad ?? "—"}</span>
                  <span className="mb-1 text-sm text-muted">
                    / 10
                    <span className="mt-0.5 block text-xs">
                      <span className="text-miss">GC 1</span>
                      <span className="text-faint"> → </span>
                      <span className="text-hit">GC 10</span>
                    </span>
                  </span>
                </p>
                <p className="mt-3 num text-xl text-ink">
                  Score {formatPoints(grade.score)}
                  <span className="text-faint">/100</span>
                </p>
                <GcTube
                  className="mt-3 max-w-[12rem]"
                  percent={reading.percent}
                  tube={reading.tube}
                  grade={reading.id}
                  variant="sidebar"
                  meta="none"
                />
                <SideNote placement={placement} className="mt-2" />
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
