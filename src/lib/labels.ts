export const RATING_LABELS: Record<string, string> = {
  strong_buy: "Strong Buy",
  buy: "Buy",
  overweight: "Overweight",
  outperform: "Outperform",
  hold: "Hold",
  neutral: "Neutral",
  equal_weight: "Equal-Weight",
  underperform: "Underperform",
  underweight: "Underweight",
  sell: "Sell",
};

export const ACTION_LABELS: Record<string, string> = {
  initiate: "Initiated",
  upgrade: "Upgraded",
  downgrade: "Downgraded",
  reiterate: "Reiterated",
  target_raise: "Target raised",
  target_cut: "Target cut",
};

export const RATING_NOTCH: Record<string, number> = {
  strong_buy: 5,
  buy: 4,
  overweight: 4,
  outperform: 4,
  hold: 3,
  neutral: 3,
  equal_weight: 3,
  underperform: 2,
  underweight: 2,
  sell: 1,
};

export function ratingLabel(rating: string | null | undefined): string {
  if (!rating) return "—";
  return RATING_LABELS[rating] ?? rating;
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function consensusBucket(rating: string): "buy" | "hold" | "sell" | null {
  const notch = RATING_NOTCH[rating];
  if (notch == null) return null;
  if (notch >= 4) return "buy";
  if (notch <= 2) return "sell";
  return "hold";
}

export function ratingTone(rating: string): "up" | "flat" | "down" {
  const bucket = consensusBucket(rating);
  if (bucket === "buy") return "up";
  if (bucket === "sell") return "down";
  return "flat";
}

const FLAT_DESK = new Set(["hold", "neutral", "equal_weight"]);

export type RecommendationCall = {
  action: string;
  ratingTo: string;
  ratingFrom?: string | null;
};

/** Hold-family desk words are maintained. Everything else is reiterated. */
export function maintainsDesk(rating: string | null | undefined): boolean {
  return Boolean(rating && FLAT_DESK.has(rating));
}

/**
 * Headline for a call. This is the analyst's recommendation, not the Buy/Hold/Sell
 * bucket the grader uses. A target raise stays "Target raise" even when the desk
 * rating is still Sell.
 */
export function recommendationLabel(call: RecommendationCall): string {
  const desk = ratingLabel(call.ratingTo);
  switch (call.action) {
    case "initiate":
      return `Initiate ${desk}`;
    case "upgrade":
      return `Upgrade to ${desk}`;
    case "downgrade":
      return `Downgrade to ${desk}`;
    case "reiterate":
      return maintainsDesk(call.ratingTo) ? `Maintain ${desk}` : `Reiterate ${desk}`;
    case "target_raise":
      return "Target raise";
    case "target_cut":
      return "Target cut";
    default:
      return desk;
  }
}

/** Buy / Hold / Sell collapsed from the desk rating. Scoring input only. */
export function directionForGradingLabel(rating: string | null | undefined): string {
  const bucket = rating ? consensusBucket(rating) : null;
  if (bucket === "buy") return "Buy";
  if (bucket === "hold") return "Hold";
  if (bucket === "sell") return "Sell";
  return "—";
}

/** Color follows the recommendation. A target raise is not painted as a Sell. */
export function recommendationTone(call: RecommendationCall): "up" | "flat" | "down" {
  switch (call.action) {
    case "target_raise":
    case "upgrade":
      return "up";
    case "target_cut":
    case "downgrade":
      return "down";
    default:
      return ratingTone(call.ratingTo);
  }
}

/** Secondary line under the recommendation. Names the desk rating without leading with it. */
export function deskRatingNote(call: RecommendationCall): string {
  const to = ratingLabel(call.ratingTo);
  const from = call.ratingFrom ? ratingLabel(call.ratingFrom) : null;
  const glue = (label: string) => label.replaceAll(" ", "\u00a0");
  const toLabel = glue(to);
  const fromLabel = from ? glue(from) : null;
  if (!fromLabel) return "First desk rating in this ledger";
  if (fromLabel === toLabel) return `Desk rating stays ${toLabel}`;
  return `Desk rating ${fromLabel} → ${toLabel}`;
}

export function callPageTitle(symbol: string, call: RecommendationCall): string {
  return `${symbol} ${recommendationLabel(call)}`;
}

/** German-language dpa-AFX pages on t-online.de are labelled as such. */
export function sourceLinkLabel(url: string): "Source" | "Source (German)" {
  try {
    const host = new URL(url).hostname.replace(/\.$/, "").toLowerCase();
    if (host === "t-online.de" || host.endsWith(".t-online.de")) return "Source (German)";
  } catch {
    return "Source";
  }
  return "Source";
}

/**
 * Live ledger kind. `public` means the calls come from public news sources.
 * `asOf` is the last day in the adjusted-close file.
 */
export const DATASET = {
  asOfIso: "2026-09-21",
  asOfLabel: "21 Sep 2026",
  kind: "public" as const,
};
