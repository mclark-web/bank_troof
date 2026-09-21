"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatChadScore } from "@/lib/scoring";

export type WatchKind = "analyst" | "bank" | "ticker";

export type WatchItem = {
  kind: WatchKind;
  slug: string;
  label: string;
  meta: string;
};

const KEY = "banktruth.watchlist.v1";

export function readWatchlist(): WatchItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WatchItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && item.slug && item.kind && item.label);
  } catch {
    return [];
  }
}

function writeWatchlist(items: WatchItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("banktruth-watchlist"));
}

export function WatchButton({
  kind,
  slug,
  label,
  meta,
}: {
  kind: WatchKind;
  slug: string;
  label: string;
  meta: string;
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sync = () => setOn(readWatchlist().some((item) => item.kind === kind && item.slug === slug));
    sync();
    window.addEventListener("banktruth-watchlist", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("banktruth-watchlist", sync);
      window.removeEventListener("storage", sync);
    };
  }, [kind, slug]);

  function toggle() {
    const current = readWatchlist();
    const exists = current.some((item) => item.kind === kind && item.slug === slug);
    const next = exists
      ? current.filter((item) => !(item.kind === kind && item.slug === slug))
      : [...current, { kind, slug, label, meta }];
    writeWatchlist(next);
    setOn(!exists);
  }

  return (
    <button type="button" onClick={toggle} className={on ? "btn" : "btn-ghost"} aria-pressed={on}>
      {on ? "Watching" : "Watch"}
    </button>
  );
}

type ScoreRow = {
  slug: string;
  name: string;
  meta: string;
  href: string;
  found: boolean;
  aggregate: { avgScore: number | null; hitRate: number | null; graded: number };
};

export function WatchlistBoard() {
  const [items, setItems] = useState<WatchItem[] | null>(null);
  const [scores, setScores] = useState<Record<string, ScoreRow>>({});

  useEffect(() => {
    const sync = () => setItems(readWatchlist());
    sync();
    window.addEventListener("banktruth-watchlist", sync);
    return () => window.removeEventListener("banktruth-watchlist", sync);
  }, []);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const analysts = items.filter((item) => item.kind === "analyst").map((item) => item.slug);
    const banks = items.filter((item) => item.kind === "bank").map((item) => item.slug);
    const tickers = items.filter((item) => item.kind === "ticker").map((item) => item.slug);
    const params = new URLSearchParams({
      analysts: analysts.join(","),
      banks: banks.join(","),
      tickers: tickers.join(","),
    });
    let cancelled = false;
    fetch(`/api/scores?${params.toString()}`)
      .then((response) => response.json())
      .then((data: { analysts: ScoreRow[]; banks: ScoreRow[]; tickers: ScoreRow[] }) => {
        if (cancelled) return;
        const map: Record<string, ScoreRow> = {};
        for (const row of [...data.analysts, ...data.banks, ...data.tickers]) {
          map[`${row.href}`] = row;
        }
        setScores(map);
      })
      .catch(() => {
        if (!cancelled) setScores({});
      });
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (items == null) {
    return <p className="text-sm text-muted">Loading the watchlist saved in this browser.</p>;
  }

  if (items.length === 0) {
    return (
      <div className="panel px-5 py-10 text-center">
        <p className="font-serif text-2xl">Nothing on the list yet.</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Watch an analyst, a bank, or a ticker. The list stays in this browser — no account required.
        </p>
        <Link href="/leaderboards" className="btn mt-5">
          Browse the boards
        </Link>
      </div>
    );
  }

  function remove(item: WatchItem) {
    writeWatchlist(readWatchlist().filter((entry) => !(entry.kind === item.kind && entry.slug === item.slug)));
  }

  return (
    <ul className="panel divide-y divide-line">
      {items.map((item) => {
        const href =
          item.kind === "analyst" ? `/analysts/${item.slug}` : item.kind === "bank" ? `/banks/${item.slug}` : `/tickers/${item.slug}`;
        const score = scores[href];
        return (
          <li key={`${item.kind}:${item.slug}`} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{item.kind}</p>
              <Link href={href} className="font-serif text-xl hover:text-brass">
                {item.label}
              </Link>
              <p className="text-sm text-muted">{item.meta}</p>
            </div>
            <div className="sm:text-right">
              {score?.found ? (
                <>
                  <p className="flex items-baseline gap-2 sm:justify-end">
                    <span className="num text-4xl leading-none">{formatChadScore(score.aggregate.avgScore)}</span>
                    <span className="num text-lg text-faint">/ 10</span>
                  </p>
                  <p className="mt-1 text-[11px] text-faint">1 Chud · 10 Chad</p>
                  <p className="num mt-1 text-sm text-muted">
                    Hit {score.aggregate.hitRate == null ? "—" : `${Math.round(score.aggregate.hitRate * 100)}%`} ·{" "}
                    {score.aggregate.graded} graded
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted">Looking up the Chad score…</p>
              )}
            </div>
            <button type="button" className="btn-ghost" onClick={() => remove(item)}>
              Remove
            </button>
          </li>
        );
      })}
    </ul>
  );
}
