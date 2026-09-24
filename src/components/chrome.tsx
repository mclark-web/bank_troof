import Link from "next/link";
import { DATASET } from "@/lib/labels";
import { PrimaryNav } from "@/components/primary-nav";

function Mark() {
  return (
    <span className="gc-mark" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3v3M12 18v3M5 12H2M22 12h-3" stroke="#ff6a00" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M7.5 8.5c1.8-2.2 7.2-2.2 9 0M7.5 15.5c1.8 2.2 7.2 2.2 9 0" stroke="#f2f1ee" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2.2" fill="#ff6a00" />
      </svg>
    </span>
  );
}

export function DemoBanner() {
  return (
    <div className="border-b border-warn/40 bg-warn/6 px-4 py-2 text-center text-xs text-warn sm:text-[13px]">
      Demo vintage {DATASET.vintageLabel}. Analysts and notes are sample. Prices are Yahoo Finance adjusted closes (adjusted for splits and dividends); a few recent calls use the raw close on the call date. Not a live track record, and not investment advice.
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
        <Link href="/" className="brand-link flex shrink-0 items-center gap-2.5" aria-label="GradedCalls Analysts">
          <Mark />
          <span className="text-[17px] font-semibold tracking-tight">
            Graded<span className="text-brass">Calls</span>
          </span>
        </Link>
        <PrimaryNav variant="bar" />
        <div className="ml-auto hidden md:block">
          <SearchForm />
        </div>
        <details className="relative ml-auto md:ml-0 lg:hidden">
          <summary className="cursor-pointer list-none rounded-md border border-line px-3 py-1.5 text-sm text-muted [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-line bg-raised p-3 shadow-card">
            <PrimaryNav variant="menu" />
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
          <p className="text-xl font-semibold leading-none tracking-tight">
            Graded<span className="text-brass">Calls</span> <span className="text-muted">Analysts</span>
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            GradedCalls Analysts grades calls against historical prices. Analysts and notes in this build are a demo. It is not investment advice, not a tip service, and not for sale. Donations, if any, do not change a score.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-faint">
            Past accuracy does not predict future results. Not a broker. Not affiliated with any bank or ratings publisher.
          </p>
        </div>
        <div className="flex flex-col gap-x-2 gap-y-3 text-sm text-muted md:items-end">
          <Link href="/methodology" className="hover:text-ink">Methodology</Link>
          <Link href="/leaderboards" className="hover:text-ink">Leaderboards</Link>
          <Link href="/leaderboards?view=offenders" className="hover:text-ink">Worst offenders</Link>
          <Link href="/watchlist" className="hover:text-ink">Watchlist</Link>
          <Link href="/calls" className="hover:text-ink">Calls</Link>
          <Link href="/about" className="hover:text-ink">About</Link>
          <Link href="/disclaimer" className="hover:text-ink">Disclaimer</Link>
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <Link href="/donate" className="hover:text-ink">Donate</Link>
        </div>
      </div>
    </footer>
  );
}
