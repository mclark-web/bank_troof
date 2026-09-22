/**
 * Repeat calls on the same analyst and ticker.
 *
 * A new call within 90 calendar days of the previous call on that pair is a
 * follow-up. The earlier row stays in the list. This helper only attaches
 * links. It does not drop, merge, or overwrite a call.
 *
 * Grades stay independent: each call is scored from its own rating, target,
 * and later prices. The chain is for display.
 */

export const PRIOR_CALL_WINDOW_DAYS = 90;

const MS_PER_DAY = 86_400_000;

export type ChainIdentity = {
  id: string;
  analystId: string;
  tickerId: string;
  callDate: Date;
};

export type WithCallChain<T extends ChainIdentity> = T & {
  /** Immediately previous call on this analyst+ticker when the gap is ≤ 90 days. */
  priorCall: T | null;
  /** That prior, then earlier calls while each consecutive gap stays ≤ 90 days. */
  priors: T[];
  /** Immediately next call on this analyst+ticker when the gap is ≤ 90 days. */
  nextCall: T | null;
  followUpWithin90Days: boolean;
};

/** Absolute calendar-day gap in UTC. A same-day pair is 0. */
export function calendarDaysApart(a: Date, b: Date): number {
  const day = (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.round(Math.abs(day(a) - day(b)) / MS_PER_DAY);
}

function chainKey(call: ChainIdentity): string {
  return `${call.analystId}\0${call.tickerId}`;
}

function byCallOrder(a: ChainIdentity, b: ChainIdentity): number {
  const delta = a.callDate.getTime() - b.callDate.getTime();
  if (delta !== 0) return delta;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Attach prior/next links for same analystId + same ticker.
 * The previous call links only when |dateDiff| is at most 90 calendar days.
 * Output length matches input length. Ids are assumed unique.
 */
export function attachPriorCalls<T extends ChainIdentity>(calls: readonly T[]): WithCallChain<T>[] {
  const groups = new Map<string, T[]>();
  for (const call of calls) {
    const list = groups.get(chainKey(call)) ?? [];
    list.push(call);
    groups.set(chainKey(call), list);
  }

  const priorById = new Map<string, T | null>();
  const priorsById = new Map<string, T[]>();
  const nextById = new Map<string, T | null>();
  for (const call of calls) {
    priorById.set(call.id, null);
    priorsById.set(call.id, []);
    nextById.set(call.id, null);
  }

  for (const group of groups.values()) {
    const ordered = [...group].sort(byCallOrder);
    for (let index = 0; index < ordered.length; index += 1) {
      const current = ordered[index];
      const previous = index > 0 ? ordered[index - 1] : null;
      const linked =
        previous != null && calendarDaysApart(current.callDate, previous.callDate) <= PRIOR_CALL_WINDOW_DAYS
          ? previous
          : null;
      priorById.set(current.id, linked);
      if (linked) {
        const older = priorsById.get(linked.id) ?? [];
        priorsById.set(current.id, [linked, ...older]);
        nextById.set(linked.id, current);
      }
    }
  }

  return calls.map((call) => {
    const priorCall = priorById.get(call.id) ?? null;
    return {
      ...call,
      priorCall,
      priors: priorsById.get(call.id) ?? [],
      nextCall: nextById.get(call.id) ?? null,
      followUpWithin90Days: priorCall != null,
    };
  });
}
