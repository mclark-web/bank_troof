import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { pctUnsigned } from "@/lib/format";
import { SPLIT_ADJUSTED } from "@/lib/splits";
import {
  CHAD_MAX,
  CHAD_MIN,
  GC_BANDS,
  GC_WEAK_LINE,
  DIRECTION_WEIGHT,
  FLAT_NEAR_MULTIPLIER,
  HORIZONS,
  HORIZON_KEYS,
  MIN_SAMPLE,
  NEAR_MISS_FACTOR,
  TARGET_WEIGHT,
} from "@/lib/scoring";
import { GC_PROVISIONAL_LINE, GC_STRONG_LINE } from "@/lib/gc-grade";
import { OVERALL_FACTOR_FORMULA } from "@/lib/overall-factor";
import { SUPERSESSION_WINDOW_DAYS } from "@/lib/supersession";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How GradedCalls Analysts scores sell-side calls. Direction, price targets, and leaderboard rules in the open.",
};

export default function MethodologyPage() {
  return (
    <article className="max-w-3xl">
      <PageIntro
        kicker="Methodology"
        title="How a call gets a grade"
        lede="The score is arithmetic. The headline on a call is the recommendation. The grade uses a direction bucket taken from the desk rating, then checks that bucket against the return over a fixed window. A price target is checked against how far the later price landed from that target."
      />

      <section className="space-y-4 text-sm leading-7 text-muted" id="recommendation">
        <h2 className="font-serif text-3xl text-ink">Recommendation and direction</h2>
        <p>
          The label on a call, in a book, and on the home tape is the recommendation: what the analyst did. Initiate Buy. Upgrade to Overweight. Downgrade to Neutral. Reiterate Outperform. Maintain Hold, Maintain Neutral, or Maintain Equal-Weight when the desk word is in the hold family and the rating did not change. Target raise. Target cut.
        </p>
        <p>
          A target raise or a target cut is that action. It is not rewritten as Buy or Sell. The desk rating — the house word on the note — sits under the recommendation. When the action is only a target change, that word does not become the headline. Owen Briggs raising the CAT target while the desk stays at Sell is labeled <strong className="font-medium text-ink">Target raise</strong>. Sell is not the title of that page.
        </p>
        <p>
          Direction for grading is a coarser bucket, used only by the score. Strong Buy, Buy, Overweight, and Outperform are Buy. Hold, Neutral, and Equal-Weight are Hold. Underperform, Underweight, and Sell are Sell. Screens that still show Buy, Hold, or Sell mark that column “direction for grading.” The same call can be headlined Target raise and graded as Sell, because the desk did not change the rating. The grade asks whether the shares moved the way that bucket required. The target is scored on its own.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-7 text-muted" id="direction">
        <h2 className="font-serif text-3xl text-ink">Direction</h2>
        <p>
          The direction bucket after the call is what gets graded, not the recommendation verb. Strong Buy, Buy, Overweight, and Outperform are up. Hold, Neutral, and Equal-Weight are flat. Underperform, Underweight, and Sell are down.
        </p>
        <p>Each horizon has one threshold, T. The bands do not overlap except on the exact boundary, where both the directional call and a hold receive a hit.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Up hits when the forward return is at least T.</li>
          <li>Down hits when the forward return is at most −T.</li>
          <li>Flat hits when the absolute return is at most T.</li>
        </ul>
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Horizon</th>
                <th>Threshold T</th>
                <th>Target full credit</th>
                <th>Target zero</th>
              </tr>
            </thead>
            <tbody>
              {HORIZON_KEYS.map((key) => {
                const spec = HORIZONS[key];
                return (
                  <tr key={key}>
                    <td>{spec.label}</td>
                    <td className="num">{pctUnsigned(spec.threshold, 0)}</td>
                    <td className="num">within {pctUnsigned(spec.ptFull, 0)}</td>
                    <td className="num">beyond {pctUnsigned(spec.ptZero, 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p>
          Forward return is the price at the horizon divided by the price on the call date, minus one. Windows are calendar days: 14 (2 weeks), 30, 60, 90, and 365. Prices are Yahoo Finance adjusted closes (adjusted for splits and dividends); a few recent calls use the raw close on the call date. A window that runs past the history is ungraded. A date with no quote is an error, not a blank.
        </p>
        <p>
          A near-miss is not a hit. For up calls it is a return from half of T up to, but not including, T. Down calls mirror that. Flat calls are a near-miss when the absolute return is outside T but inside {FLAT_NEAR_MULTIPLIER}×T. Hit rate uses full hits only. Miss rate is one minus the hit rate, so near-misses count as misses.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-7 text-muted" id="target">
        <h2 className="font-serif text-3xl text-ink">Price target</h2>
        <p>
          Target error is the absolute gap between the price at the horizon and the target, divided by the price at the call. Dividing by the starting price keeps a $2 miss on a $20 stock comparable to a $20 miss on a $200 stock.
        </p>
        <p>
          Inside the full-credit band the target earns {TARGET_WEIGHT} points. At or beyond the zero band it earns none. Between those bands the points fall in a straight line. A call with no target is scored on direction only, scaled so a clean hit is 100.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-7 text-muted" id="score">
        <h2 className="font-serif text-3xl text-ink">GC score</h2>
        <p>
          A report card shows two grades. The integer is the GC (Grade Calibration) score, from {CHAD_MIN} to {CHAD_MAX}. <strong className="font-medium text-ink">GC {CHAD_MIN} is a poor track record</strong>. <strong className="font-medium text-ink">GC {CHAD_MAX} is an excellent one</strong>. Beside it, every card shows the full score out of 100. Hit rate, return if followed, and sample size stay underneath. They do not set the rank.
        </p>
        <p>
          The engine scores a call from 0 to 100. Direction is worth {DIRECTION_WEIGHT}: all {DIRECTION_WEIGHT} on a hit, {DIRECTION_WEIGHT * NEAR_MISS_FACTOR} on a near-miss, and zero on a miss. The target adds up to {TARGET_WEIGHT}. That 0–100 score is always visible. The GC score is the same number placed on the GC Scale. It is not a second formula, and it does not look at anyone else’s score.
        </p>
        <p>
          <strong className="font-medium text-ink">The cut is {GC_STRONG_LINE} and {GC_PROVISIONAL_LINE}.</strong> At or above {GC_STRONG_LINE} the tube reads STRONG and the GC score is 8–{CHAD_MAX}. From {GC_WEAK_LINE} up to {GC_STRONG_LINE} the tube reads PROVISIONAL and the GC score is 5–7. A graded score above 0 and under {GC_WEAK_LINE} reads WEAK and the GC score is 1–4. A graded score of exactly 0 is an empty glass labeled EXIT LIQUIDITY, and the badge is a dash, not GC 1. Each ten points above 0 is one step. The top of a step is not included, except 100, which is GC {CHAD_MAX}:
        </p>
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Score /100</th>
                <th>GC</th>
                <th>Tube</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="num">0</td>
                <td className="num">—</td>
                <td>EXIT LIQUIDITY</td>
              </tr>
              {GC_BANDS.map((band) => (
                <tr key={band.gc}>
                  <td className="num">
                    {band.min === 0 ? `above 0 up to ${band.max}` : band.max > 100 ? `${band.min}–100` : `${band.min} up to ${band.max}`}
                  </td>
                  <td className="num">{band.gc}</td>
                  <td>{band.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          A graded 0 is a dash. A 0.1 is GC 1. A 39.9 is GC 4. A 40 is GC 5. A 69.9 is GC 7. A 70 is GC 8. Values outside 0–100 are clamped first, so a negative score is the same empty glass as 0. The same lines apply to one call, an analyst, a bank, and a ticker. Who else is on the board does not move the badge or the tube.
        </p>
        <p>
          Order is separate. A board can sort names by the overall factor, or by the GC score. Names that share a GC score keep the higher overall factor ahead. That sort is the only use of rank.
        </p>
        <p>
          “If followed” is a separate column. Buys contribute the forward return. Sells contribute the inverse, the return from acting on the negative call. Holds are excluded, because a hold is not an instruction to be long or short.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-7 text-muted" id="overall-factor">
        <h2 className="font-serif text-3xl text-ink">Overall factor</h2>
        <p>{OVERALL_FACTOR_FORMULA}</p>
        <p>
          That average is the same report-card rollup the leaderboards use. It is not a second formula and it is not a blend of horizons. Pick 2W, 30D, 60D, 90D, or 1Y, and the factor is the mean grade of the active calls at that window. An open window is not graded yet, so it waits. The GC score on the same card is this factor placed on the GC Scale with the {GC_STRONG_LINE} and {GC_PROVISIONAL_LINE} lines above. It is not a separate average.
        </p>
        <p>
          The card also shows how many active calls are graded, how many calls are superseded, and the hit rate on the active book only. Superseded calls stay in their own list, with the nullified and supersedes notes still attached.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-7 text-muted" id="gc-scale">
        <h2 className="font-serif text-3xl text-ink">GC Scale</h2>
        <p>
          The horizontal tube is the same 0–100 grade, drawn as a fill. It does not rescore the call. STRONG is a grade at or above {GC_STRONG_LINE}, and that is GC 8–10. PROVISIONAL is a grade from {GC_PROVISIONAL_LINE} up to that line, and that is GC 5–7. WEAK is a graded score above 0 and under {GC_PROVISIONAL_LINE}, and that is GC 1–4. Those words sit on the tube. The GC score is the 1–10 GC Scale placement of the same number, and it stays on the directory and the leaderboards.
        </p>
        <p>
          EXIT LIQUIDITY is an empty glass at 0%, and only for a graded score of exactly 0. The badge on that glass is a dash, not GC 1. An open horizon has no print yet, so it stays ungraded and is not drawn as that glass. A score above 0 that still earned almost nothing stays WEAK, with a hair of liquid, so a finished miss and an empty glass do not look like the same thing.
        </p>
        <p>
          On the analysts board, “all horizons” fills the tube with the mean of the windows that already have a print. Picking 2W, 30D, 60D, 90D, or 1Y uses that window only. The board tube averages active calls. A superseded call can still show its own tube. It does not move the board average, the hit rate, or the GC score.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-7 text-muted" id="aggregation">
        <h2 className="font-serif text-3xl text-ink">Leaderboards</h2>
        <p>
          An analyst’s overall factor is the average of that person’s active graded calls at the selected horizon, on the 0–100 scale. The GC score is that same factor on the GC Scale, using the {GC_STRONG_LINE} and {GC_PROVISIONAL_LINE} lines. A bank uses the average of the bank’s active calls, not the average of its analysts. Boards then order those names. One analyst with forty active calls outweighs one analyst with eight. That is deliberate: the firm published the calls.
        </p>
        <p>
          Boards hide thin samples. Analysts need {MIN_SAMPLE.analyst} active graded calls, or {MIN_SAMPLE.analystSector} inside a sector filter. Banks need {MIN_SAMPLE.bank}, or {MIN_SAMPLE.bankSector} inside a sector. Both the GC score and the overall factor are columns. The default order is the overall factor. Sorting by the GC score is on the page; names that share a GC score keep the higher overall factor ahead. Worst offenders reverse whichever key is selected. Under {GC_WEAK_LINE} the GC score is 1–4. From {GC_WEAK_LINE} up to {GC_STRONG_LINE} it is 5–7. At or above {GC_STRONG_LINE} it is 8–10.
        </p>
        <p>
          Sector filters keep calls whose ticker is in that sector. An analyst who only covers technology is unchanged. A generalist would be scored only on the names in the filter.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-7 text-muted" id="supersession">
        <h2 className="font-serif text-3xl text-ink">Same ticker within {SUPERSESSION_WINDOW_DAYS} days</h2>
        <p>
          When the same analyst publishes another call on the same ticker, and the new call’s date is within {SUPERSESSION_WINDOW_DAYS} calendar days of the previous call on that pair, the older call is nullified for scoring. It does not enter the overall factor, the GC score, the hit rate, or the sample size. The newer call is the one that counts. Profiles and call lists keep the active book and the superseded history in separate sections.
        </p>
        <p>
          A run of calls stays one streak while each step is {SUPERSESSION_WINDOW_DAYS} days or closer. Only the latest call in that streak is active. Every earlier call is nullified, and each one points at the call that replaced it. A gap longer than {SUPERSESSION_WINDOW_DAYS} days starts a new streak. Both sides of that gap stay active, and neither gets a nullify note.
        </p>
        <p>
          The older row reads “Nullified — superseded by later call on [date] (within {SUPERSESSION_WINDOW_DAYS} days).” The newer row reads “Supersedes prior call on [date] (within {SUPERSESSION_WINDOW_DAYS} days).” A call in the middle of a streak carries both sentences. The date, recommendation, desk rating, target, entry price, and 2W / 30D / 60D / 90D / 1Y outcomes stay on the page. The horizon math does not change. Prices are Yahoo Finance adjusted closes (adjusted for splits and dividends); a few recent calls use the raw close on the call date.
        </p>
        <p>
          Tickers match after dots and slashes are folded to hyphens, so BRK.B and BRK-B are one name. Two calls on the same calendar day are inside the window. The later timestamp wins, and if the timestamps match, the higher call id is treated as later. That same-day order is reported as ambiguous because the calendar date alone does not say which note came first. A call with no date is left active and is not chained.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-7 text-muted" id="controversial">
        <h2 className="font-serif text-3xl text-ink">Controversial flags</h2>
        <p>
          A call is flagged when the rating moves by two notches or more (Sell to Buy, Hold to Strong Buy, and the reverse) or when the price target changes by 25% or more versus that analyst’s prior target on the same name. The flag is a label, not a penalty. The grade still comes from the later price.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-7 text-muted" id="demo">
        <h2 className="font-serif text-3xl text-ink">What this vintage is</h2>
        <p>
          Grades use real historical prices. Prices are Yahoo Finance adjusted closes (adjusted for splits and dividends); a few recent calls use the raw close on the call date. If that calendar date is not a session, the price is the prior session’s adjusted close, and only when that session is within four calendar days. A missing quote stops the seed and the import. There is no simulated price path. The sample runs through 21 Sep 2026, with more upgrades, downgrades, and target changes from July onward. A window that has not elapsed is left blank.
        </p>
        <p>
          Analysts, notes, ratings, and price targets are a demo sample. Targets are fictional, and each one is kept in a band around the real price at the call. Firm names are labels for that sample. Each fictional analyst is given a skill level so the leaderboard has a spread. None of it is a track record, a forecast, or a description of anyone’s research.
        </p>
        <p>
          The names with a split in this window —{" "}
          {Object.entries(SPLIT_ADJUSTED)
            .map(([symbol, info]) => `${symbol} (${info.split})`)
            .join(", ")}
          {" "}— use that Yahoo Finance adjusted close, already on the post-split scale and adjusted for dividends, for every date, including sessions before the split, so a window that crosses the split does not print a fake crash.
        </p>
        <p>
          GradedCalls Analysts is not affiliated with any bank, broker-dealer, or third-party ratings site. It does not scrape rankings sites. Prices are adjusted closes, not a firm’s published targets.
        </p>
        <p>
          The grader reads a rating, a price at the call, an optional target, and prices 14, 30, 60, 90, and 365 calendar days later. This vintage already fills those prices from adjusted closes. Replacing the sample analysts is a call archive in the CSV shape documented in the README. Every screen still carries a demo banner, because the people and the notes are not a live track record.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-7 text-muted" id="limits">
        <h2 className="font-serif text-3xl text-ink">What the score is not</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Not investment advice. Past accuracy does not predict future results.</li>
          <li>Not adjusted for the market, the sector, or beta. A buy in a roaring tape can “hit” without any insight. A later version can add a benchmark; this one does not hide that choice.</li>
          <li>Not a judgment of report quality, management access, or timing inside the window. The only input is the rating, the target, and the later print.</li>
          <li>Not comparable to a live ranking product. The people are not real analysts and the numbers are not their numbers.</li>
        </ul>
        <p>
          The worked numbers on each <Link href="/leaderboards" className="text-brass hover:text-ink">call page</Link> use this same module. If the page and this write-up ever disagree, the code in the scoring module is the source of truth — and this page reads its thresholds directly from that module.
        </p>
      </section>
    </article>
  );
}
