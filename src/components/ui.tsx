import Link from "next/link";
import { HORIZONS, HORIZON_KEYS, formatPoints, placeChad, type ChadPlacement, type HorizonKey } from "@/lib/scoring";
import { avatarColor, cx, initials, pct } from "@/lib/format";
import { actionLabel, ratingLabel, ratingTone } from "@/lib/labels";
import type { Aggregate } from "@/lib/scoring";
import type { SupersessionMark } from "@/lib/supersession";

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
        <h1 className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">{title}</h1>
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

export function ChadScore({
  raw,
  peers,
  caption,
}: {
  raw: number | null | undefined;
  peers: number[];
  caption?: string;
}) {
  const placement = placeChad(raw, peers);
  const value = placement.chad;
  const points = raw == null || Number.isNaN(raw) ? 0 : Math.min(100, Math.max(0, raw));
  return (
    <div>
      <p className="kicker">{caption ?? "Chad score"}</p>
      <p className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-3">
        <span className="flex items-end gap-3">
          <span
            className="num text-7xl leading-none tracking-tight"
            aria-label={value == null ? "No Chad score" : `Chad ${value} out of 10. 1 is Chud, 10 is Chad.`}
          >
            {value == null ? "—" : value}
          </span>
          <span className="mb-2 text-sm leading-5 text-muted">
            <span className="block text-ink">Chad · out of 10</span>
            <span className="text-miss">1 = Chud</span>
            <span className="mx-1 text-faint">→</span>
            <span className="text-hit">10 = Chad</span>
          </span>
        </span>
        <span className="mb-2">
          <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Score</span>
          <span className="num text-3xl leading-none text-ink">{formatPoints(raw)}</span>
          <span className="num text-lg text-faint">/100</span>
        </span>
      </p>
      <div className="mt-4 h-2 max-w-sm overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div className="h-full bg-brass" style={{ width: `${points}%` }} />
      </div>
      <SideNote placement={placement} />
      <ol className="mt-3 flex max-w-sm gap-1" aria-hidden>
        {Array.from({ length: 10 }, (_, index) => index + 1).map((step) => (
          <li
            key={step}
            title={step === 1 ? "1 Chud" : step === 10 ? "10 Chad" : String(step)}
            className={cx(
              "h-1.5 flex-1 rounded-sm",
              value != null && step <= value ? "bg-brass" : "bg-white/10",
              value === step && "ring-1 ring-brass",
            )}
          />
        ))}
      </ol>
      <p className="mt-1 flex max-w-sm justify-between text-[11px] uppercase tracking-wider">
        <span className="text-miss">1 Chud</span>
        <span className="text-hit">10 Chad</span>
      </p>
    </div>
  );
}

export function SideNote({ placement, className = "" }: { placement: ChadPlacement; className?: string }) {
  if (!placement.side || !placement.label) return null;
  const tone = placement.side === "chud" ? "text-miss" : placement.side === "chad" ? "text-hit" : "text-brass";
  return <p className={cx("text-sm", tone, className)}>{placement.label}</p>;
}

export function ScoreBar({ score, placement }: { score: number | null; placement: ChadPlacement }) {
  const chad = placement.chad;
  const width = score == null ? 0 : Math.min(100, Math.max(0, score));
  return (
    <div title={chad == null ? "No score" : `Chad ${chad} of 10. Score ${formatPoints(score)} of 100. ${placement.label ?? ""}`}>
      <div className="flex items-baseline gap-2">
        <span className="num text-2xl leading-none text-ink">{chad == null ? "—" : chad}</span>
        <span className="num text-[11px] text-faint">/10</span>
        <span className="num text-sm text-muted">
          {formatPoints(score)}
          <span className="text-faint">/100</span>
        </span>
      </div>
      <div className="mt-1 hidden h-1.5 w-24 overflow-hidden rounded-full bg-white/10 sm:block" aria-hidden>
        <div className="h-full bg-brass" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function PointsCell({ score }: { score: number | null }) {
  const width = score == null ? 0 : Math.min(100, Math.max(0, score));
  return (
    <div className="flex items-center gap-2">
      <span className="num min-w-14 text-ink">
        {formatPoints(score)}
        <span className="text-faint">/100</span>
      </span>
      <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-white/10 md:block" aria-hidden>
        <div className="h-full bg-brass" style={{ width: `${width}%` }} />
      </div>
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

export function RatingPill({ rating }: { rating: string }) {
  const tone = ratingTone(rating);
  const cls =
    tone === "up" ? "text-hit" : tone === "down" ? "text-miss" : "text-muted";
  return <span className={cx("num text-xs uppercase tracking-wide", cls)}>{ratingLabel(rating)}</span>;
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

export function AggregateStats({
  aggregate,
  horizon,
  peers,
}: {
  aggregate: Aggregate;
  horizon: HorizonKey;
  peers: number[];
}) {
  const followed = aggregate.avgFollowedReturn;
  return (
    <div>
      <ChadScore raw={aggregate.avgScore} peers={peers} caption={`${HORIZONS[horizon].short} Chad score`} />
      <div className="mt-6 grid grid-cols-3 gap-5 border-t border-line pt-5">
        <Stat label="Hit rate" value={aggregate.hitRate == null ? "—" : `${Math.round(aggregate.hitRate * 100)}%`} />
        <Stat
          label="If followed"
          value={pct(followed)}
          tone={followed == null ? "plain" : followed >= 0 ? "hit" : "miss"}
          hint="Directional calls only"
        />
        <Stat label="Graded" value={String(aggregate.graded)} hint="Calls in the window" />
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
