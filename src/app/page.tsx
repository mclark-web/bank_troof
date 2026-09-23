import Link from "next/link";
import { GradePill, MiniLeaderboard, RecommendationPill, SupersessionNotes } from "@/components/ui";
import { callHeadline, formatDate, pct } from "@/lib/format";
import { recommendationLabel } from "@/lib/labels";
import { getHome, longestClosed } from "@/lib/queries";
import { HORIZONS } from "@/lib/scoring";

export default async function HomePage() {
  const home = await getHome();
  const toRow = (row: (typeof home.analysts)[number]) => ({
    name: row.name,
    href: row.href,
    subtitle: row.subtitle,
    score: row.aggregate.avgScore,
    placement: row.placement,
    hitRate: row.aggregate.hitRate,
  });

  return (
    <div>
      <section className="grid items-end gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="kicker">GradedCalls Analysts</p>
          <h1 className="mt-3 max-w-3xl font-sans text-5xl leading-[1.05] tracking-tight md:text-6xl">
            Banks make the calls.
            <span className="mt-1 block text-brass" style={{ textShadow: "0 0 40px rgba(235, 101, 5, 0.48)" }}>
              We grade them.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
            Every upgrade, downgrade, and price target in the sample is checked against the price that followed. Hit rates are public. The formula fits on one page.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/leaderboards" className="btn">
              Open the leaderboards
            </Link>
            <Link href="/methodology" className="btn-ghost">
              How scoring works
            </Link>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Count label="Analysts" value={home.analystCount} />
            <Count label="Banks" value={home.bankCount} />
            <Count label="Tickers" value={home.tickerCount} />
            <Count label="Active graded, 90D" value={home.graded90} />
          </dl>
        </div>
        <aside className="panel overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <h2 className="font-serif text-xl">Latest calls</h2>
            <p className="text-xs text-faint">Newest demo calls. Grade is the longest window that has closed.</p>
          </div>
          <ul>
            {home.tape.map((call) => {
              const closed = longestClosed(call);
              return (
              <li key={call.id} className="border-b border-line/80 px-4 py-3 last:border-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/calls/${call.id}`} className="text-sm leading-5 hover:text-brass">
                      <span className="text-ink">{call.analyst.name}</span>{" "}
                      <span className="text-muted">
                        {callHeadline({
                          action: call.action,
                          symbol: call.ticker.symbol,
                          ratingTo: call.ratingTo,
                        })}
                      </span>
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
                      <RecommendationPill call={call} />
                      <span>
                        {call.bank.shortName} · {formatDate(call.callDate)}
                        {" · "}
                        {call.supersession.status === "nullified" ? "Superseded · not scored" : "Active book"}
                      </span>
                    </p>
                    <SupersessionNotes mark={call.supersession} verbose={false} />
                  </div>
                  <div className="text-right">
                    <GradePill result={closed?.grade.directionResult ?? null} />
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-faint">
                      {closed ? HORIZONS[closed.horizon].short : "Open"}
                    </p>
                  </div>
                </div>
              </li>
              );
            })}
          </ul>
        </aside>
      </section>

      <section className="mt-10">
        <p className="mb-3 text-sm text-muted">
          Every card leads with the overall factor, the average 0–100 grade of active calls. The GC score sits beside it, Grade Calibration from{" "}
          <span className="text-ink">1</span> to <span className="text-ink">10</span>. Superseded calls do not enter the factor. Under 70 the GC score stays in 1–4. The top 30% who also cleared 70 land on GC 8–10. Hit rate is underneath, on the active book only.
        </p>
        <div className="grid gap-4 lg:grid-cols-3">
        <MiniLeaderboard title="Top analysts" href="/leaderboards?view=analysts" rows={home.analysts.map(toRow)} />
        <MiniLeaderboard title="Top banks" href="/leaderboards?view=banks" rows={home.banks.map(toRow)} />
        <MiniLeaderboard title="Worst offenders" href="/leaderboards?view=offenders" rows={home.offenders.map(toRow)} />
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Featured
          eyebrow="Best followed, 90D"
          call={home.featuredHit}
          tone="hit"
        />
        <Featured
          eyebrow="Worst followed, 90D"
          call={home.featuredMiss}
          tone="miss"
        />
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="kicker">No black box</p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight">The grade is the product.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            A call leads with the recommendation: an upgrade, a target raise, a reiteration. The grade uses a separate direction bucket, plus an optional target. Those pieces add up to a score from 0 to 100, shown in full. Under 70 the GC score stays in 1–4. The top 30% of peers who also cleared 70 land on GC 8–10. Near-misses get half credit and do not count as hits.
          </p>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3">
          {[
            ["01", "Direction", "The grade uses a Buy, Hold, or Sell bucket. Buy has to rise. Sell has to fall. Hold has to stay inside the band. That bucket is not the headline."],
            ["02", "Target", "The price after the window is compared with the target, not with the press release."],
            ["03", "The desk", "Firm scores are call-weighted. A loud analyst moves the bank."],
          ].map(([n, title, body]) => (
            <li key={n} className="panel p-4">
              <p className="num text-xs text-brass">{n}</p>
              <h3 className="mt-2 font-serif text-xl">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {home.controversial.length > 0 ? (
        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="kicker">Accountability</p>
              <h2 className="mt-2 font-serif text-3xl">Controversial moves</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Two-notch rating changes, or price targets that jumped more than 25%. The grade is the longest window that has closed. Demo calls only.
              </p>
            </div>
            <Link href="/methodology#controversial" className="hidden text-sm text-brass sm:inline">
              Why these are flagged
            </Link>
          </div>
          <div className="panel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Call</th>
                  <th>Why</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {home.controversial.map((call) => {
                  const closed = longestClosed(call);
                  return (
                  <tr key={call.id}>
                    <td>
                      <Link href={`/calls/${call.id}`} className="hover:text-brass">
                        {call.analyst.name} on {call.ticker.symbol}
                      </Link>
                      <p className="text-xs text-faint">
                        {call.bank.shortName} · {formatDate(call.callDate)} · {recommendationLabel(call)}
                        {" · "}
                        {call.supersession.status === "nullified" ? "Superseded · not scored" : "Active book"}
                      </p>
                      <SupersessionNotes mark={call.supersession} />
                    </td>
                    <td className="max-w-xs text-sm text-muted">{call.controversialReason}</td>
                    <td>
                      <GradePill result={closed?.grade.directionResult ?? null} />
                      <p className="num mt-1 text-xs text-faint">
                        {closed ? `${HORIZONS[closed.horizon].short} ${pct(closed.grade.forwardReturn)}` : "Open"}
                      </p>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-t border-line pt-3">
      <dt className="text-xs uppercase tracking-wider text-faint">{label}</dt>
      <dd className="num mt-1 text-2xl">{value.toLocaleString("en-US")}</dd>
    </div>
  );
}

function Featured({
  eyebrow,
  call,
  tone,
}: {
  eyebrow: string;
  call: Awaited<ReturnType<typeof getHome>>["featuredHit"];
  tone: "hit" | "miss";
}) {
  if (!call) return null;
  const followed = call.grades["90"].followedReturn;
  return (
    <article className="panel p-5">
      <p className="kicker">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-2xl leading-snug">
        <Link href={`/calls/${call.id}`} className="hover:text-brass">
          {call.analyst.name}{" "}
          {callHeadline({
            action: call.action,
            symbol: call.ticker.symbol,
            ratingTo: call.ratingTo,
          })}
        </Link>
      </h2>
      <p className="mt-2 text-sm text-muted">
        {call.bank.shortName} · {formatDate(call.callDate)} · target {call.priceTargetTo ? `$${Math.round(call.priceTargetTo)}` : "—"}
      </p>
      <p className={`num mt-4 text-4xl ${tone === "hit" ? "text-hit" : "text-miss"}`}>{pct(followed)}</p>
      <p className="mt-1 text-xs text-faint">Return if the directional call was followed for 90 days. Holds are excluded from this cut.</p>
    </article>
  );
}
