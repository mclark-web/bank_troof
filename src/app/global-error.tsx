"use client";

import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { GRADED_CALLS_HUB_HREF, LogoLink } from "@/components/logo-link";
import "./globals.css";
import "./gc-scale.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <head>
        <title>This page failed to load · GradedCalls Analysts</title>
      </head>
      <body className="font-sans antialiased">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/90">
          <div className="mx-auto flex max-w-page items-center px-4 py-3 md:px-6">
            <LogoLink />
          </div>
        </header>
        <main id="content" className="mx-auto max-w-page px-4 py-16 text-center md:px-6">
          <p className="kicker">Error</p>
          <h1 className="mt-3 font-serif text-4xl">This page failed to load.</h1>
          <p className="mt-3 text-sm text-muted">The sample database did not answer. Retry, or restart the app after seeding.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button type="button" className="btn" onClick={reset}>
              Try again
            </button>
            <a href={GRADED_CALLS_HUB_HREF} className="btn-ghost">
              Hub
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
