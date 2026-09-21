import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, ScaleLegend, ScoreBar } from "@/components/ui";
import { listAnalysts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Analysts",
  description: "Fictional sell-side analysts in the Charoof Analysts demo, with 90-day scores.",
};

export default async function AnalystsPage() {
  const rows = await listAnalysts();
  return (
    <div>
      <PageIntro
        kicker="Directory"
        title="Analysts"
        lede="Every name on this desk is fictional. The number is the 90-day Chad score: 1 is Chud, 10 is Chad."
      />
      <ScaleLegend className="mb-3" />
      <div className="panel overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Analyst</th>
              <th>Firm</th>
              <th className="hidden sm:table-cell">Sector</th>
              <th>N</th>
              <th>Hit</th>
              <th>
                Chad
                <span className="mt-1 block font-sans text-[10px] font-normal normal-case tracking-normal text-faint">1–10 · /100</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ analyst, aggregate, placement }) => (
              <tr key={analyst.id}>
                <td>
                  <Link href={`/analysts/${analyst.slug}`} className="font-medium hover:text-brass">
                    {analyst.name}
                  </Link>
                  <p className="text-xs text-faint sm:hidden">{analyst.sector}</p>
                </td>
                <td>
                  <Link href={`/banks/${analyst.bank.slug}`} className="text-muted hover:text-brass">
                    {analyst.bank.shortName}
                  </Link>
                </td>
                <td className="hidden text-muted sm:table-cell">{analyst.sector}</td>
                <td className="num">{aggregate.graded}</td>
                <td className="num">{aggregate.hitRate == null ? "—" : `${Math.round(aggregate.hitRate * 100)}%`}</td>
                <td>
                  <ScoreBar score={aggregate.avgScore} placement={placement} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
