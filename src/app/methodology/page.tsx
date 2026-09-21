import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { pctUnsigned } from "@/lib/format";
import {
  DIRECTION_WEIGHT,
  FLAT_NEAR_MULTIPLIER,
  HORIZONS,
  HORIZON_KEYS,
  MIN_SAMPLE,
  NEAR_MISS_FACTOR,
  TARGET_WEIGHT,
} from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How BankTruth scores sell-side calls. Direction, price targets, and leaderboard rules in the open.",
};

export default function MethodologyPage() {
  return (
    <article className="max-w-3xl">
      <PageIntro
        kicker="Methodology"
        title="How a call gets a grade"
        lede="The score is arithmetic. A rating implies a direction. The direction is checked against the return over a fixed window. A price target is checked against how far the later price landed from that target."
      />

      <section className="space-y-4 text-sm leading-7 text-muted" id="direction">
        <h2 className="font-serif text-3xl text-ink">Direction</h2>
        <p>
          The rating after the call is what gets graded. Strong Buy, Buy, Overweight, and Outperform are up. Hold, Neutral, and Equal-Weight are flat. Underperform, Underweight, and Sell are down.
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
          Forward return is the price at the horizon divided by the price on the call date, minus one. Windows are calendar days: 30, 90, and 365. If the sample has no price for that date, the call is ungraded and drops out of every average.
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
        <h2 className="font-serif text-3xl text-ink">Call score</h2>
        <p>
          Direction is worth {DIRECTION_WEIGHT} points: all {DIRECTION_WEIGHT} on a hit, {DIRECTION_WEIGHT * NEAR_MISS_FACTOR} on a near-miss, and zero on a miss. The target adds up to {TARGET_WEIGHT}. The call score is the sum, from 0 to 100.
        </p>
        <p>
          “If followed” is a separate column. Buys contribute the forward return. Sells contribute the inverse, the return from acting on the negative call. Holds are excluded, because a hold is not an instruction to be long or short.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-7 text-muted" id="aggregation">
        <h2 className="font-serif text-3xl text-ink">Leaderboards</h2>
        <p>
          An analyst score is the average call score at the selected horizon. A bank score is the average of the bank’s calls, not the average of its analysts. One analyst with forty calls outweighs one analyst with eight. That is deliberate: the firm published the calls.
        </p>
        <p>
          Boards hide thin samples. Analysts need {MIN_SAMPLE.analyst} graded calls, or {MIN_SAMPLE.analystSector} inside a sector filter. Banks need {MIN_SAMPLE.bank}, or {MIN_SAMPLE.bankSector} inside a sector. Worst offenders use the same floors and sort by miss rate.
        </p>
        <p>
          Sector filters keep calls whose ticker is in that sector. An analyst who only covers technology is unchanged. A generalist would be scored only on the names in the filter.
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
          The shipping dataset is a demo. Analysts are invented. Firm names are familiar labels so the product can be searched; the hit rates attached to them are simulated. Prices come from a seeded random path, and each fictional analyst is given a skill level so the leaderboard has a spread. None of it is a track record, a forecast, or a description of anyone’s research.
        </p>
        <p>
          BankTruth is not affiliated with any bank, broker-dealer, or third-party ratings site. It does not scrape those sites and it does not present their data as its own.
        </p>
        <p>
          Replacing the seed is a data problem, not a scoring problem. The grader reads a rating, a price at the call, an optional target, and prices 30, 90, and 365 calendar days later. A licensed price feed plus a call archive in the CSV shape documented in the README is enough. Until that feed is connected, every screen carries a demo banner.
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
