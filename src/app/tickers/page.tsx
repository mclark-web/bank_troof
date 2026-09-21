import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, ScaleLegend, ScoreBar } from "@/components/ui";
import { listTickers } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Tickers",
  description: "How the Charoof Analysts sample rated each name, and who was right.",
};

export default async function TickersPage() {
  const rows = await listTickers();
  const sectors = [...new Set(rows.map((row) => row.ticker.sector))];
  return (
    <div>
      <PageIntro
        kicker="Directory"
        title="Tickers"
        lede="The Chad score grades every 90-day call on the name, from 1 (Chud) to 10 (Chad). Consensus is the latest sample rating from each analyst. Hit rate sits beside the grade."
      />
      <ScaleLegend className="mb-6" />
      <div className="space-y-8">
        {sectors.map((sector) => (
          <section key={sector}>
            <h2 className="mb-3 font-serif text-2xl">{sector}</h2>
            <div className="panel overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th className="hidden md:table-cell">Name</th>
                    <th>Voices</th>
                    <th>Buy</th>
                    <th>Hold</th>
                    <th>Sell</th>
                    <th>
                      Chad
                      <span className="mt-1 block font-sans text-[10px] font-normal normal-case tracking-normal text-faint">1–10 · /100</span>
                    </th>
                    <th>90D hit</th>
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .filter((row) => row.ticker.sector === sector)
                    .map(({ ticker, aggregate, placement, buckets, voices }) => (
                      <tr key={ticker.id}>
                        <td>
                          <Link href={`/tickers/${ticker.symbol}`} className="num font-medium hover:text-brass">
                            {ticker.symbol}
                          </Link>
                          <p className="text-xs text-faint md:hidden">{ticker.name}</p>
                        </td>
                        <td className="hidden text-muted md:table-cell">{ticker.name}</td>
                        <td className="num">{voices}</td>
                        <td className="num text-hit">{buckets.buy}</td>
                        <td className="num">{buckets.hold}</td>
                        <td className="num text-miss">{buckets.sell}</td>
                        <td>
                          <ScoreBar score={aggregate.avgScore} placement={placement} />
                        </td>
                        <td className="num">
                          {aggregate.hitRate == null ? "—" : `${Math.round(aggregate.hitRate * 100)}%`}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
