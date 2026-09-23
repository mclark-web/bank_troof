/**
 * Visual grade for the GC tube. This does not grade a call.
 * `gradeCall` in scoring.ts remains the price grade. The percent on a tube
 * is that 0–100 score (or the mean of those scores). Exit liquidity is an
 * open window, not a scored zero.
 */

export type GcGradeId = "strong" | "weak" | "provisional" | "exit";

/** Same absolute line as CHUD_LINE in scoring.ts. At or above this, the tube reads Strong. */
export const GC_STRONG_LINE = 70;

/** Graded scores from this line up to (but not including) strong are Provisional. */
export const GC_PROVISIONAL_LINE = 40;

/** Tube title. Spelled out once on the methodology page. */
export const GC_SCALE_LABEL = "GC Scale";

export const GC_GRADE_LABEL: Record<GcGradeId, string> = {
  strong: "STRONG",
  weak: "WEAK",
  provisional: "PROVISIONAL",
  exit: "EXIT LIQUIDITY",
};

export type GcReading = {
  id: GcGradeId;
  /** Integer printed beside the tube. */
  percent: number;
  /** Liquid width. Zero only for exit liquidity, so a graded zero is not an empty glass. */
  tube: number;
};

const EXIT: GcReading = { id: "exit", percent: 0, tube: 0 };

export function readCalibration(score: number | null | undefined, gradeable: boolean): GcReading {
  if (!gradeable || score == null || Number.isNaN(score)) return EXIT;
  const clamped = Math.min(100, Math.max(0, score));
  const percent = Math.round(clamped);
  const id: GcGradeId = clamped >= GC_STRONG_LINE ? "strong" : clamped >= GC_PROVISIONAL_LINE ? "provisional" : "weak";
  return { id, percent, tube: percent === 0 ? 2 : percent };
}

/** Mean of gradeable scores. An empty list is exit liquidity at 0%. */
export function readMean(scores: readonly number[]): GcReading {
  if (scores.length === 0) return EXIT;
  const total = scores.reduce((sum, score) => sum + score, 0);
  return readCalibration(total / scores.length, true);
}

export type HorizonSlice = { score: number | null; gradeable: boolean };

/**
 * One call on the board. `all` averages every horizon that already has a print.
 * A single horizon uses that window only, even when other windows have closed.
 */
export function readCallCalibration(grades: readonly HorizonSlice[], horizon: number | "all"): GcReading {
  if (horizon === "all") {
    return readMean(grades.filter((grade) => grade.gradeable && grade.score != null).map((grade) => grade.score as number));
  }
  const grade = grades[horizon];
  if (!grade) return EXIT;
  return readCalibration(grade.score, grade.gradeable);
}

/** Integer percents that sum to 100. Largest remainders get the leftover points. */
export function percentShares(counts: Record<GcGradeId, number>, keys: readonly GcGradeId[]): Record<GcGradeId, number> {
  const total = keys.reduce((sum, key) => sum + counts[key], 0);
  const out = { strong: 0, weak: 0, provisional: 0, exit: 0 };
  if (total === 0) return out;
  const rows = keys.map((key) => {
    const exact = (counts[key] / total) * 100;
    return { key, exact, floor: Math.floor(exact) };
  });
  let leftover = 100 - rows.reduce((sum, row) => sum + row.floor, 0);
  const ranked = [...rows].sort((a, b) => b.exact - b.floor - (a.exact - a.floor) || keys.indexOf(a.key) - keys.indexOf(b.key));
  for (const row of ranked) {
    if (leftover <= 0) break;
    row.floor += 1;
    leftover -= 1;
  }
  for (const row of rows) out[row.key] = row.floor;
  return out;
}
