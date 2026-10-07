import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, ScaleLegend, ScoreBar } from "@/components/ui";
import { listBanks } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Banks",
  description: "Research desks in the GradedCalls Analysts ledger, ranked by the grades of their calls.",
};

export default async function BanksPage() {
  const rows = await listBanks();
  const ordered = [...rows].sort((a, b) => (b.aggregate.avgScore ?? -1) - (a.aggregate.avgScore ?? -1));
  return (
    <div>
      <PageIntro
        kicker="Directory"
        title="Banks"
        lede="The overall factor is the average 0–100 grade of that desk's active calls, with the GC score beside it. A firm with no calls in this ledger reads Not graded yet. The grade is not that firm's published research."
      />
      <ScaleLegend className="mb-3" />
      <div className="panel stack-table" tabIndex={0} role="region" aria-label="Banks, scrollable">
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
                <span className="mt-1 block font-sans text-xs font-normal normal-case tracking-normal text-faint">/100 · GC 1–10</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ordered.map(({ bank, aggregate, placement }) => (
              <tr key={bank.id}>
                <td data-label="Bank">
                  <Link href={`/banks/${bank.slug}`} className="font-medium hover:text-brass">
                    {bank.name}
                  </Link>
                </td>
                <td className="hidden text-muted sm:table-cell show-on-card" data-label="Base">{bank.headquarters}</td>
                <td className="num" data-label="Analysts">{bank.analysts.length}</td>
                <td className="num" data-label="N">{aggregate.graded}</td>
                <td className="num" data-label="Hit">{aggregate.hitRate == null ? "—" : `${Math.round(aggregate.hitRate * 100)}%`}</td>
                <td data-label="Overall factor">
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
