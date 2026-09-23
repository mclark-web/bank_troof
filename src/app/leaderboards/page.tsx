import type { Metadata } from "next";
import { BoardTable } from "@/components/tables";
import { EmptyNote, HorizonChips, PageIntro, SectorForm, hrefWith } from "@/components/ui";
import { loadSectors, leaderboard, type RankKey } from "@/lib/queries";
import { HORIZONS, minimumSample, parseHorizon } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: "Analysts and banks ranked by historical call accuracy in the GradedCalls Analysts sample.",
};

type View = "analysts" | "banks" | "offenders";

function readView(value: string | undefined): View {
  if (value === "banks" || value === "offenders") return value;
  return "analysts";
}

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const one = (key: string) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const view = readView(one("view"));
  const horizon = parseHorizon(one("horizon"));
  const sector = one("sector") || undefined;
  const who = one("who") === "analysts" ? "analysts" : "banks";
  const entity = view === "analysts" ? "analyst" : view === "banks" ? "bank" : who === "analysts" ? "analyst" : "bank";
  const order = view === "offenders" ? "low" : "score";
  const rawRank = one("rank");
  const rank: RankKey = rawRank === "gc" || rawRank === "chad" ? "gc" : "points";
  const [board, sectors] = await Promise.all([
    leaderboard({ horizon, sector, entity, order, rank }),
    loadSectors(),
  ]);
  const current = {
    view: view === "analysts" ? undefined : view,
    horizon: horizon === "90" ? undefined : horizon,
    sector,
    who: view === "offenders" && who === "analysts" ? "analysts" : undefined,
    rank: rank === "points" ? undefined : rank,
  };

  const title =
    view === "offenders" ? "Worst offenders" : view === "banks" ? "Top banks" : "Top analysts";
  const rankLine =
    rank === "gc"
      ? "Sorted by the GC score of that factor. Names in the same bucket keep the higher overall factor ahead."
      : "Sorted by the overall factor, the average 0–100 grade of active calls. Superseded calls do not score. Under 70 the GC score stays in 1–4. The top 30% of this board who also cleared 70 land on GC 8–10.";
  const lede =
    view === "offenders"
      ? `Lowest overall factor first over ${HORIZONS[horizon].label}. ${rankLine} GC 1 is a poor track record. GC 10 is an excellent one. Open a name to see each call labeled by its recommendation. Buy, Hold, and Sell stay inside the grade.`
      : `Ranked by overall factor over ${HORIZONS[horizon].label}. ${rankLine} GC 1 is a poor track record. GC 10 is an excellent one. Firms are weighted by active calls, not by headcount. Open a name to see each call labeled by its recommendation. Buy, Hold, and Sell stay inside the grade.`;

  return (
    <div>
      <PageIntro kicker="Leaderboards" title={title} lede={lede} />
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["analysts", "Top analysts"],
            ["banks", "Top banks"],
            ["offenders", "Worst offenders"],
          ] as const
        ).map(([id, label]) => (
          <a
            key={id}
            href={hrefWith("/leaderboards", current, { view: id === "analysts" ? null : id, who: null })}
            className={view === id ? "chip-on" : "chip"}
          >
            {label}
          </a>
        ))}
      </div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <HorizonChips path="/leaderboards" current={current} horizon={horizon} />
          <div className="flex gap-2" role="group" aria-label="Sort">
            <a href={hrefWith("/leaderboards", current, { rank: null })} className={rank === "points" ? "chip-on" : "chip"}>
              Overall factor
            </a>
            <a href={hrefWith("/leaderboards", current, { rank: "gc" })} className={rank === "gc" ? "chip-on" : "chip"}>
              GC score
            </a>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {view === "offenders" ? (
            <div className="flex gap-2">
              <a href={hrefWith("/leaderboards", current, { who: null })} className={who === "banks" ? "chip-on" : "chip"}>
                Banks
              </a>
              <a
                href={hrefWith("/leaderboards", current, { who: "analysts" })}
                className={who === "analysts" ? "chip-on" : "chip"}
              >
                Analysts
              </a>
            </div>
          ) : null}
          <SectorForm
            path="/leaderboards"
            sectors={sectors}
            sector={sector}
            hidden={{
              view: current.view,
              horizon: current.horizon,
              who: current.who,
              rank: current.rank,
            }}
          />
        </div>
      </div>
      {board.rows.length === 0 ? (
        <EmptyNote>
          Not enough graded calls in this cut. The minimum sample is {board.minimum}. Try {HORIZONS["90"].short} or all sectors.
        </EmptyNote>
      ) : (
        <BoardTable rows={board.rows} emphasize={view === "offenders" ? "miss" : "score"} />
      )}
      <p className="mt-4 max-w-3xl text-xs leading-5 text-faint">
        Showing {board.rows.length} of {board.considered} {entity === "bank" ? "banks" : "analysts"} with at least{" "}
        {minimumSample(entity, sector)} active graded {HORIZONS[horizon].short} calls
        {sector ? ` in ${sector}` : ""}. The overall factor is the average 0–100 grade of those active calls. Superseded calls stay off the average, the GC score, and the hit rate. Under 70 the GC score stays in 1–4. The top 30% of this board, if they also cleared 70, are GC 8–10. Everyone else at or above 70 is GC 5–7. Default sort is the overall factor. “If followed” averages the stock return on active buys and the inverse return on active sells. Holds are left out of that column.
      </p>
    </div>
  );
}
