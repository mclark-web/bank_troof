import type { Metadata } from "next";
import { BoardTable } from "@/components/tables";
import { EmptyNote, HorizonChips, PageIntro, SectorForm, hrefWith } from "@/components/ui";
import { loadSectors, leaderboard, type RankKey } from "@/lib/queries";
import { HORIZONS, minimumSample, parseHorizon } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: "Analysts and banks ranked by historical call accuracy in the Charoof Analysts sample.",
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
  const rank: RankKey = one("rank") === "chad" ? "chad" : "points";
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
    rank === "chad"
      ? "Sorted by the Chad integer. Names in the same bucket keep the higher score out of 100 ahead."
      : "Sorted by the score out of 100. Under 70 is Chud territory. Top 30% of this board earns chaddiness.";
  const lede =
    view === "offenders"
      ? `Lowest first over ${HORIZONS[horizon].label}. ${rankLine} 1 is Chud. 10 is Chad. Both grades are on the row.`
      : `Ranked over ${HORIZONS[horizon].label}. ${rankLine} 1 is Chud. 10 is Chad. Firms are weighted by calls, not by headcount.`;

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
              Score /100
            </a>
            <a href={hrefWith("/leaderboards", current, { rank: "chad" })} className={rank === "chad" ? "chip-on" : "chip"}>
              Chad 1–10
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
        {minimumSample(entity, sector)} graded {HORIZONS[horizon].short} calls
        {sector ? ` in ${sector}` : ""}. Score out of 100 is the full grade. Under 70 is Chud territory. The top 30% of this board, if they also cleared 70, are on the Chad side. Everyone else at or above 70 is mid. Default sort is the 100-point score. “If followed” averages the stock return on buys and the inverse return on sells. Holds are left out of that column.
      </p>
    </div>
  );
}
