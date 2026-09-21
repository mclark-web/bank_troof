import Link from "next/link";
import { DATASET } from "@/lib/labels";

const NAV = [
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/analysts", label: "Analysts" },
  { href: "/banks", label: "Banks" },
  { href: "/tickers", label: "Tickers" },
  { href: "/methodology", label: "Methodology" },
  { href: "/watchlist", label: "Watchlist" },
];

export function DemoBanner() {
  return (
    <div className="border-b border-brass/20 bg-brass/10 px-4 py-2 text-center text-xs text-brass sm:text-[13px]">
      Demo data, vintage {DATASET.vintageLabel}. Analysts are fictional. Prices and grades are illustrative — not a live track record, and not investment advice.
    </div>
  );
}

export function SearchForm({ initial = "", compact = false }: { initial?: string; compact?: boolean }) {
  return (
    <form action="/search" className={compact ? "w-full" : "w-full md:w-64"} role="search">
      <label className="sr-only" htmlFor={compact ? "q-mobile" : "q-desktop"}>
        Search analysts, banks, or tickers
      </label>
      <input
        id={compact ? "q-mobile" : "q-desktop"}
        name="q"
        defaultValue={initial}
        placeholder="Analyst, bank, or ticker"
        className="field"
      />
    </form>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-page items-center gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-brass font-serif text-lg leading-none text-[#1a1408]">
            B
          </span>
          <span className="font-serif text-[1.35rem] leading-none tracking-tight">BankTruth</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-5 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-muted transition hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden md:block">
          <SearchForm />
        </div>
        <details className="relative ml-auto md:ml-0 lg:hidden">
          <summary className="cursor-pointer list-none rounded-md border border-line px-3 py-1.5 text-sm text-muted [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-line bg-raised p-3 shadow-card">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-md px-2 py-2 text-sm hover:bg-white/5">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </details>
      </div>
      <div className="mx-auto max-w-page px-4 pb-3 md:hidden">
        <SearchForm compact />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto grid max-w-page gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr] md:px-6">
        <div>
          <p className="font-serif text-xl">BankTruth</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Banks make the calls. We grade them. BankTruth scores sell-side recommendations against the price that followed — by analyst, by firm, and by ticker. It is an independent demonstration product. It is not a broker-dealer, not investment advice, and not affiliated with any bank or ratings publisher.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-faint">
            Past accuracy does not predict future results. Every figure in this build is sample data: fictional analysts, simulated prices, and grades computed from that sample. Do not use it to trade.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted md:items-end">
          <Link href="/methodology" className="hover:text-ink">Methodology</Link>
          <Link href="/leaderboards" className="hover:text-ink">Leaderboards</Link>
          <Link href="/leaderboards?view=offenders" className="hover:text-ink">Worst offenders</Link>
          <Link href="/watchlist" className="hover:text-ink">Watchlist</Link>
        </div>
      </div>
    </footer>
  );
}
