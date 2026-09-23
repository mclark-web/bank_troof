"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/analysts", label: "Analysts" },
  { href: "/banks", label: "Banks" },
  { href: "/tickers", label: "Tickers" },
  { href: "/methodology", label: "Method" },
  { href: "/watchlist", label: "Watchlist" },
];

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNav({ variant }: { variant: "bar" | "menu" }) {
  const pathname = usePathname();
  if (variant === "menu") {
    return (
      <nav className="flex flex-col gap-1" aria-label="Mobile">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-2 py-2 text-sm hover:bg-white/5"
            aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Primary">
      {NAV.map((item) => {
        const on = isCurrent(pathname, item.href);
        return (
          <Link key={item.href} href={item.href} className={on ? "nav-link nav-link-on" : "nav-link"} aria-current={on ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
