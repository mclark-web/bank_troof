import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Donations",
  description:
    "GradedCalls Analysts is donation-supported. Gifts do not buy grades, advice, or a subscription.",
};

export default function DonatePage() {
  return (
    <LegalShell
      kicker="Donations"
      title="Donation-supported. Grades are not for sale."
      lede="GradedCalls Analysts is not a paid advice service, a subscription tip sheet, or a product that sells scores. A gift, if one is accepted later, does not buy a grade."
    >
      <LegalSection id="what" title="What a donation is">
        <p>
          GradedCalls Analysts is built to run on voluntary support. A donation is a gift to keep the site available. It is not a fee, not a subscription, and not payment for a recommendation. There is no paid tier, no tip line, and no grade you can purchase.
        </p>
        <p>
          This draft does not take payment. There is no checkout on this page. Do not send money, cards, or account details to {LEGAL.contactEmail} or anywhere else in response to this page. A later version may name a payment processor. Until that page says so, in writing, nothing here is a request for funds.
        </p>
      </LegalSection>

      <LegalSection id="does-not" title="What a donation does not buy">
        <p>A gift does not buy any of the following:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>A grade, a Chad or Chud label, or a place on a leaderboard.</li>
          <li>A change to a score, a rank, or a sample note.</li>
          <li>Access that other readers do not have. The pages stay public.</li>
          <li>A correction. Errors are fixed from the source, or they are not fixed. They are not for sale.</li>
          <li>Investment advice, a client relationship, or a duty to you.</li>
          <li>A tax deduction. Donations are not tax-deductible unless GradedCalls Analysts later says so in a written notice. None is in effect.</li>
        </ul>
        <p>
          The scoring formula does not read who gave. Two readers looking at the same call see the same grade.
        </p>
      </LegalSection>

      <LegalSection id="not-advice" title="Still not advice">
        <p>
          Supporting the site does not make GradedCalls Analysts your adviser, your broker, or your agent. The <Link href="/disclaimer" className="text-brass hover:text-ink">disclaimer</Link> applies to donors the same way it applies to everyone else. Past grades do not predict future results. Analysts and notes in this vintage are a demo. Prices used for grades are historical adjusted closes, documented in the <Link href="/methodology" className="text-brass hover:text-ink">methodology</Link>.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Questions">
        <p>
          Questions about a future donations program go to {LEGAL.contactEmail}. That address is a placeholder and is not monitored. It is not a place to send money.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
