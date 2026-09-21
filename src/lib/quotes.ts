import history from "./adjusted-closes.json";

/**
 * Price at the call and each forward window are this print.
 * Adjusted closes are split-adjusted. Nothing in the seed invents a session.
 */
export const PRICE_SOURCE = "Yahoo Finance adjusted close, split-adjusted, rounded to the cent.";

/** A closed market may use the prior session only this many calendar days back. */
export const MAX_CLOSED_GAP_DAYS = 4;

/** Fictional targets stay inside this multiple of the real price at the call. */
export const TARGET_VS_SPOT = { min: 0.55, max: 1.55 };

type HistoryFile = {
  source: string;
  print: string;
  asOf: string;
  closes: Record<string, Record<string, number>>;
};

const file = history as HistoryFile;

export const QUOTE_AS_OF = file.asOf;

function seriesFor(symbol: string): Record<string, number> {
  const series = file.closes[symbol];
  if (!series) {
    throw new Error(`No adjusted-close history for ${symbol}. Refusing to invent a price.`);
  }
  return series;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/**
 * Split-adjusted close for a calendar date.
 * On a day with no session, returns the prior session when it is within
 * MAX_CLOSED_GAP_DAYS. A wider hole throws.
 */
export function adjustedClose(symbol: string, date: Date): number {
  const series = seriesFor(symbol);
  const iso = isoDate(date);
  if (iso > QUOTE_AS_OF) {
    throw new Error(`No adjusted close for ${symbol} on ${iso}. History ends ${QUOTE_AS_OF}. Refusing to invent a price.`);
  }
  const exact = series[iso];
  if (exact != null) return exact;
  for (let gap = 1; gap <= MAX_CLOSED_GAP_DAYS; gap += 1) {
    const prior = series[isoDate(addUtcDays(date, -gap))];
    if (prior != null) return prior;
  }
  throw new Error(
    `No adjusted close for ${symbol} on ${iso} within ${MAX_CLOSED_GAP_DAYS} calendar days. Refusing to invent a price.`,
  );
}

/** Adjusted close `days` calendar days after the call. Null only when that date is past the history. */
export function forwardClose(symbol: string, callDate: Date, days: number): number | null {
  const target = addUtcDays(callDate, days);
  if (isoDate(target) > QUOTE_AS_OF) return null;
  return adjustedClose(symbol, target);
}

export function pricesForCall(symbol: string, callDate: Date) {
  return {
    priceAtCall: adjustedClose(symbol, callDate),
    price30d: forwardClose(symbol, callDate, 30),
    price90d: forwardClose(symbol, callDate, 90),
    price1y: forwardClose(symbol, callDate, 365),
  };
}

export function clampTargetToSpot(target: number, spot: number): number {
  if (!(spot > 0) || !Number.isFinite(target)) {
    throw new Error(`Cannot place a target against spot ${spot}.`);
  }
  return Math.min(spot * TARGET_VS_SPOT.max, Math.max(spot * TARGET_VS_SPOT.min, target));
}

export function bindHistoricalPrices(input: {
  ticker: string;
  date: string;
  priceAtCall: number;
  price30d: number | null;
  price90d: number | null;
  price1y: number | null;
}): { priceAtCall: number; price30d: number | null; price90d: number | null; price1y: number | null } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new Error(`Bad call date ${input.date}.`);
  }
  const callDate = new Date(`${input.date}T00:00:00.000Z`);
  const actual = adjustedClose(input.ticker, callDate);
  if (Math.abs(input.priceAtCall - actual) > 0.02) {
    throw new Error(
      `${input.ticker} ${input.date} price_at_call ${input.priceAtCall} does not match the adjusted close ${actual}. Refusing to import an invented price.`,
    );
  }
  const take = (label: string, supplied: number | null, days: number) => {
    const quote = forwardClose(input.ticker, callDate, days);
    if (supplied == null) return quote;
    if (quote == null) {
      throw new Error(
        `${input.ticker} ${input.date} ${label} is set, but that window is past the price history. Refusing to keep an invented price.`,
      );
    }
    if (Math.abs(supplied - quote) > 0.02) {
      throw new Error(
        `${input.ticker} ${input.date} ${label} ${supplied} does not match the adjusted close ${quote}. Refusing to import an invented price.`,
      );
    }
    return quote;
  };
  return {
    priceAtCall: actual,
    price30d: take("price_30d", input.price30d, 30),
    price90d: take("price_90d", input.price90d, 90),
    price1y: take("price_1y", input.price1y, 365),
  };
}
