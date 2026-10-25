import Link from "next/link";
import { OVERALL_FACTOR_FORMULA, type OverallFactor } from "@/lib/overall-factor";
import { HORIZONS, HORIZON_KEYS, formatPoints, placeChad, type ChadPlacement, type HorizonKey } from "@/lib/scoring";
import { GC_PROVISIONAL_LINE, GC_SCALE_LABEL, GC_STRONG_LINE, readCalibration } from "@/lib/gc-grade";
import { cx, initials, pct } from "@/lib/format";
import { actionLabel, recommendationLabel, sourceLinkLabel, type RecommendationCall } from "@/lib/labels";
import type { SupersessionMark } from "@/lib/supersession";
import { GcGradePill, GcTube, GcUngraded } from "@/components/gc-tube";

export function hrefWith(
  path: string,
  current: Record<string, string | undefined>,
  patch: Record<string, string | null | undefined>,
) {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(current)) {
    if (value) next[key] = value;
  }
  for (const [key, value] of Object.entries(patch)) {
    if (!value) delete next[key];
    else next[key] = value;
  }
  const params = new URLSearchParams(next);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function PageIntro({
  kicker,
  title,
  lede,
  children,
}: {
  kicker?: string;
  title: string;
  lede?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h1 className="mt-2 font-sans text-4xl tracking-tight md:text-5xl">{title}</h1>
        {lede ? <p className="mt-3 text-base leading-7 text-muted">{lede}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function HorizonChips({
  path,
  current,
  horizon,
  defaultHorizon,
  counts,
  noun = "analysts",
}: {
  path: string;
  current: Record<string, string | undefined>;
  horizon: HorizonKey;
  /** Chip that clears the horizon query, because that cut is the computed default. */
  defaultHorizon?: HorizonKey;
  /** Names at the sample minimum on each horizon. */
  counts?: Partial<Record<HorizonKey, number>>;
  noun?: string;
}) {
  const openHorizon = defaultHorizon ?? "90";
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-3" role="group" aria-label="Horizon">
      {HORIZON_KEYS.map((key) => {
        const count = counts?.[key];
        const counted = count === 1 ? noun.replace(/s$/, "") : noun;
        const label = count == null ? `${HORIZONS[key].short} horizon` : `${HORIZONS[key].short} horizon, ${count} ${counted}`;
        return (
          <Link
            key={key}
            href={hrefWith(path, current, { horizon: key === openHorizon ? null : key })}
            className={horizon === key ? "chip-on" : "chip"}
            aria-current={horizon === key ? "true" : undefined}
            aria-label={label}
          >
            {HORIZONS[key].short}
            {count == null ? <span className="sr-only"> horizon</span> : <span className="num ml-1">{count}</span>}
          </Link>
        );
      })}
    </div>
  );
}

export function SectorForm({
  path,
  hidden,
  sectors,
  sector,
}: {
  path: string;
  hidden: Record<string, string | undefined>;
  sectors: string[];
  sector?: string;
}) {
  return (
    <form action={path} className="flex flex-wrap items-center gap-2">
      {Object.entries(hidden).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null,
      )}
      <label className="sr-only" htmlFor={`sector-${path}`}>
        Sector
      </label>
      <select id={`sector-${path}`} name="sector" defaultValue={sector ?? ""} className="field w-auto min-w-40">
        <option value="">All sectors</option>
        {sectors.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <button className="btn-ghost" type="submit">
        Filter
      </button>
    </form>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "hit" | "miss" | "plain";
}) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-faint">{label}</p>
      <p
        className={cx(
          "mt-1 font-mono text-2xl tabular-nums md:text-3xl",
          tone === "hit" && "text-hit",
          tone === "miss" && "text-miss",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

export function ScaleLegend({ className = "" }: { className?: string }) {
  return (
    <p className={cx("text-xs text-muted", className)}>
      <span className="num text-muted">GC 1</span>
      <span className="text-faint">, poor track record</span>
      <span className="mx-1.5 text-faint">·</span>
      <span className="num text-muted">GC 10</span>
      <span className="text-faint">, excellent track record</span>
    </p>
  );
}

export function SideNote({ placement, className = "" }: { placement: ChadPlacement; className?: string }) {
  if (!placement.label || placement.chad == null) return null;
  const tone = placement.side ? "text-muted" : "text-faint";
  return <p className={cx("text-sm", tone, className)}>{placement.label}</p>;
}

export function ScoreBar({ score, placement }: { score: number | null; placement: ChadPlacement }) {
  const chad = placement.chad;
  const title =
    score == null
      ? "No overall factor"
      : `Overall factor ${formatPoints(score)} of 100. GC score ${chad ?? "—"} of 10.${chad == null ? "" : ` ${placement.label ?? ""}`}`;
  if (score == null) {
    return <GcUngraded compact />;
  }
  const reading = readCalibration(score, true);
  return (
    <div title={title} aria-label={chad == null ? (placement.label ?? title) : undefined}>
      <div className="flex flex-nowrap items-baseline gap-2 whitespace-nowrap">
        <span className="num text-2xl leading-none text-ink">{formatPoints(score)}</span>
        <span className="num text-xs text-faint">/100</span>
        <span className="num text-sm text-muted">
          {chad == null ? "—" : chad}
          <span className="text-faint">/10</span>
        </span>
      </div>
      {reading.id === "exit" ? <GcGradePill grade="exit" /> : null}
      <GcTube
        className="mt-1.5 hidden lg:flex"
        percent={reading.percent}
        tube={reading.tube}
        grade={reading.id}
        variant="inline"
        meta="none"
      />
    </div>
  );
}

export function PointsCell({ score }: { score: number | null }) {
  if (score == null) return <GcUngraded compact />;
  const reading = readCalibration(score, true);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="num whitespace-nowrap text-ink">
        {formatPoints(score)}
        <span className="text-faint">/100</span>
      </span>
      {reading.id === "exit" ? <GcGradePill grade="exit" /> : null}
      <GcTube percent={reading.percent} tube={reading.tube} grade={reading.id} variant="inline" meta="none" className="hidden xl:flex" />
    </div>
  );
}

export function SupersessionNotes({ mark, verbose = true }: { mark: SupersessionMark; verbose?: boolean }) {
  if (!mark.nullifiedNote && !mark.supersedesNote) return null;
  return (
    <div className="supersession-notes mt-1 max-w-xs">
      <div className="flex flex-wrap gap-1">
        {mark.status === "nullified" ? (
          <span className="tag-note">Nullified</span>
        ) : null}
        {mark.supersedesId ? (
          <span className="tag-note">Supersedes</span>
        ) : null}
      </div>
      {verbose && mark.nullifiedNote ? (
        <p className="text-xs leading-4 text-muted">
          {mark.nullifiedNote}
          {mark.supersededById ? (
            <>
              {" "}
              <Link href={`/calls/${mark.supersededById}`} className="hit-44 text-brass hover:text-ink">
                Later call
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
      {verbose && mark.supersedesNote ? (
        <p className="text-xs leading-4 text-muted">
          {mark.supersedesNote}
          {mark.supersedesId ? (
            <>
              {" "}
              <Link href={`/calls/${mark.supersedesId}`} className="hit-44 text-brass hover:text-ink">
                Prior call
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

export function GradePill({ result }: { result: "hit" | "near" | "miss" | null }) {
  if (!result) return <GcUngraded compact />;
  const label = result === "hit" ? "Hit" : result === "near" ? "Near" : "Miss";
  const cls =
    result === "hit"
      ? "border-hit/40 bg-hit/10 text-hit"
      : result === "near"
        ? "border-[rgba(154,154,163,0.35)] bg-transparent text-[#c9c9cf]"
        : "border-miss/40 bg-miss/10 text-miss";
  return <span className={cx("grade-pill inline-flex rounded-full border px-2 text-xs uppercase tracking-wider", cls)}>{label}</span>;
}

export function RecommendationPill({ call }: { call: RecommendationCall }) {
  return <span className="rec-pill">{recommendationLabel(call)}</span>;
}

export function CallSourceLinks({
  sourceUrl,
  altSourceUrl,
  className = "",
}: {
  sourceUrl?: string | null;
  altSourceUrl?: string | null;
  className?: string;
}) {
  if (!sourceUrl && !altSourceUrl) return null;
  return (
    <p className={cx("mt-1 flex flex-wrap gap-x-4 text-xs", className)}>
      {sourceUrl ? (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="hit-44 text-brass hover:text-ink">
          {sourceLinkLabel(sourceUrl)}
        </a>
      ) : null}
      {altSourceUrl ? (
        <a href={altSourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="hit-44 text-brass hover:text-ink">
          Alt source
        </a>
      ) : null}
    </p>
  );
}

export function Avatar({ name }: { name: string; seed?: string }) {
  return (
    <div
      className="analyst-avatar grid h-16 w-16 shrink-0 place-items-center rounded-md font-serif text-xl text-brass"
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

export function OverallFactorCard({
  factor,
  horizon,
}: {
  factor: OverallFactor;
  horizon: HorizonKey;
}) {
  const placement = placeChad(factor.score);
  const chad = placement.chad;
  const gradeable = factor.activeGraded > 0 && factor.score != null;
  const reading = readCalibration(factor.score, gradeable);
  const followed = factor.aggregate.avgFollowedReturn;
  const hit = factor.hitRate == null ? "—" : `${Math.round(factor.hitRate * 100)}%`;
  return (
    <div id="overall-factor">
      <p className="kicker">Overall factor · {HORIZONS[horizon].short}</p>
      <div className="mt-2 flex flex-wrap items-end gap-x-10 gap-y-4">
        <p>
          <span
            className="num text-7xl leading-none tracking-tight"
            aria-label={
              factor.score == null
                ? "No overall factor"
                : `Overall factor ${formatPoints(factor.score)} out of 100`
            }
          >
            {formatPoints(factor.score)}
          </span>
          <span className="num ml-1 text-2xl text-faint">/100</span>
          <span className="mt-2 block text-sm text-muted">Average of active call grades</span>
        </p>
        <p className="mb-1">
          <span className="block font-mono text-xs uppercase tracking-[0.16em] text-faint">GC score</span>
          <span
            className="num text-4xl leading-none"
            aria-label={
              chad == null
                ? "No GC score"
                : `GC score ${chad} out of 10 on the GC Scale. 1 is a poor track record, 10 is an excellent one.`
            }
          >
            {chad == null ? "—" : chad}
          </span>
          <span className="num text-lg text-faint">/10</span>
          <span className="mt-1 block text-xs text-muted">
            <span className="text-muted">GC 1</span>
            <span className="mx-1 text-faint">→</span>
            <span className="text-muted">GC 10</span>
          </span>
        </p>
      </div>
      {gradeable ? (
        <GcTube percent={reading.percent} tube={reading.tube} grade={reading.id} meta="row" className="mt-4 max-w-sm" />
      ) : (
        <GcUngraded className="mt-4 max-w-sm" />
      )}
      <SideNote placement={placement} className="mt-2" />
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        {OVERALL_FACTOR_FORMULA}{" "}
        <Link href="/methodology#overall-factor" className="compute-link text-brass hover:text-ink">
          How this is computed
        </Link>
      </p>
      <div className="mt-6 grid grid-cols-2 gap-5 border-t border-line pt-5 sm:grid-cols-4">
        <Stat label="Active graded" value={String(factor.activeGraded)} hint="In this factor" />
        <Stat label="Superseded" value={String(factor.superseded)} hint="Visible, not scored" />
        <Stat label="Hit rate" value={hit} hint="Active calls only" />
        <Stat label="If followed" value={pct(followed)} hint="Active directional calls" />
      </div>
    </div>
  );
}

export function ActionText({ action }: { action: string }) {
  return <span>{actionLabel(action)}</span>;
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="panel px-4 py-8 text-center text-sm text-muted">{children}</p>;
}

export function MiniLeaderboard({
  title,
  href,
  rows,
}: {
  title: string;
  href: string;
  rows: { name: string; href: string; subtitle: string; score: number | null; hitRate: number | null; placement: ChadPlacement }[];
}) {
  return (
    <section className="panel min-w-0">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <h2 className="font-serif text-xl">{title}</h2>
        <Link href={href} className="text-xs uppercase tracking-wider text-brass hover:text-ink">
          Full board
        </Link>
      </div>
      <ol>
        {rows.map((row, index) => (
          <li key={row.href} className="flex items-center gap-3 border-b border-line/70 px-4 py-3 last:border-0">
            <span className="num w-5 text-faint">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <Link href={row.href} className="block truncate hover:text-brass">
                {row.name}
              </Link>
              <p className="truncate text-xs text-faint">{row.subtitle}</p>
            </div>
            <div className="text-right">
              <ScoreBar score={row.score} placement={row.placement} />
              <p className="mt-1 text-xs text-faint">
                {row.hitRate == null ? "—" : `${Math.round(row.hitRate * 100)}% hit`}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Heat step for one horizon. Same 70/40 lines as the GC Scale. EXIT is a graded score of exactly 0. */
export type HeatStep = "strong" | "provisional" | "weak" | "exit" | "open";

/**
 * Band from the unrounded score, via the same calibration as the tube.
 * A score that only rounds to 0 stays WEAK. Rounding the score first would
 * call 0.193 EXIT and 39.912 PROVISIONAL.
 */
export function heatStep(score: number | null, gradeable: boolean): HeatStep {
  if (!gradeable || score == null || Number.isNaN(score)) return "open";
  return readCalibration(score, true).id;
}

const HEAT_GLYPH: Record<HeatStep, string> = { strong: "▲", provisional: "◆", weak: "▼", exit: "", open: "" };

const HEAT_BAND: Record<Exclude<HeatStep, "open">, string> = {
  strong: "STRONG",
  provisional: "PROVISIONAL",
  weak: "WEAK",
  exit: "EXIT LIQUIDITY",
};

/** Printed percent. The band still comes from the unrounded score. */
export function heatPercent(score: number | null, gradeable: boolean): number | null {
  const step = heatStep(score, gradeable);
  if (step === "open") return null;
  const percent = readCalibration(score, true).percent;
  // Keep the printed number inside its band: a WEAK score never prints 0% or 40%,
  // a PROVISIONAL score never prints 70%. The band itself is unchanged.
  if (step === "weak") return Math.min(GC_PROVISIONAL_LINE - 1, percent);
  if (step === "provisional") return Math.min(GC_STRONG_LINE - 1, percent);
  return percent;
}

/** Pill face. A rounded 0 that is still WEAK reads "▼ 0%", not EXIT. */
export function heatVisible(score: number | null, gradeable: boolean): string {
  const step = heatStep(score, gradeable);
  if (step === "open") return "Not graded yet";
  if (step === "exit") return "0%";
  const percent = heatPercent(score, gradeable);
  return `${HEAT_GLYPH[step]} ${step === "weak" && percent === 0 ? "<1" : percent}%`;
}

/** aria-label and title. Includes the glyph, the printed percent, and the band. */
export function heatAccessibleName(horizonLabel: string, score: number | null, gradeable: boolean): string {
  const step = heatStep(score, gradeable);
  if (step === "open") return `${GC_SCALE_LABEL}, ${horizonLabel}: not graded yet`;
  if (step === "exit") return `${GC_SCALE_LABEL}, ${horizonLabel}: ${HEAT_BAND.exit}`;
  return `${GC_SCALE_LABEL}, ${horizonLabel}: ${heatVisible(score, gradeable)} ${HEAT_BAND[step]}`;
}

/**
 * Fixed five-slot horizon strip: 2W 1M 2M 3M 1Y, always in this order, same pill size.
 * Warm = fuller, brighter orange; cold = dim grey on charcoal. The % text and a glyph
 * carry the reading so colour is never the only signal. Open windows read "Not graded yet".
 */
export function HorizonHeatStrip({ grades }: { grades: Record<HorizonKey, { score: number | null; gradeable: boolean }> }) {
  if (HORIZON_KEYS.every((key) => heatStep(grades[key].score, grades[key].gradeable) === "open")) {
    // Every window still open: one full-width neutral row instead of five wrapped slots.
    return (
      <ol className="heat-strip is-all-open" aria-label={`${GC_SCALE_LABEL} by horizon`}>
        <li className="heat-pill heat-open" aria-label={`${GC_SCALE_LABEL}, all horizons: not graded yet`}>
          <span className="heat-h" aria-hidden>{HORIZON_KEYS.map((key) => HORIZONS[key].short).join(" · ")}</span>
          <span className="heat-v" aria-hidden>Not graded yet</span>
        </li>
      </ol>
    );
  }
  return (
    <ol className="heat-strip" aria-label={`${GC_SCALE_LABEL} by horizon`}>
      {HORIZON_KEYS.map((key) => {
        const g = grades[key];
        const step = heatStep(g.score, g.gradeable);
        const name = heatAccessibleName(HORIZONS[key].label, g.score, g.gradeable);
        const pct = heatPercent(g.score, g.gradeable);
        return (
          <li key={key} className={cx("heat-pill", `heat-${step}`)} aria-label={name} title={name}>
            <span className="heat-h" aria-hidden>{HORIZONS[key].short}</span>
            <span className="heat-v" aria-hidden>{heatVisible(g.score, g.gradeable)}</span>
            <span className="heat-bar" aria-hidden style={{ width: `${pct ?? 0}%` }} />
          </li>
        );
      })}
    </ol>
  );
}

export const HORIZON_MONTH_NOTE = "1M, 2M, and 3M are 30, 60, and 90 calendar days.";

export function HeatLegend() {
  return (
    <p className="heat-legend">
      <span className="heat-key heat-strong">▲ {GC_STRONG_LINE}–100% warm</span>
      <span className="heat-key heat-provisional">◆ {GC_PROVISIONAL_LINE}–{GC_STRONG_LINE - 1}%</span>
      <span className="heat-key heat-weak">▼ under {GC_PROVISIONAL_LINE}% cold</span>
      <span className="heat-key heat-exit">0% = EXIT LIQUIDITY</span>
      <span className="heat-key heat-open">Not graded yet</span>
      <span className="heat-note">{HORIZON_MONTH_NOTE}</span>
    </p>
  );
}
