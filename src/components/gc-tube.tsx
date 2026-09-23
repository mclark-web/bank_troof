import { GC_GRADE_LABEL, type GcGradeId } from "@/lib/gc-grade";
import { cx } from "@/lib/format";

function Liquid({ rich }: { rich: boolean }) {
  return (
    <div className="gc-liquid">
      <div className="gc-liquid-core" />
      <div className="gc-swirl">
        {rich ? <div className="vortex" /> : null}
        {rich ? <div className="vortex vortex-b" /> : null}
        <div className="tex" />
        {rich ? (
          <>
            <div className="tex-b" />
            <div className="tex-c" />
            <div className="caustic" />
            <div className="caustic caustic-b" />
            <div className="orb orb-a" />
            <div className="orb orb-b" />
            <div className="orb orb-c" />
          </>
        ) : null}
      </div>
      <div className="gc-liquid-sheen" />
      {rich ? <div className="gc-wave" /> : null}
      <div className="gc-meniscus" />
    </div>
  );
}

export function GcGradePill({ grade }: { grade: GcGradeId }) {
  const tone = grade === "provisional" ? "provisional" : grade;
  return <span className={cx("gc-grade-tag", tone)}>{GC_GRADE_LABEL[grade]}</span>;
}

export function GcTube({
  percent,
  tube,
  grade,
  variant = "sidebar",
  meta = "stack",
  label = "GC · Grade calibration",
  className,
}: {
  /** Printed percent. Exit liquidity prints 0. */
  percent: number;
  /** Liquid width. Pass 0 for an empty glass. */
  tube: number;
  grade: GcGradeId;
  variant?: "sidebar" | "inline" | "mini";
  meta?: "stack" | "row" | "none";
  label?: string;
  className?: string;
}) {
  const empty = tube <= 0 || grade === "exit";
  const rich = variant === "sidebar";
  const variantClass = variant === "inline" ? "is-inline gc-inline" : variant === "mini" ? "is-mini" : "is-sidebar";
  return (
    <div
      className={cx("gc-scale", variantClass, empty && "is-empty", className)}
      style={{ ["--gc-fill" as string]: `${empty ? 0 : tube}%` }}
    >
      {rich ? <div className="gc-bloom" /> : null}
      <div className="gc-tube" aria-hidden>
        <Liquid rich={rich} />
      </div>
      {meta === "none" ? null : (
        <div className={cx("gc-meta", meta === "row" && "gc-meta-row")}>
          <div className="gc-label">{label}</div>
          <div className="gc-pct">{percent}%</div>
          <GcGradePill grade={grade} />
        </div>
      )}
    </div>
  );
}
