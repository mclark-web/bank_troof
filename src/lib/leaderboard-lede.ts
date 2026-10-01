import { HORIZONS, type HorizonKey } from "./scoring";

export type LeaderboardView = "analysts" | "banks" | "offenders";
export type LeaderboardRank = "gc" | "points";

/** Intro under the leaderboard title. Names the selected horizon and the active sort. */
export function leaderboardLede(view: LeaderboardView, horizon: HorizonKey, rank: LeaderboardRank): string {
  const label = HORIZONS[horizon].label;
  if (view === "offenders" && rank === "gc") {
    return `Lowest overall factor first over ${label}. Sorted by the GC score of that factor. Names in the same bucket keep the higher overall factor ahead. Superseded calls don't score.`;
  }
  if (view === "offenders") {
    return `Lowest overall factor first over ${label}. Superseded calls don't score.`;
  }
  if (rank === "gc") {
    return `Sorted by the GC score of that factor over ${label}. Names in the same bucket keep the higher overall factor ahead. Superseded calls don't score.`;
  }
  return `Ranked by overall factor: the average 0–100 grade of active calls over ${label}. Superseded calls don't score.`;
}
