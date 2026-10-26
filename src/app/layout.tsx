import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { LedgerBanner, SiteFooter, SiteHeader } from "@/components/chrome";
import { OG_SITE_NAME, SHARE_IMAGE, SITE_URL } from "@/lib/site-urls";
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

const description =
  "Banks make the calls. We grade them. GradedCalls Analysts scores sell-side recommendations against later prices — by analyst, bank, and ticker.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GradedCalls Analysts",
    template: "%s · GradedCalls Analysts",
  },
  description,
  applicationName: "GradedCalls Analysts",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    siteName: OG_SITE_NAME,
    type: "website",
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [SHARE_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0c0e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <div className="gc-ambient" aria-hidden>
          <div className="wisp wisp-1" />
          <div className="wisp wisp-2" />
          <div className="wisp wisp-3" />
        </div>
        <div className="relative z-10">
          <a className="skip-link" href="#content">
            Skip to content
          </a>
          <LedgerBanner />
          <SiteHeader />
          <main id="content" className="mx-auto max-w-page px-4 py-8 md:px-6 md:py-10">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
