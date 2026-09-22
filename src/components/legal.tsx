import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { LEGAL } from "@/lib/legal";

const PAGES = [
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/terms", label: "Terms" },
  { href: "/donate", label: "Donations" },
];

export function DraftNotice() {
  return (
    <p className="text-xs leading-5 text-faint">
      Draft for legal review. This page is not a signed legal opinion and is not in effect as a
      contract until counsel signs off. Last revised {LEGAL.revisedLabel}. The date, the contact
      addresses, and {LEGAL.governingState} are placeholders.
    </p>
  );
}

export function LegalShell({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string;
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <article className="max-w-3xl">
      <PageIntro kicker={kicker} title={title} lede={lede} />
      <DraftNotice />
      <div className="mt-8 space-y-10">{children}</div>
      <nav className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-sm text-muted" aria-label="Legal">
        {PAGES.map((page) => (
          <Link key={page.href} href={page.href} className="hover:text-ink">
            {page.label}
          </Link>
        ))}
        <Link href="/methodology" className="hover:text-ink">
          Methodology
        </Link>
      </nav>
      <div className="mt-6">
        <DraftNotice />
      </div>
    </article>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 text-sm leading-7 text-muted" id={id}>
      <h2 className="font-serif text-3xl text-ink">{title}</h2>
      {children}
    </section>
  );
}
