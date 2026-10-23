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
