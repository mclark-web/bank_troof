/**
 * Names whose demo path is stored on the post-split scale for every date,
 * including sessions before the split. The seed already generates that
 * scale, so nothing here divides a price again.
 */
export const SPLIT_ADJUSTED: Record<string, { split: string }> = {
  WMT: { split: "3-for-1 on 26 Feb 2024" },
  NVDA: { split: "10-for-1 on 10 Jun 2024" },
  AVGO: { split: "10-for-1 on 15 Jul 2024" },
  NFLX: { split: "10-for-1 on 17 Nov 2025" },
};
