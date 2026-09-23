/**
 * Same-analyst, same-ticker supersession.
 *
 * Only the latest call in an unbroken run of calls spaced
 * SUPERSESSION_WINDOW_DAYS calendar days apart or closer counts for scoring.
 * A longer gap starts a new run, and every call in that new run is judged on its own.
 * UI and score rollups both read this module.
 */

export const SUPERSESSION_WINDOW_DAYS = 90;

const DAY_MS = 86_400_000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export type SupersessionInput = {
  id: string;
  analystId: string;
  ticker: string;
  callDate: Date | string | null | undefined;
};

export type SupersessionStatus = "active" | "nullified";

export type SupersessionMark = {
  status: SupersessionStatus;
  /** False when this call is nullified and must not enter the GC score or report-card averages. */
  countsForScoring: boolean;
  nullifiedNote: string | null;
  supersedesNote: string | null;
  supersededById: string | null;
  supersedesId: string | null;
  /** Calendar days back to the call this one supersedes. */
  gapFromPriorDays: number | null;
  /** Calendar days forward to the call that nullified this one. */
  gapUntilNextDays: number | null;
};

export type SameDayAmbiguity = {
  analystId: string;
  ticker: string;
  date: string;
  /** Chronological order. The last id stays active unless a later day continues the streak. */
  callIds: string[];
};

export type MissingDateAmbiguity = {
  callId: string;
  analystId: string;
  ticker: string;
};

export type TickerAlias = {
  raw: string;
  normalized: string;
  calls: number;
};

export type SupersessionScan = {
  calls: number;
  /** Consecutive same-analyst, same-ticker pairs whose calendar gap is within the window. */
  inWindowPairs: number;
  /** Analyst+ticker groups that contain at least one in-window pair. */
  analystTickerGroupsWithInWindowPair: number;
  /** Consecutive pairs on the same analyst and ticker whose gap is longer than the window. */
  outsideWindowPairs: number;
  callsNullified: number;
  callsActive: number;
  sameDay: SameDayAmbiguity[];
  missingDates: MissingDateAmbiguity[];
  /** Punctuation variants that collapsed to one ticker, such as BRK.B and BRK-B. */
  tickerAliases: TickerAlias[];
  duplicateIds: string[];
};

export type SupersessionInspection = {
  marks: Map<string, SupersessionMark>;
  scan: SupersessionScan;
};

const ACTIVE_MARK: SupersessionMark = {
  status: "active",
  countsForScoring: true,
  nullifiedNote: null,
  supersedesNote: null,
  supersededById: null,
  supersedesId: null,
  gapFromPriorDays: null,
  gapUntilNextDays: null,
};

function activeMark(): SupersessionMark {
  return { ...ACTIVE_MARK };
}

/** BRK.B, BRK/B, and BRK-B are one ticker. Letter case is ignored. */
export function normalizeTicker(symbol: string): string {
  return symbol.trim().toUpperCase().replace(/[./\s]+/g, "-").replace(/-+/g, "-");
}

export function parseCallDate(value: Date | string | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Whole calendar days from earlier to later, in UTC. Same calendar day is 0. */
export function calendarDaysBetween(earlier: Date, later: Date): number {
  const start = Date.UTC(earlier.getUTCFullYear(), earlier.getUTCMonth(), earlier.getUTCDate());
  const end = Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), later.getUTCDate());
  return Math.round((end - start) / DAY_MS);
}

export function supersessionDateLabel(date: Date): string {
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function nullifiedByLaterNote(later: Date): string {
  return `Nullified — superseded by later call on ${supersessionDateLabel(later)} (within ${SUPERSESSION_WINDOW_DAYS} days).`;
}

export function supersedesPriorNote(prior: Date): string {
  return `Supersedes prior call on ${supersessionDateLabel(prior)} (within ${SUPERSESSION_WINDOW_DAYS} days).`;
}

export function utcDayKey(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

function compareIds(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Earlier calendar day first. Same instant breaks the tie by id, low to high, so the higher id is the later call. */
export function compareCallChronology(a: { callDate: Date; id: string }, b: { callDate: Date; id: string }): number {
  const byTime = a.callDate.getTime() - b.callDate.getTime();
  if (byTime !== 0) return byTime;
  return compareIds(a.id, b.id);
}

type DatedRow = {
  id: string;
  analystId: string;
  tickerRaw: string;
  ticker: string;
  callDate: Date;
};

export function inspectSupersession(calls: SupersessionInput[]): SupersessionInspection {
  const marks = new Map<string, SupersessionMark>();
  const sameDay: SameDayAmbiguity[] = [];
  const missingDates: MissingDateAmbiguity[] = [];
  const aliasCounts = new Map<string, TickerAlias>();
  const duplicateIds: string[] = [];
  const groups = new Map<string, DatedRow[]>();
  const seen = new Set<string>();

  for (const call of calls) {
    if (seen.has(call.id)) {
      duplicateIds.push(call.id);
      continue;
    }
    seen.add(call.id);
    marks.set(call.id, activeMark());

    const analystId = call.analystId.trim();
    const tickerRaw = call.ticker.trim();
    const ticker = normalizeTicker(call.ticker);
    const callDate = parseCallDate(call.callDate);

    if (tickerRaw.toUpperCase() !== ticker) {
      const key = `${tickerRaw.toUpperCase()}\0${ticker}`;
      const existing = aliasCounts.get(key);
      if (existing) existing.calls += 1;
      else aliasCounts.set(key, { raw: tickerRaw.toUpperCase(), normalized: ticker, calls: 1 });
    }

    if (!callDate) {
      missingDates.push({ callId: call.id, analystId, ticker: ticker || tickerRaw });
      continue;
    }
    if (!analystId || !ticker) continue;

    const row: DatedRow = { id: call.id, analystId, tickerRaw, ticker, callDate };
    const groupKey = `${analystId}\0${ticker}`;
    const list = groups.get(groupKey) ?? [];
    list.push(row);
    groups.set(groupKey, list);
  }

  let inWindowPairs = 0;
  let outsideWindowPairs = 0;
  let analystTickerGroupsWithInWindowPair = 0;

  for (const group of groups.values()) {
    group.sort(compareCallChronology);
    const byDay = new Map<string, string[]>();
    for (const row of group) {
      const day = utcDayKey(row.callDate);
      const ids = byDay.get(day) ?? [];
      ids.push(row.id);
      byDay.set(day, ids);
    }
    for (const [date, callIds] of byDay) {
      if (callIds.length > 1) {
        sameDay.push({
          analystId: group[0].analystId,
          ticker: group[0].ticker,
          date,
          callIds,
        });
      }
    }

    let groupInWindow = 0;
    for (let index = 1; index < group.length; index += 1) {
      const prior = group[index - 1];
      const next = group[index];
      const gap = calendarDaysBetween(prior.callDate, next.callDate);
      if (gap > SUPERSESSION_WINDOW_DAYS) {
        outsideWindowPairs += 1;
        continue;
      }
      groupInWindow += 1;
      inWindowPairs += 1;
      const priorMark = marks.get(prior.id) ?? activeMark();
      const nextMark = marks.get(next.id) ?? activeMark();
      marks.set(prior.id, {
        ...priorMark,
        status: "nullified",
        countsForScoring: false,
        nullifiedNote: nullifiedByLaterNote(next.callDate),
        supersededById: next.id,
        gapUntilNextDays: gap,
      });
      marks.set(next.id, {
        ...nextMark,
        supersedesNote: supersedesPriorNote(prior.callDate),
        supersedesId: prior.id,
        gapFromPriorDays: gap,
      });
    }
    if (groupInWindow > 0) analystTickerGroupsWithInWindowPair += 1;
  }

  let callsNullified = 0;
  for (const mark of marks.values()) {
    if (mark.status === "nullified") callsNullified += 1;
  }

  return {
    marks,
    scan: {
      calls: calls.length,
      inWindowPairs,
      analystTickerGroupsWithInWindowPair,
      outsideWindowPairs,
      callsNullified,
      callsActive: marks.size - callsNullified,
      sameDay,
      missingDates,
      tickerAliases: [...aliasCounts.values()].sort((a, b) => a.raw.localeCompare(b.raw)),
      duplicateIds,
    },
  };
}

export function annotateSupersession(calls: SupersessionInput[]): Map<string, SupersessionMark> {
  return inspectSupersession(calls).marks;
}

export function scanSupersession(calls: SupersessionInput[]): SupersessionScan {
  return inspectSupersession(calls).scan;
}
