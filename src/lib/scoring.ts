import { GC_PROVISIONAL_LINE, GC_STRONG_LINE } from "./gc-grade";

export const HORIZON_KEYS = ["14", "30", "60", "90", "365"] as const;

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

/** At or above this 0–100 score the tube is STRONG and the GC badge is 8–10. */
export const CHUD_LINE = GC_STRONG_LINE;

/** From this score up to CHUD_LINE the tube is PROVISIONAL and the GC badge is 5–7. Under it, WEAK and GC 1–4. */
export const GC_WEAK_LINE = GC_PROVISIONAL_LINE;

export type ChadSide = "chud" | "mid" | "chad";

export type GcBandGrade = "WEAK" | "PROVISIONAL" | "STRONG";

/**
 * Absolute GC Scale steps. `max` is exclusive, except the last band, which includes 100.
 * Ten points is one step. Under 40 is GC 1–4. From 40 up to 70 is GC 5–7. At or above 70 is GC 8–10.
 */
export const GC_BANDS = [
  { min: 0, max: 10, gc: 1, grade: "WEAK" },
  { min: 10, max: 20, gc: 2, grade: "WEAK" },
  { min: 20, max: 30, gc: 3, grade: "WEAK" },
  { min: 30, max: 40, gc: 4, grade: "WEAK" },
  { min: 40, max: 50, gc: 5, grade: "PROVISIONAL" },
  { min: 50, max: 60, gc: 6, grade: "PROVISIONAL" },
  { min: 60, max: 70, gc: 7, grade: "PROVISIONAL" },
  { min: 70, max: 80, gc: 8, grade: "STRONG" },
  { min: 80, max: 90, gc: 9, grade: "STRONG" },
  { min: 90, max: 101, gc: 10, grade: "STRONG" },
] as const satisfies readonly { min: number; max: number; gc: number; grade: GcBandGrade }[];

export type ChadPlacement = {
  chad: number | null;
  side: ChadSide | null;
  label: string | null;
};

function clampScore(raw: number | null | undefined): number | null {
  if (raw == null || Number.isNaN(raw)) return null;
  return Math.min(100, Math.max(0, raw));
}

function bandFor(score: number): (typeof GC_BANDS)[number] {
  const band = GC_BANDS.find((row) => score >= row.min && score < row.max);
  return band ?? GC_BANDS[GC_BANDS.length - 1];
}

/**
 * 1–10 GC Scale placement for one 0–100 score.
 * Under 40 is GC 1–4 (WEAK). From 40 up to 70 is GC 5–7 (PROVISIONAL).
 * At or above 70 is GC 8–10 (STRONG). Peer rank is not an input.
 */
export function placeChad(score: number | null | undefined): ChadPlacement {
  const clamped = clampScore(score);
  if (clamped == null) return { chad: null, side: null, label: null };
  const band = bandFor(clamped);
  if (band.grade === "STRONG") {
    return { chad: band.gc, side: "chad", label: "GC 8–10. At or above 70 is STRONG on the GC Scale." };
  }
  if (band.grade === "PROVISIONAL") {
    return { chad: band.gc, side: "mid", label: "GC 5–7. From 40 up to 70 is PROVISIONAL on the GC Scale." };
  }
  return { chad: band.gc, side: "chud", label: "GC 1–4. Under 40 is WEAK on the GC Scale." };
}

/** Full engine score, shown beside the GC score. One decimal when it is not a whole number. */
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
  "14": {
    days: 14,
    label: "2 weeks",
    short: "2W",
    threshold: 0.01,
    ptFull: 0.02,
    ptZero: 0.08,
  },
  "30": {
    days: 30,
    label: "30 days",
    short: "30D",
    threshold: 0.02,
    ptFull: 0.04,
    ptZero: 0.12,
  },
  "60": {
    days: 60,
    label: "60 days",
    short: "60D",
    threshold: 0.04,
    ptFull: 0.06,
    ptZero: 0.16,
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
  if (value && (HORIZON_KEYS as readonly string[]).includes(value)) return value as HorizonKey;
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

export function outcomeField(horizon: HorizonKey): "price14d" | "price30d" | "price60d" | "price90d" | "price1y" {
  if (horizon === "14") return "price14d";
  if (horizon === "30") return "price30d";
  if (horizon === "60") return "price60d";
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
