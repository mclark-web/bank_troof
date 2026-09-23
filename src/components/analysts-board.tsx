import Link from "next/link";
import { GcGradePill, GcTube } from "@/components/gc-tube";
import { hrefWith, SupersessionNotes } from "@/components/ui";
import { initials, usd } from "@/lib/format";
import { percentShares, readCallCalibration, readMean, type GcGradeId, type GcReading } from "@/lib/gc-grade";
import { recommendationLabel } from "@/lib/labels";
import type { ScoredCall } from "@/lib/queries";
import { HORIZONS, HORIZON_KEYS, type HorizonKey } from "@/lib/scoring";

export type BoardHorizon = HorizonKey | "all";
export type BoardKind = "all" | "upgrades" | "downgrades" | "targets";
export type BoardBook = "active" | "superseded" | "all";

const KIND_LABEL: Record<BoardKind, string> = {
  all: "All calls",
  upgrades: "Upgrades",
  downgrades: "Downgrades",
  targets: "Targets",
};

export function parseBoardHorizon(value: string | undefined): BoardHorizon {
  if (value && (HORIZON_KEYS as readonly string[]).includes(value)) return value as HorizonKey;
  return "all";
}

export function parseBoardKind(value: string | undefined): BoardKind {
  if (value === "upgrades" || value === "downgrades" || value === "targets") return value;
  return "all";
}

export function parseBoardBook(value: string | undefined): BoardBook {
  if (value === "superseded" || value === "all") return value;
  return "active";
}

function matchesKind(action: string, kind: BoardKind): boolean {
  if (kind === "upgrades") return action === "upgrade";
  if (kind === "downgrades") return action === "downgrade";
  if (kind === "targets") return action === "target_raise" || action === "target_cut";
  return true;
}

function slices(call: ScoredCall) {
  return HORIZON_KEYS.map((key) => call.grades[key]);
}

function readingFor(call: ScoredCall, horizon: BoardHorizon): GcReading {
  if (horizon === "all") return readCallCalibration(slices(call), "all");
  const index = HORIZON_KEYS.indexOf(horizon);
  return readCallCalibration(slices(call), index);
}

function shortDate(value: Date): string {
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function FilterLink({
  href,
  on,
  children,
}: {
  href: string;
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={on ? "chip-on" : "chip"} aria-current={on ? "true" : undefined}>
      {children}
    </Link>
  );
}

function HorizonMarks({ call }: { call: ScoredCall }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {HORIZON_KEYS.map((key) => {
        const grade = call.grades[key];
        const result = grade.gradeable ? grade.directionResult : null;
        const tone = result === "hit" ? "hz-hit" : result === "miss" ? "hz-miss" : result === "near" ? "hz-near" : "hz-open";
        const name = result === "hit" ? "Hit" : result === "miss" ? "Miss" : result === "near" ? "Near" : "Open";
        return (
          <span key={key} className={tone} title={`${HORIZONS[key].label}: ${name}`}>
            {HORIZONS[key].short}
          </span>
        );
      })}
    </div>
  );
}

export function AnalystsBoard({
  calls,
  horizon,
  kind,
  book,
}: {
  calls: ScoredCall[];
  horizon: BoardHorizon;
  kind: BoardKind;
  book: BoardBook;
}) {
  const current = {
    horizon: horizon === "all" ? undefined : horizon,
    kind: kind === "all" ? undefined : kind,
    book: book === "active" ? undefined : book,
  };
  const path = "/analysts";
  const scoped = calls.filter((call) => matchesKind(call.action, kind));
  const active = scoped.filter((call) => call.supersession.countsForScoring);
  const superseded = scoped.filter((call) => call.supersession.status === "nullified");
  const visible =
    book === "superseded" ? superseded : book === "all" ? scoped : active;
  const gradedVisible = visible.filter((call) => readingFor(call, horizon).id !== "exit");
  const shown = gradedVisible.slice(0, 40);
  const stillOpen = visible.length - gradedVisible.length;

  const factorScores = active
    .map((call) => {
      if (horizon === "all") {
        const closed = HORIZON_KEYS.map((key) => call.grades[key]).filter((grade) => grade.gradeable && grade.score != null);
        if (closed.length === 0) return null;
        return closed.reduce((sum, grade) => sum + (grade.score as number), 0) / closed.length;
      }
      const grade = call.grades[horizon];
      return grade.gradeable && grade.score != null ? grade.score : null;
    })
    .filter((score): score is number => score != null);
  const factor = readMean(factorScores);

  const healthIds = active.map((call) => readCallCalibration(slices(call), HORIZON_KEYS.indexOf("30")));
  const healthCounts: Record<GcGradeId, number> = { strong: 0, weak: 0, provisional: 0, exit: 0 };
  for (const reading of healthIds) healthCounts[reading.id] += 1;
  const health = percentShares(healthCounts, ["strong", "provisional", "weak"]);
  const healthGraded = healthCounts.strong + healthCounts.provisional + healthCounts.weak;
  const openOnBoard = active.filter((call) => readingFor(call, horizon).id === "exit").length;

  const windowLabel = horizon === "all" ? "every closed horizon" : HORIZONS[horizon].label;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="chip-live">Sector · Analysts</p>
          <h1 className="mt-3 font-sans text-[2rem] tracking-tight">Street calls, graded vs real prices</h1>
          <p className="mt-2 max-w-[52ch] text-sm leading-6 text-muted">
            Upgrades, downgrades, and targets from the sample book. Every grade uses split-adjusted historical closes — never a stale print.
          </p>
        </div>
        <div className="w-full max-w-[340px] rounded-xl border border-line bg-white/[0.03] px-4 py-3.5">
          <GcTube percent={factor.percent} tube={factor.tube} grade={factor.id} meta="row" />
        </div>
      </div>

      <div className="sim-banner mb-4">
        Sample names on this board. Firms stay marked <strong className="font-semibold">sample</strong> until a live research feed replaces them. Prices are historical adjusted closes, not a simulated path.
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Horizon and call type">
        <FilterLink href={hrefWith(path, current, { horizon: null })} on={horizon === "all"}>
          All horizons
        </FilterLink>
        {HORIZON_KEYS.map((key) => (
          <FilterLink key={key} href={hrefWith(path, current, { horizon: key })} on={horizon === key}>
            {HORIZONS[key].short}
          </FilterLink>
        ))}
        {(["upgrades", "downgrades", "targets"] as const).map((key) => (
          <FilterLink key={key} href={hrefWith(path, current, { kind: kind === key ? null : key })} on={kind === key}>
            {KIND_LABEL[key]}
          </FilterLink>
        ))}
        <FilterLink href={hrefWith(path, current, { book: null })} on={book === "active"}>
          Active
        </FilterLink>
        <FilterLink href={hrefWith(path, current, { book: "superseded" })} on={book === "superseded"}>
          Superseded <span className="num ml-1">{superseded.length}</span>
        </FilterLink>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="panel overflow-x-auto">
          <div className="flex items-end justify-between gap-3 border-b border-line px-4 py-3.5">
            <div>
              <h2 className="text-sm font-semibold">Latest graded calls</h2>
              <p className="mt-0.5 text-xs text-faint">
                Newest with a print · {gradedVisible.length} graded
                {shown.length < gradedVisible.length ? ` · showing ${shown.length}` : ""}
                {stillOpen > 0 ? ` · ${stillOpen} still open` : ""}
              </p>
            </div>
            <p className="hidden text-right font-mono text-[11px] text-faint sm:block">Prices · Yahoo Finance · split-adj</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Analyst</th>
                <th>Call</th>
                <th>Entry</th>
                <th>Horizons</th>
                <th>GC</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted">
                    No graded print in this cut yet. Open windows stay on the exit-liquidity card.
                  </td>
                </tr>
              ) : (
                shown.map((call) => {
                  const reading = readingFor(call, horizon);
                  const target = call.priceTargetTo == null ? "" : ` · PT ${usd(call.priceTargetTo)}`;
                  return (
                    <tr key={call.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="gc-avatar" aria-hidden>
                            {initials(call.analyst.name)}
                          </div>
                          <div>
                            <Link href={`/analysts/${call.analyst.slug}`} className="hover:text-brass">
                              {call.analyst.name}
                            </Link>
                            <p className="text-xs text-faint">
                              {call.bank.shortName} · sample
                              {call.supersession.status === "nullified" ? " · superseded" : ""}
                            </p>
                            <SupersessionNotes mark={call.supersession} verbose={false} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <Link href={`/calls/${call.id}`} className="num font-semibold tracking-wide hover:text-brass">
                          {call.ticker.symbol}
                        </Link>{" "}
                        <span className="text-muted">
                          {recommendationLabel(call)}
                          {target}
                        </span>
                        {call.controversial ? (
                          <span className="mt-1 block text-[10px] uppercase tracking-wider text-brass">Controversial</span>
                        ) : null}
                      </td>
                      <td className="num whitespace-nowrap">
                        {usd(call.priceAtCall)}
                        <span className="mt-0.5 block text-[11px] text-faint">{shortDate(call.callDate)}</span>
                      </td>
                      <td>
                        <HorizonMarks call={call} />
                      </td>
                      <td>
                        <GcTube percent={reading.percent} tube={reading.tube} grade={reading.id} variant="inline" meta="none" />
                      </td>
                      <td>
                        <GcGradePill grade={reading.id} />
                        {call.supersession.status === "nullified" ? (
                          <p className="mt-1 text-[10px] uppercase tracking-wider text-faint">Not scored</p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3">
          <section className="panel p-4">
            <h2 className="text-sm font-semibold">Board health</h2>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-faint">30D outcomes</p>
            <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
              <span className="h-full bg-hit" style={{ width: `${health.strong}%` }} />
              <span className="h-full bg-provisional" style={{ width: `${health.provisional}%` }} />
              <span className="h-full bg-miss" style={{ width: `${health.weak}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[11px] text-faint">
              <span>Strong {health.strong}%</span>
              <span>Prov {health.provisional}%</span>
              <span>Weak {health.weak}%</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              {healthGraded === 0
                ? "No active call has a 30-day print in this cut yet."
                : `Shares of the ${healthGraded} active calls that already have a 30-day print. Open windows are not in the bar.`}{" "}
              Grades never use intraday spikes. Close-to-close only, split-adjusted.
            </p>
          </section>

          <section className="panel p-4">
            <h2 className="text-sm font-semibold">Price integrity</h2>
            <ul className="mt-2 space-y-1 text-[13px] leading-6 text-muted">
              <li>✓ Split-adjusted history</li>
              <li>✓ Close-to-close prints only</li>
              <li>✓ A missing quote stops the seed</li>
              <li>
                ✓{" "}
                <Link href="/methodology#demo" className="text-brass hover:text-ink">
                  Appeal path on Method
                </Link>
              </li>
            </ul>
          </section>

          <section className="panel p-4">
            <h2 className="text-sm font-semibold">Factor scale · GC</h2>
            <GcTube percent={factor.percent} tube={factor.tube} grade={factor.id} className="my-3" />
            <p className="text-xs leading-5 text-muted">
              The tube is the mean 0–100 grade of active calls over {windowLabel}.{" "}
              <strong className="font-medium text-ink">Strong</strong> — at or above 70, direction held often enough to clear the line.{" "}
              <strong className="font-medium text-ink">Weak</strong> — graded under 40.{" "}
              <strong className="font-medium text-ink">Provisional</strong> — graded from 40 up to 70, mixed against the print.
            </p>
            <p className="mt-2.5 text-xs">
              <Link href="/methodology#gc-scale" className="text-brass hover:text-ink">
                View GC scale →
              </Link>
            </p>
          </section>

          <section className="panel p-4">
            <h2 className="text-sm font-semibold">GC · exit liquidity</h2>
            <GcTube percent={0} tube={0} grade="exit" meta="row" className="my-3" />
            <p className="text-xs leading-5 text-muted">
              0% fill means no calibrated horizon yet — labeled <strong className="font-medium text-ink">exit liquidity</strong>, not a scored zero.{" "}
              {openOnBoard === 0
                ? `Every active call in this cut has a print for ${windowLabel}.`
                : `${openOnBoard} active ${openOnBoard === 1 ? "call has" : "calls have"} no print for ${windowLabel}.`}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
