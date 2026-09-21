import type { Metadata } from "next";
import { PageIntro } from "@/components/ui";
import { WatchlistBoard } from "@/components/watch";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "A browser-local watchlist of analysts, banks, and tickers.",
};

export default function WatchlistPage() {
  return (
    <div>
      <PageIntro
        kicker="Local only"
        title="Watchlist"
        lede="Saved in this browser. BankTruth does not ask for an account in this demo, and the list does not leave the device."
      />
      <WatchlistBoard />
    </div>
  );
}
