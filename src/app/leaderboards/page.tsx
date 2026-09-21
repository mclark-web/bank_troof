import type { Metadata } from "next";
import { BoardTable } from "@/components/tables";
import { EmptyNote, HorizonChips, PageIntro, SectorForm, hrefWith } from "@/components/ui";
import { loadSectors, leaderboard } from "@/lib/queries";
import { HORIZONS, minimumSample, parseHorizon } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: "Analysts and banks ranked by historical call accuracy in the BankTruth sample.",
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
  const order = view === "offenders" ? "miss" : "score";
  const [board, sectors] = await Promise.all([
    leaderboard({ horizon, sector, entity, order }),
    loadSectors(),
  ]);
  const current = {
    view: view === "analysts" ? undefined : view,
    horizon: horizon === "90" ? undefined : horizon,
    sector,
    who: view === "offenders" && who === "analysts" ? "analysts" : undefined,
  };

  const title =
    view === "offenders" ? "Worst offenders" : view === "banks" ? "Top banks" : "Top analysts";
  const lede =
    view === "offenders"
      ? `Highest miss rate over ${HORIZONS[horizon].label}. A miss is any graded call that was not a full direction hit. Near-misses count as misses here and still earn partial score.`
      : `Ranked by average call score over ${HORIZONS[horizon].label}. Direction is 70 points. The price target can add 30. Firms are weighted by calls, not by headcount.`;

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
        <HorizonChips path="/leaderboards" current={current} horizon={horizon} />
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
        {sector ? ` in ${sector}` : ""}. Score is the average of graded calls only. “If followed” averages the stock return on buys and the inverse return on sells. Holds are left out of that column.
      </p>
    </div>
  );
}
