import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, ScaleLegend, ScoreBar } from "@/components/ui";
import { listBanks } from "@/lib/queries";
import { toChadExact, toChadScore } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Banks",
  description: "Sample research desks ranked inside the BankTruth demo.",
};

export default async function BanksPage() {
  const rows = await listBanks();
  const ordered = [...rows].sort((a, b) => {
    const shown = (toChadScore(b.aggregate.avgScore) ?? -1) - (toChadScore(a.aggregate.avgScore) ?? -1);
    if (shown !== 0) return shown;
    return (toChadExact(b.aggregate.avgScore) ?? -1) - (toChadExact(a.aggregate.avgScore) ?? -1);
  });
  return (
    <div>
      <PageIntro
        kicker="Directory"
        title="Banks"
        lede="Firm names are labels on the sample so you can search the way a reader would. The Chad score is a 1–10 map of that desk's graded calls — not the firm's actual research record. 1 is Chud. 10 is Chad."
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
              <th>Chad</th>
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
