import { HORIZON_KEYS, type HorizonKey } from "./scoring";

/**
 * Default leaderboard horizon.
 * The most names at the sample minimum win. A tie goes to the cut with more graded names,
 * then to the longer window, so a short empty cut does not win when a longer one is just as full.
 */
export function fullestHorizon(
  qualifying: Record<HorizonKey, number>,
  considered: Record<HorizonKey, number>,
): HorizonKey {
  let best: HorizonKey = "365";
  for (const key of ["90", "60", "30", "14"] as const) {
    const moreQualified = qualifying[key] > qualifying[best];
    const sameQualified = qualifying[key] === qualifying[best];
    const moreGraded = considered[key] > considered[best];
    if (moreQualified || (sameQualified && moreGraded)) best = key;
  }
  return best;
}

export function emptyHorizonCounts(): Record<HorizonKey, number> {
  return Object.fromEntries(HORIZON_KEYS.map((key) => [key, 0])) as Record<HorizonKey, number>;
}

/** Below-minimum rows shown before "Show all". Keeps the default board HTML small. */
export const BELOW_PREVIEW = 25;

export function previewBelow<T>(rows: readonly T[], all: boolean): { shown: T[]; hidden: number } {
  const shown = all ? [...rows] : rows.slice(0, BELOW_PREVIEW);
  return { shown, hidden: rows.length - shown.length };
}
