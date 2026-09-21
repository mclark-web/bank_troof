import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/chrome";
import { PageIntro } from "@/components/ui";
import { searchAll } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the BankTruth sample for an analyst, a bank, or a ticker.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const value = raw.q;
  const q = (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  const results = q ? await searchAll(q) : { analysts: [], banks: [], tickers: [] };
  const total = results.analysts.length + results.banks.length + results.tickers.length;

  return (
    <div>
      <PageIntro
        kicker="Search"
        title={q ? `Results for “${q}”` : "Search the sample"}
        lede="Analysts, banks, and tickers. Firm names are searchable. The people are fictional."
      />
      <div className="mb-8 max-w-md">
        <SearchForm initial={q} compact />
      </div>
      {!q ? null : total === 0 ? (
        <p className="text-sm text-muted">Nothing in the demo matched that query.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <ResultGroup title="Analysts">
            {results.analysts.map((analyst) => (
              <li key={analyst.id}>
                <Link href={`/analysts/${analyst.slug}`} className="hover:text-brass">
                  {analyst.name}
                </Link>
                <p className="text-xs text-faint">
                  {analyst.bank.shortName} · {analyst.sector}
                </p>
              </li>
            ))}
          </ResultGroup>
          <ResultGroup title="Banks">
            {results.banks.map((bank) => (
              <li key={bank.id}>
                <Link href={`/banks/${bank.slug}`} className="hover:text-brass">
                  {bank.name}
                </Link>
                <p className="text-xs text-faint">{bank.headquarters}</p>
              </li>
            ))}
          </ResultGroup>
          <ResultGroup title="Tickers">
            {results.tickers.map((ticker) => (
              <li key={ticker.id}>
                <Link href={`/tickers/${ticker.symbol}`} className="num hover:text-brass">
                  {ticker.symbol}
                </Link>
                <p className="text-xs text-faint">
                  {ticker.name} · {ticker.sector}
                </p>
              </li>
            ))}
          </ResultGroup>
        </div>
      )}
    </div>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const list = Array.isArray(children) ? children : [children];
  const present = list.filter(Boolean);
  return (
    <section>
      <h2 className="mb-3 font-serif text-2xl">{title}</h2>
      {present.length === 0 ? (
        <p className="text-sm text-faint">No matches.</p>
      ) : (
        <ul className="space-y-3 text-sm">{children}</ul>
      )}
    </section>
  );
}
