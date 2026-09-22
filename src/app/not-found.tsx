import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="kicker">404</p>
      <h1 className="mt-3 font-serif text-4xl">That page is not on the tape.</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        The analyst, bank, ticker, or call is not in this demo. Search the sample, or go back to the boards.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/leaderboards" className="btn">
          Leaderboards
        </Link>
        <Link href="/search" className="btn-ghost">
          Search
        </Link>
      </div>
    </div>
  );
}
