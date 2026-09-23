import Link from "next/link";
import { OVERALL_FACTOR_FORMULA, type OverallFactor } from "@/lib/overall-factor";
import { HORIZONS, HORIZON_KEYS, formatPoints, placeChad, type ChadPlacement, type HorizonKey } from "@/lib/scoring";
import { readCalibration } from "@/lib/gc-grade";
import { avatarColor, cx, initials, pct } from "@/lib/format";
import { actionLabel, recommendationLabel, recommendationTone, type RecommendationCall } from "@/lib/labels";
import type { SupersessionMark } from "@/lib/supersession";
import { GcTube } from "@/components/gc-tube";

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
}: {
  path: string;
  current: Record<string, string | undefined>;
  horizon: HorizonKey;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Horizon">
      {HORIZON_KEYS.map((key) => (
        <Link
          key={key}
          href={hrefWith(path, current, { horizon: key === "90" ? null : key })}
          className={horizon === key ? "chip-on" : "chip"}
          aria-current={horizon === key ? "true" : undefined}
        >
          {HORIZONS[key].short}
          <span className="sr-only"> horizon</span>
        </Link>
      ))}
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
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{label}</p>
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
      <span className="num text-miss">1</span> Chud
      <span className="text-faint">, terrible track record</span>
      <span className="mx-1.5 text-faint">·</span>
      <span className="num text-hit">10</span> Chad
      <span className="text-faint">, excellent track record</span>
    </p>
  );
}

export function SideNote({ placement, className = "" }: { placement: ChadPlacement; className?: string }) {
  if (!placement.side || !placement.label) return null;
  const tone = placement.side === "chud" ? "text-miss" : placement.side === "chad" ? "text-hit" : "text-brass";
  return <p className={cx("text-sm", tone, className)}>{placement.label}</p>;
}

export function ScoreBar({ score, placement }: { score: number | null; placement: ChadPlacement }) {
  const chad = placement.chad;
  const title =
    score == null
      ? "No overall factor"
      : `Overall factor ${formatPoints(score)} of 100. Chad ${chad ?? "—"} of 10. ${placement.label ?? ""}`;
  const reading = readCalibration(score, score != null);
  return (
    <div title={title}>
      <div className="flex items-baseline gap-2">
        <span className="num text-2xl leading-none text-ink">{formatPoints(score)}</span>
        <span className="num text-[11px] text-faint">/100</span>
        <span className="num text-sm text-muted">
          {chad == null ? "—" : chad}
          <span className="text-faint">/10</span>
        </span>
      </div>
      <GcTube
        className="mt-1.5 hidden sm:flex"
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
  const reading = readCalibration(score, score != null);
  return (
    <div className="flex items-center gap-2">
      <span className="num min-w-14 text-ink">
        {formatPoints(score)}
        <span className="text-faint">/100</span>
      </span>
      <GcTube percent={reading.percent} tube={reading.tube} grade={reading.id} variant="inline" meta="none" className="hidden md:flex" />
    </div>
  );
}

export function SupersessionNotes({ mark, verbose = true }: { mark: SupersessionMark; verbose?: boolean }) {
  if (!mark.nullifiedNote && !mark.supersedesNote) return null;
  return (
    <div className="mt-1 max-w-xs space-y-1">
      <div className="flex flex-wrap gap-1">
        {mark.status === "nullified" ? (
          <span className="inline-flex rounded-full border border-miss/50 bg-miss/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-miss">
            Nullified
          </span>
        ) : null}
        {mark.supersedesId ? (
          <span className="inline-flex rounded-full border border-brass/50 bg-brass/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-brass">
            Supersedes
          </span>
        ) : null}
      </div>
      {verbose && mark.nullifiedNote ? (
        <p className="text-[11px] leading-4 text-muted">
          {mark.nullifiedNote}
          {mark.supersededById ? (
            <>
              {" "}
              <Link href={`/calls/${mark.supersededById}`} className="text-brass hover:text-ink">
                Later call
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
      {verbose && mark.supersedesNote ? (
        <p className="text-[11px] leading-4 text-muted">
          {mark.supersedesNote}
          {mark.supersedesId ? (
            <>
              {" "}
              <Link href={`/calls/${mark.supersedesId}`} className="text-brass hover:text-ink">
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
  if (!result) return <span className="text-faint">Open</span>;
  const label = result === "hit" ? "Hit" : result === "near" ? "Near" : "Miss";
  const cls =
    result === "hit"
      ? "border-hit/40 bg-hit/10 text-hit"
      : result === "miss"
        ? "border-miss/40 bg-miss/10 text-miss"
        : "border-brass/40 bg-brass/10 text-brass";
  return <span className={cx("inline-flex rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wider", cls)}>{label}</span>;
}

export function RecommendationPill({ call }: { call: RecommendationCall }) {
  const tone = recommendationTone(call);
  const cls = tone === "up" ? "text-hit" : tone === "down" ? "text-miss" : "text-muted";
  return <span className={cx("num text-sm font-medium uppercase tracking-wide", cls)}>{recommendationLabel(call)}</span>;
}

export function Avatar({ name, seed }: { name: string; seed?: string }) {
  return (
    <div
      className="grid h-16 w-16 shrink-0 place-items-center rounded-md font-serif text-xl text-brass"
      style={{ background: avatarColor(seed ?? name) }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

export function OverallFactorCard({
  factor,
  peers,
  horizon,
}: {
  factor: OverallFactor;
  peers: number[];
  horizon: HorizonKey;
}) {
  const placement = placeChad(factor.score, peers);
  const chad = placement.chad;
  const reading = readCalibration(factor.score, factor.activeGraded > 0 && factor.score != null);
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
          <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Chad</span>
          <span
            className="num text-4xl leading-none"
            aria-label={chad == null ? "No Chad score" : `Chad ${chad} out of 10. 1 is Chud, 10 is Chad.`}
          >
            {chad == null ? "—" : chad}
          </span>
          <span className="num text-lg text-faint">/10</span>
          <span className="mt-1 block text-xs text-muted">
            <span className="text-miss">1 = Chud</span>
            <span className="mx-1 text-faint">→</span>
            <span className="text-hit">10 = Chad</span>
          </span>
        </p>
      </div>
      <GcTube percent={reading.percent} tube={reading.tube} grade={reading.id} meta="row" className="mt-4 max-w-sm" />
      <SideNote placement={placement} className="mt-2" />
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        {OVERALL_FACTOR_FORMULA}{" "}
        <Link href="/methodology#overall-factor" className="text-brass hover:text-ink">
          How this is computed
        </Link>
      </p>
      <div className="mt-6 grid grid-cols-2 gap-5 border-t border-line pt-5 sm:grid-cols-4">
        <Stat label="Active graded" value={String(factor.activeGraded)} hint="In this factor" />
        <Stat label="Superseded" value={String(factor.superseded)} hint="Visible, not scored" />
        <Stat label="Hit rate" value={hit} hint="Active calls only" />
        <Stat
          label="If followed"
          value={pct(followed)}
          tone={followed == null ? "plain" : followed >= 0 ? "hit" : "miss"}
          hint="Active directional calls"
        />
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
    <section className="panel overflow-hidden">
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
              <p className="mt-1 text-[11px] text-faint">
                {row.hitRate == null ? "—" : `${Math.round(row.hitRate * 100)}% hit`}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
