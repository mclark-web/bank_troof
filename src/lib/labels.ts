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

export const DATASET = {
  vintageIso: "2026-09-21",
  vintageLabel: "21 Sep 2026",
  kind: "demo" as const,
};
