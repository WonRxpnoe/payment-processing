import { ArrowUpRight } from "lucide-react";
import { ACADEMY_ADVANCED_PATH, ACADEMY_ADVANCED_SECTIONS } from "../lib/academy-advanced-seo";

export const ACADEMY_EXTENDED_CARDS = [
  {
    id: "merchant-accounts",
    module: "Module 04 • Ecosystem Infrastructure",
    title: "Understand Your Merchant Account Architecture",
    lede: "Demystifying the payment flow: Who holds underwriting power and why MCC setup matters.",
    topic: "Payment Architecture",
    badge: "bg-chart-1/10 text-chart-1",
    intro: "Navigating the roles within your merchant processing ecosystem:",
    bullets: [
      {
        label: "Key Stakeholders:",
        text: "Distinguishing Independent Sales Organizations (ISOs), Payment Processors, Acquiring Banks (Sponsor Banks), and Card Networks (Visa/Mastercard).",
      },
      {
        label: "Approval Authority:",
        text: "The acquiring bank holds final risk exposure and underwriting decision-making power—not the intermediary gateway.",
      },
      {
        label: "MCC Misrepresentation Warning:",
        text: "Merchant Category Codes (MCC) must accurately reflect business operations. Misreporting MCCs to circumvent high-risk underwriting rules results in immediate card scheme fines and merchant account termination.",
      },
    ],
  },
  {
    id: "pricing",
    module: "Module 05 • Commercial Terms & Rates",
    title: "Why Your Payment Processing Pricing Looks Like This",
    lede: "Breaking down processing fees, reserves, volume caps, and rate optimization paths.",
    topic: "Rate Structure & Costs",
    badge: "bg-chart-2/15 text-chart-2",
    intro: "Understanding the variables that shape your processing statement:",
    bullets: [
      {
        label: "Pricing Component Breakdown:",
        text: "Discount rates (Interchange-plus vs. Flat), transaction fee, monthly account maintenance, rolling reserves, monthly volume caps, Average Order Value (AOV), and payout settlement cycles.",
      },
      {
        label: "Dynamic Term Adjustments:",
        text: "Premium high-risk pricing structures are not permanent. After 90 to 180 days of stable, compliant processing, merchants may request an acquirer review. Rate changes and reserve reductions depend on card scheme regulations and acquirer-specific underwriting rules.",
      },
    ],
  },
  {
    id: "pci-dss",
    module: "Module 06 • Security & Compliance",
    title: "PCI Compliance When Payments Are Outsourced",
    lede: "Outsourcing payment processing reduces scope, but does not remove merchant PCI liability.",
    topic: "PCI DSS Security",
    badge: "bg-chart-4/10 text-chart-4",
    intro: "Clarifying the Shared Responsibility Model across payment stakeholders:",
    roles: [
      {
        label: "Merchant",
        text: "Website security, SAQ A filing, checkout domain integrity.",
      },
      {
        label: "Our Platform",
        text: "Secure tokenization, compliance routing, merchant oversight.",
      },
      {
        label: "Gateway",
        text: "Level 1 PCI vaulting, cardholder data processing.",
      },
    ],
  },
  {
    id: "recurring-billing",
    module: "Module 07 • Subscription Compliance",
    title: "Recurring & Subscription Billing Done Right",
    lede: "Card scheme rules for recurring payments, disclosures, and explicit customer consent.",
    topic: "Recurring Governance",
    badge: "bg-chart-3/15 text-chart-3",
    intro: "Key requirements to prevent subscription chargebacks and card scheme non-compliance:",
    bullets: [
      {
        label: "Compliance Elements:",
        text: "Explicit term disclosure, opt-in consent logs, renewal reminder notifications, frictionless cancellation mechanisms, clear billing descriptors, and digital proof of authorization.",
      },
      {
        label: "High-Risk Subscription Sectors:",
        text: "Specialized rule enforcement for GLP-1 telehealth plans, nutraceutical auto-ships, paid memberships, and digital adult services.",
      },
    ],
  },
] as const;

function CardBody({ card }: { card: (typeof ACADEMY_EXTENDED_CARDS)[number] }) {
  return (
    <div className="space-y-3 text-sm text-foreground">
      <p>{card.intro}</p>
      {"bullets" in card ? (
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {card.bullets.map((item) => (
            <li key={item.label}>
              <strong className="text-foreground">{item.label}</strong> {item.text}
            </li>
          ))}
        </ul>
      ) : null}
      {"roles" in card ? (
        <div className="grid grid-cols-1 gap-2 text-center text-xs sm:grid-cols-3">
          {card.roles.map((role) => (
            <div key={role.label} className="rounded-md border border-border bg-muted/60 p-2">
              <strong className="mb-1 block text-foreground">{role.label}</strong>
              <span className="text-muted-foreground">{role.text}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AcademyExtendedCardDetails({ id }: { id: string }) {
  const card = ACADEMY_EXTENDED_CARDS.find((item) => item.id === id);
  if (!card) return null;
  const section = ACADEMY_ADVANCED_SECTIONS.find((item) => item.id === id);
  const showTitle = section ? section.name !== card.title : false;
  return (
    <div className="mt-4 space-y-3">
      {showTitle ? <p className="font-semibold">{card.title}</p> : null}
      <p className="text-sm font-medium italic text-muted-foreground">{card.lede}</p>
      <CardBody card={card} />
    </div>
  );
}

export function supplementForViewAllSlug(slug: string) {
  const architecture = ACADEMY_EXTENDED_CARDS[0];
  const pricing = ACADEMY_EXTENDED_CARDS[1];
  const pci = ACADEMY_EXTENDED_CARDS[2];
  const recurring = ACADEMY_EXTENDED_CARDS[3];
  if (slug === "merchant-account-ecosystem" && "bullets" in architecture) {
    return { points: architecture.bullets.slice(0, 2) };
  }
  if (slug === "mcc-classification" && "bullets" in architecture) {
    return { points: architecture.bullets.slice(2) };
  }
  if (slug === "interchange-pricing" && "bullets" in pricing) {
    return { description: pricing.bullets[1].text, points: pricing.bullets };
  }
  if (slug === "pci-dss-saq" && "roles" in pci) {
    return { points: pci.roles };
  }
  if (slug === "subscription-billing-rules" && "bullets" in recurring) {
    return { description: recurring.bullets[0].text, points: recurring.bullets };
  }
  return undefined;
}

export function AcademyExtendedCards() {
  return (
    <section aria-labelledby="view-all-title">
      <header className="mx-auto mb-10 max-w-3xl">
        <h2 id="view-all-title" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Extended Knowledge Library: Merchant Operations
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Deep-dive guides on processing infrastructure, underwriting mechanics, compliance frameworks, and subscription governance.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {ACADEMY_EXTENDED_CARDS.map((card) => (
          <article
            key={card.id}
            className="flex flex-col justify-between rounded-lg border border-border bg-background p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <header className="mb-4">
                <span className={`inline-flex rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${card.badge}`}>
                  {card.module}
                </span>
                <h3 className="mb-2 mt-3 font-display text-xl font-bold tracking-tight">{card.title}</h3>
                <p className="text-sm font-medium italic text-muted-foreground">{card.lede}</p>
              </header>
              <div className="mb-6">
                <CardBody card={card} />
              </div>
            </div>
            <footer className="flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
              <span>Topic: {card.topic}</span>
              <a
                href={`${ACADEMY_ADVANCED_PATH}#${card.id}`}
                className="inline-flex min-h-8 items-center gap-1 font-semibold text-primary underline decoration-border underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Read full guide <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
