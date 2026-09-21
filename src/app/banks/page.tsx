import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, ScoreBar } from "@/components/ui";
import { listBanks } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Banks",
  description: "Sample research desks ranked inside the BankTruth demo.",
};

export default async function BanksPage() {
  const rows = await listBanks();
  const ordered = [...rows].sort((a, b) => (b.aggregate.avgScore ?? -1) - (a.aggregate.avgScore ?? -1));
  return (
    <div>
      <PageIntro
        kicker="Directory"
        title="Banks"
        lede="Firm names are labels on the sample so you can search the way a reader would. The score is the average of that desk's graded calls — not the firm's actual research record."
      />
      <div className="panel overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Bank</th>
              <th className="hidden sm:table-cell">Base</th>
              <th>Analysts</th>
              <th>N</th>
              <th>Hit</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map(({ bank, aggregate }) => (
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
                  <ScoreBar score={aggregate.avgScore} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
