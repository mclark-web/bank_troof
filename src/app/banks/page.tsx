import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, ScaleLegend, ScoreBar } from "@/components/ui";
import { listBanks } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Banks",
  description: "Sample research desks ranked inside the GradedCalls Analysts demo.",
};

export default async function BanksPage() {
  const rows = await listBanks();
  const ordered = [...rows].sort((a, b) => (b.aggregate.avgScore ?? -1) - (a.aggregate.avgScore ?? -1));
  return (
    <div>
      <PageIntro
        kicker="Directory"
        title="Banks"
        lede="Firm names are labels on the sample so you can search the way a reader would. The overall factor is the average 0–100 grade of that desk's active calls, with the Chad bucket beside it. 1 is Chud. 10 is Chad. It is not the firm's actual research record."
      />
      <ScaleLegend className="mb-3" />
      <div className="panel overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Bank</th>
              <th className="hidden sm:table-cell">Base</th>
              <th>Analysts</th>
              <th>N</th>
              <th>Hit</th>
              <th>
                Overall factor
                <span className="mt-1 block font-sans text-[10px] font-normal normal-case tracking-normal text-faint">/100 · Chad 1–10</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ordered.map(({ bank, aggregate, placement }) => (
              <tr key={bank.id}>
                <td>
                  <Link href={`/banks/${bank.slug}`} className="font-medium hover:text-brass">
                    {bank.name}
                  </Link>
                </td>
                <td className="hidden text-muted sm:table-cell">{bank.headquarters}</td>
                <td className="num">{bank.analysts.length}</td>
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
