import { aggregateGrades, type Aggregate, type CallGrade } from "./scoring";

/**
 * Overall factor is the report-card rollup: the average 0–100 grade of active
 * calls at one horizon. The GC score is `placeChad` of this same number on the absolute 70/40 lines.
 * `src/lib/queries.ts` is the only caller that turns stored calls into this input.
 */
export const OVERALL_FACTOR_FORMULA =
  "The overall factor is the average of the 0–100 grades on active calls at this horizon. A call superseded by a later note on the same ticker within 90 days stays visible and does not enter this average, the GC score, or the hit rate.";

export type OverallFactor = {
  /** 0–100 average of active graded calls. Null when none are graded. */
  score: number | null;
  /** Active calls that already have a grade at this horizon. */
  activeGraded: number;
  /** Nullified calls. They stay on the record and do not score. */
  superseded: number;
  /** Hit rate among active graded calls. Null when none are graded. */
  hitRate: number | null;
  aggregate: Aggregate;
};

export type FactorCall = {
  grade: CallGrade;
  /** False for a nullified call. Those grades are ignored. */
  countsForScoring: boolean;
  /** True when the 90-day rule nullified this call. */
  nullified: boolean;
};

/** One rollup for profiles, leaderboards, and the scores API. */
export function overallFactor(calls: readonly FactorCall[]): OverallFactor {
  const aggregate = aggregateGrades(calls.filter((call) => call.countsForScoring).map((call) => call.grade));
  return {
    score: aggregate.avgScore,
    activeGraded: aggregate.graded,
    superseded: calls.filter((call) => call.nullified).length,
    hitRate: aggregate.hitRate,
    aggregate,
  };
}
