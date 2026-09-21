export const HORIZON_KEYS = ["30", "90", "365"] as const;

export type HorizonKey = (typeof HORIZON_KEYS)[number];

export type Direction = "up" | "flat" | "down";

export type DirectionResult = "hit" | "near" | "miss";

export const DIRECTION_WEIGHT = 70;
export const TARGET_WEIGHT = 30;
export const NEAR_MISS_FACTOR = 0.5;
export const FLAT_NEAR_MULTIPLIER = 1.35;

/** Public report-card poles. 1 is a terrible track record. 10 is an excellent one. */
export const CHAD_MIN = 1;
export const CHAD_MAX = 10;

/** Anything under this 0–100 score is Chud territory. */
export const CHUD_LINE = 70;

export type ChadSide = "chud" | "mid" | "chad";

/**
 * Buckets of the 0–100 score. Upper bounds are exclusive except the last.
 * Under 70 stays on the Chud side (1–4). 70–84 is mid (5–7). 85–100 is Chad (8–10).
 */
export const CHAD_BANDS: { below: number; minLabel: number; maxLabel: number; chad: number; side: ChadSide }[] = [
  { below: 18, minLabel: 0, maxLabel: 17, chad: 1, side: "chud" },
  { below: 35, minLabel: 18, maxLabel: 34, chad: 2, side: "chud" },
  { below: 52, minLabel: 35, maxLabel: 51, chad: 3, side: "chud" },
  { below: 70, minLabel: 52, maxLabel: 69, chad: 4, side: "chud" },
  { below: 75, minLabel: 70, maxLabel: 74, chad: 5, side: "mid" },
  { below: 80, minLabel: 75, maxLabel: 79, chad: 6, side: "mid" },
  { below: 85, minLabel: 80, maxLabel: 84, chad: 7, side: "mid" },
  { below: 90, minLabel: 85, maxLabel: 89, chad: 8, side: "chad" },
  { below: 95, minLabel: 90, maxLabel: 94, chad: 9, side: "chad" },
  { below: 101, minLabel: 95, maxLabel: 100, chad: 10, side: "chad" },
];

function clampScore(raw: number | null | undefined): number | null {
  if (raw == null || Number.isNaN(raw)) return null;
  return Math.min(100, Math.max(0, raw));
}

function bandFor(raw: number | null | undefined) {
  const score = clampScore(raw);
  if (score == null) return null;
  return CHAD_BANDS.find((band) => score < band.below) ?? CHAD_BANDS[CHAD_BANDS.length - 1];
}

/** Public 1–10 bucket. The 0–100 score is mapped once; Chad integers are not averaged. */
export function toChadScore(raw: number | null | undefined): number | null {
  return bandFor(raw)?.chad ?? null;
}

export function chadSide(raw: number | null | undefined): ChadSide | null {
  return bandFor(raw)?.side ?? null;
}

export function chadSideLabel(raw: number | null | undefined): string | null {
  const side = chadSide(raw);
  if (side === "chud") return "Chud territory. It gets chuddy under 70.";
  if (side === "mid") return "Above 70. Respectable, not Chad yet.";
  if (side === "chad") return "Chad side.";
  return null;
}

export function formatChadScore(raw: number | null | undefined): string {
  const score = toChadScore(raw);
  if (score == null) return "—";
  return String(score);
}

/** Full engine score, shown beside the Chad bucket. One decimal when it is not a whole number. */
export function formatPoints(raw: number | null | undefined): string {
  if (raw == null || Number.isNaN(raw)) return "—";
  const clamped = Math.min(100, Math.max(0, raw));
  const rounded = Math.round(clamped * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export const HORIZONS: Record<
  HorizonKey,
  {
    days: number;
    label: string;
    short: string;
    threshold: number;
    ptFull: number;
    ptZero: number;
  }
> = {
  "30": {
    days: 30,
    label: "30 days",
    short: "30D",
    threshold: 0.02,
    ptFull: 0.04,
    ptZero: 0.12,
  },
  "90": {
    days: 90,
    label: "90 days",
    short: "90D",
    threshold: 0.05,
    ptFull: 0.08,
    ptZero: 0.22,
  },
  "365": {
    days: 365,
    label: "1 year",
    short: "1Y",
    threshold: 0.08,
    ptFull: 0.12,
    ptZero: 0.35,
  },
};

const UP = new Set(["strong_buy", "buy", "overweight", "outperform"]);
const FLAT = new Set(["hold", "neutral", "equal_weight"]);
const DOWN = new Set(["sell", "underperform", "underweight"]);

export function ratingDirection(rating: string): Direction | null {
  if (UP.has(rating)) return "up";
  if (FLAT.has(rating)) return "flat";
  if (DOWN.has(rating)) return "down";
  return null;
}

export function parseHorizon(value: string | undefined | null): HorizonKey {
  if (value === "30" || value === "365" || value === "90") return value;
  return "90";
}

export type CallInput = {
  ratingTo: string;
  priceAtCall: number;
  priceTargetTo: number | null;
  outcomePrice: number | null;
};

export type CallGrade = {
  gradeable: boolean;
  forwardReturn: number | null;
  expected: Direction | null;
  directionResult: DirectionResult | null;
  directionPoints: number;
  targetError: number | null;
  targetPoints: number | null;
  score: number | null;
  hit: boolean | null;
  followedReturn: number | null;
  threshold: number;
  nearFloor: number | null;
};

export function gradeCall(call: CallInput, horizon: HorizonKey): CallGrade {
  const spec = HORIZONS[horizon];
  const expected = ratingDirection(call.ratingTo);
  const empty: CallGrade = {
    gradeable: false,
    forwardReturn: null,
    expected,
    directionResult: null,
    directionPoints: 0,
    targetError: null,
    targetPoints: null,
    score: null,
    hit: null,
    followedReturn: null,
    threshold: spec.threshold,
    nearFloor: null,
  };

  if (!expected || call.outcomePrice == null || call.priceAtCall <= 0) {
    return empty;
  }

  const forwardReturn = call.outcomePrice / call.priceAtCall - 1;
  const T = spec.threshold;
  let directionResult: DirectionResult;
  let nearFloor: number | null = null;

  if (expected === "up") {
    nearFloor = T * NEAR_MISS_FACTOR;
    if (forwardReturn >= T) directionResult = "hit";
    else if (forwardReturn >= nearFloor) directionResult = "near";
    else directionResult = "miss";
  } else if (expected === "down") {
    nearFloor = -T * NEAR_MISS_FACTOR;
    if (forwardReturn <= -T) directionResult = "hit";
    else if (forwardReturn <= nearFloor) directionResult = "near";
    else directionResult = "miss";
  } else {
    nearFloor = T * FLAT_NEAR_MULTIPLIER;
    const abs = Math.abs(forwardReturn);
    if (abs <= T) directionResult = "hit";
    else if (abs <= nearFloor) directionResult = "near";
    else directionResult = "miss";
  }

  const directionPoints =
    directionResult === "hit"
      ? DIRECTION_WEIGHT
      : directionResult === "near"
        ? DIRECTION_WEIGHT * NEAR_MISS_FACTOR
        : 0;

  let targetError: number | null = null;
  let targetPoints: number | null = null;
  if (call.priceTargetTo != null && call.priceTargetTo > 0) {
    targetError = Math.abs(call.outcomePrice - call.priceTargetTo) / call.priceAtCall;
    if (targetError <= spec.ptFull) targetPoints = TARGET_WEIGHT;
    else if (targetError >= spec.ptZero) targetPoints = 0;
    else {
      const span = spec.ptZero - spec.ptFull;
      targetPoints = TARGET_WEIGHT * (1 - (targetError - spec.ptFull) / span);
    }
  }

  const score =
    targetPoints == null
      ? (directionPoints / DIRECTION_WEIGHT) * 100
      : directionPoints + targetPoints;

  const followedReturn =
    expected === "up" ? forwardReturn : expected === "down" ? -forwardReturn : null;

  return {
    gradeable: true,
    forwardReturn,
    expected,
    directionResult,
    directionPoints,
    targetError,
    targetPoints,
    score,
    hit: directionResult === "hit",
    followedReturn,
    threshold: T,
    nearFloor,
  };
}

export type Aggregate = {
  graded: number;
  hits: number;
  hitRate: number | null;
  missRate: number | null;
  avgScore: number | null;
  avgFollowedReturn: number | null;
  directionalCount: number;
};

export function aggregateGrades(grades: CallGrade[]): Aggregate {
  const graded = grades.filter((grade) => grade.gradeable && grade.score != null);
  if (graded.length === 0) {
    return {
      graded: 0,
      hits: 0,
      hitRate: null,
      missRate: null,
      avgScore: null,
      avgFollowedReturn: null,
      directionalCount: 0,
    };
  }
  const hits = graded.filter((grade) => grade.hit).length;
  const followed = graded
    .map((grade) => grade.followedReturn)
    .filter((value): value is number => value != null);
  const scoreSum = graded.reduce((sum, grade) => sum + (grade.score ?? 0), 0);
  const hitRate = hits / graded.length;
  return {
    graded: graded.length,
    hits,
    hitRate,
    missRate: 1 - hitRate,
    avgScore: scoreSum / graded.length,
    avgFollowedReturn:
      followed.length > 0 ? followed.reduce((sum, value) => sum + value, 0) / followed.length : null,
    directionalCount: followed.length,
  };
}

export function outcomeField(horizon: HorizonKey): "price30d" | "price90d" | "price1y" {
  if (horizon === "30") return "price30d";
  if (horizon === "90") return "price90d";
  return "price1y";
}

export const MIN_SAMPLE = {
  analyst: 8,
  analystSector: 4,
  bank: 20,
  bankSector: 8,
} as const;

export function minimumSample(entity: "analyst" | "bank", sector?: string | null): number {
  if (entity === "analyst") return sector ? MIN_SAMPLE.analystSector : MIN_SAMPLE.analyst;
  return sector ? MIN_SAMPLE.bankSector : MIN_SAMPLE.bank;
}
