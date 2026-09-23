import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "GradedCalls Analysts is a donation-supported demo. It is not investment advice, not a broker, and not affiliated with any bank.",
};

export default function DisclaimerPage() {
  return (
    <LegalShell
      kicker="Disclaimer"
      title="Read this before you treat a grade as a fact"
      lede="GradedCalls Analysts scores sample calls against historical prices. The grades are a methodology, not a recommendation, a forecast, or a product you can buy."
    >
      <LegalSection id="not-advice" title="Not investment advice">
        <p>
          Nothing on GradedCalls Analysts is investment, financial, legal, or tax advice. A grade, a rank, a GC score, a hit rate, a return-if-followed figure, or a note is not a recommendation to buy, sell, or hold any security, and it is not a solicitation. You are responsible for your own decisions. If you need advice, talk to a qualified adviser who knows your situation.
        </p>
        <p>
          GradedCalls Analysts is not an investment adviser, not a registered investment adviser, and not a broker-dealer. It does not manage money, take orders, hold customer funds, or execute trades. Reading a page, saving a name to the watchlist, or sending a donation does not make you a client.
        </p>
      </LegalSection>

      <LegalSection id="no-relationship" title="No client relationship">
        <p>
          Use of the site does not create a client, advisory, fiduciary, or brokerage relationship with GradedCalls Analysts or with anyone who operates it. There is no duty to update a grade, to tell you when a number changes, or to consider your finances. The watchlist lives in your browser. It is not an account and it is not a managed portfolio.
        </p>
      </LegalSection>

      <LegalSection id="past" title="Past accuracy is not future results">
        <p>
          A grade looks backward. It asks whether a rating pointed the right way over a fixed window, and how close a price target landed. That is a description of a completed window. It is not a forecast of the next one. A high score can be luck, a rising tape, or a short sample. A low score can be the same things in reverse. Do not trade on it.
        </p>
      </LegalSection>

      <LegalSection id="prices" title="How the prices are real, and how the rest is a demo">
        <p>
          When a call is graded, the price at the call and the later prices are historical split-adjusted closes from Yahoo Finance. The windows are 14 calendar days (2 weeks), 30 days, 60 days, 90 days, and 1 year. If the calendar date is not a trading session, the price is the prior session’s adjusted close, and only when that session is within four calendar days. A missing quote is an error. The site does not invent a price to fill a gap. A window that has not elapsed is left ungraded.
        </p>
        <p>
          Analysts, biographies, notes, ratings, and price targets in this vintage are a demo sample. Firm names are labels for that sample. They are not those firms’ research, and they are not a description of any person who works there. Targets are fictional numbers kept in a band around the real price at the call so the arithmetic has something to grade. The banner on every page marks this vintage as a demo.
        </p>
        <p>
          Prices can be revised by the source, rounded to the cent, and restated after a split. The series is not adjusted for the market, the sector, or beta. Coverage is incomplete. A buy in a rising tape can “hit” without insight. The <Link href="/methodology" className="text-brass hover:text-ink">methodology</Link> is the formula. If a page and that write-up disagree, the scoring code is the source of truth.
        </p>
      </LegalSection>

      <LegalSection id="affiliation" title="No affiliation">
        <p>
          GradedCalls Analysts is not affiliated with, endorsed by, or sponsored by any bank, broker, analyst, exchange, data vendor, or ratings publisher. Names of firms and tickers are used as labels so a sample call can be filed. They remain the property of their owners. GradedCalls Analysts does not scrape rankings sites. It does not present itself as those firms’ published research.
        </p>
      </LegalSection>

      <LegalSection id="opinions" title="GC scores are opinions">
        <p>
          The GC score is Grade Calibration in the published methodology, not a regulated rating and not a statement about a person. Under 70 out of 100 the GC score stays in 1–4. The top 30% of a ranked peer set lands on GC 8–10 only when the score is also at least 70. The full grade out of 100 is always the score. The 1–10 number is a bucket of that score. Both are opinions produced by a formula applied to a sample. They are not for sale.
        </p>
      </LegalSection>

      <LegalSection id="donations" title="Donations do not change a score">
        <p>
          GradedCalls Analysts is donation-supported. It is not a paid advice service, not a subscription tip sheet, and not a product that sells grades. A donation does not buy a grade, move a rank, unlock a score, or create a client relationship. The formula does not read who gave. Donations are not tax-deductible unless a later written notice says so. None is in effect. See <Link href="/donate" className="text-brass hover:text-ink">Donations</Link>.
        </p>
      </LegalSection>

      <LegalSection id="corrections" title="Corrections">
        <p>
          If a historical price, a label, or a page is wrong, write to {LEGAL.contactEmail}. That address is a placeholder and is not monitored until it is replaced. Say which page, which figure, and what you believe the source shows. A correction is a fix to the record. It is not a favor, and it is not available for purchase.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="Limitation of liability">
        <p>
          The site is offered as-is. To the fullest extent the law allows, GradedCalls Analysts is not liable for trading losses or other damages that follow from using a grade. The cap and the rest of that clause are in the <Link href="/terms" className="text-brass hover:text-ink">Terms</Link>. Those terms are also a draft for legal review.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
