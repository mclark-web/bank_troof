import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Draft terms for GradedCalls Analysts: a personal license to read the site, no scraping, and no sale of grades.",
};

export default function TermsPage() {
  return (
    <LegalShell
      kicker="Terms"
      title="Terms of use"
      lede="These terms are a draft. They describe how you may read GradedCalls Analysts, what you may not copy, and the limits on liability. They are not in force until counsel signs off."
    >
      <LegalSection id="agreement" title="Agreement">
        <p>
          By using GradedCalls Analysts you agree to this draft as the working description of the site. If you do not agree, do not use it. GradedCalls Analysts may change, suspend, or remove pages. A change to these terms is posted on this page with a new date. The date above is a placeholder.
        </p>
        <p>
          The <Link href="/disclaimer" className="text-brass hover:text-ink">disclaimer</Link> is part of these terms. GradedCalls Analysts is not investment advice, not an adviser, and not a broker. Using the site does not create a client relationship.
        </p>
      </LegalSection>

      <LegalSection id="license" title="License">
        <p>
          GradedCalls Analysts grants you a limited, revocable, non-exclusive license to view the site in a browser for your own information. You may not copy the grades, ranks, or compilation into a product, resell them, or present them as your own track record or as a live ranking. You may quote a short passage with attribution to GradedCalls Analysts and a link to the page.
        </p>
        <p>
          The license ends if you breach these terms. GradedCalls Analysts may revoke it for any page it operates.
        </p>
      </LegalSection>

      <LegalSection id="scraping" title="Scraping and automated access">
        <p>
          You may not scrape, crawl, harvest, or bulk-download the site, and you may not bypass rate limits, access controls, or technical measures. Ordinary browsing, including a normal browser cache, is fine. Building a product on top of these pages is not.
        </p>
        <p>
          GradedCalls Analysts itself does not scrape rankings sites. Prices used for grades are historical adjusted closes, documented on the methodology page.
        </p>
      </LegalSection>

      <LegalSection id="ip" title="Intellectual property">
        <p>
          The GradedCalls Analysts name, the design, the methodology text, and the compilation of sample calls are owned by the operator of GradedCalls Analysts. Market prices remain the property of their sources. Firm names and ticker symbols belong to their owners and are used here as labels, not as a claim of affiliation. Sample notes are not quotations of published research.
        </p>
        <p>
          The GC score, as used on this site, is Grade Calibration in the methodology. It is an opinion produced by the formula. It is not a certification of any person.
        </p>
      </LegalSection>

      <LegalSection id="donations" title="Donations are not a purchase">
        <p>
          If GradedCalls Analysts accepts a donation, that gift is voluntary. It is not a purchase of advice, a subscription, a tip service, or a fee for a grade. A donation does not change a score, a rank, or a correction. Donations are not tax-deductible unless GradedCalls Analysts later says so in writing. This draft does not. Details are on the <Link href="/donate" className="text-brass hover:text-ink">donations</Link> page.
        </p>
      </LegalSection>

      <LegalSection id="corrections" title="Corrections">
        <p>
          Send factual corrections to {LEGAL.contactEmail}. That address is a placeholder. Include the page, the figure, and the source you rely on. GradedCalls Analysts may correct, decline, or ignore a note. A correction is not for sale.
        </p>
      </LegalSection>

      <LegalSection id="dmca" title="Copyright notices (DMCA)">
        <p>
          If you believe a page infringes a copyright you own, send a DMCA notice to {LEGAL.dmcaEmail}. That address is a placeholder. It is not a registered DMCA agent. A notice should include:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your physical or electronic signature.</li>
          <li>The work you claim is infringed.</li>
          <li>The URL of the material, and enough detail to find it.</li>
          <li>Your name, address, telephone number, and email.</li>
          <li>A statement that you believe the use is not authorized.</li>
          <li>A statement, under penalty of perjury, that the notice is accurate and that you are the owner or the owner’s agent.</li>
        </ul>
        <p>
          GradedCalls Analysts may remove material and, where the law requires it, pass the notice to the person who posted it. This draft does not appoint an agent.
        </p>
      </LegalSection>

      <LegalSection id="warranty" title="No warranty">
        <p>
          The site is provided as-is and as-available. GradedCalls Analysts disclaims warranties of accuracy, completeness, merchantability, fitness for a particular purpose, and non-infringement, to the fullest extent the law allows. Prices, grades, and sample text can be wrong, delayed, revised, or removed. A demo vintage is labeled. It is not a live track record.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="Limitation of liability">
        <p>
          To the fullest extent the law allows, GradedCalls Analysts and its operator are not liable for any indirect, incidental, special, consequential, or punitive damages, or for trading losses, lost profits, or lost data, arising out of your use of the site, even if advised that such damages were possible.
        </p>
        <p>
          Where a liability cannot be excluded, it is capped at the greater of fifty U.S. dollars (US$50) or the amount you donated to GradedCalls Analysts in the three months before the claim. Some jurisdictions do not allow these limits. In those places, the limits apply only as far as the law permits.
        </p>
      </LegalSection>

      <LegalSection id="law" title="Governing law">
        <p>
          These terms are governed by the laws of the State of {LEGAL.governingState}, excluding its conflict-of-law rules. Courts in that state are the venue. {LEGAL.governingState} is a placeholder until counsel names the state. If a court strikes one clause, the rest stays in effect.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          Questions about these terms go to {LEGAL.contactEmail}. Do not send money, account credentials, or trading instructions to that address. It is a placeholder for a corrections and legal inbox, and it is not monitored until it is replaced.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
