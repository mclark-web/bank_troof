/**
 * Demo prices are stored split-adjusted for the whole path.
 * Dividing every dollar on a call by the same factor leaves returns,
 * target error, hit/miss, and Chad scores unchanged.
 *
 * Names left alone on purpose:
 * - AVGO split 10-for-1 on 15 Jul 2024, but the sample path was generated
 *   around $300–$700, not the pre-split $1,200–$1,800 quote. Dividing it
 *   would invent a price that is too low.
 * - GOOGL and AMZN already start on their post-2022 split scales.
 */
export const SPLIT_ADJUSTED: Record<string, { factor: number; split: string }> = {
  NVDA: { factor: 10, split: "10-for-1 on 10 Jun 2024" },
  NFLX: { factor: 10, split: "10-for-1 on 17 Nov 2025" },
  WMT: { factor: 3, split: "3-for-1 on 26 Feb 2024" },
};

export function splitAdjust(symbol: string, value: number): number;
export function splitAdjust(symbol: string, value: number | null): number | null;
export function splitAdjust(symbol: string, value: number | null): number | null {
  if (value == null) return null;
  const factor = SPLIT_ADJUSTED[symbol]?.factor ?? 1;
  if (factor === 1) return value;
  return value / factor;
}
