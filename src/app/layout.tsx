import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { DemoBanner, SiteFooter, SiteHeader } from "@/components/chrome";
import "./globals.css";

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

const description =
  "Banks make the calls. We grade them. Charoof Analysts scores sell-side recommendations against later prices — by analyst, bank, and ticker.";

export const metadata: Metadata = {
  title: {
    default: "Charoof Analysts",
    template: "%s · Charoof Analysts",
  },
  description,
  applicationName: "Charoof Analysts",
  openGraph: {
    siteName: "Charoof Analysts",
    description,
    type: "website",
  },
  twitter: {
    card: "summary",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0e12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <DemoBanner />
        <SiteHeader />
        <main id="content" className="mx-auto max-w-page px-4 py-8 md:px-6 md:py-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
