import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { ACADEMY_RISK_PATH } from "../lib/academy-risk-seo";

export const ACADEMY_CARDS = [
  {
    id: "high-risk",
    module: "Module 01 • Risk Vectors",
    title: "What Makes a Merchant High Risk?",
    lede: "High risk is a composite evaluation vector, not a single permanent verdict.",
    topic: "Risk Underwriting",
    badge: "bg-chart-1/10 text-chart-1",
    intro: "Risk classification is determined by a combination of operational and structural variables:",
    bullets: [
      {
        label: "Risk Drivers:",
        text: "Industry vertical, evolving regulations, chargeback frequency, fraud exposure, fulfillment lead times, recurring subscriptions, financial stability, brand reputation, and Card-Not-Present (CNP) processing environments.",
      },
      {
        label: "Vertical Nuances:",
        text: "Emerging sectors such as GLP-1 weight-loss medications, CBD products, and adult novelties carry distinct risk profiles due to differing legal and card scheme compliance burdens.",
      },
      {
        label: "Key Takeaway:",
        text: 'An industry classification of "high risk" does not imply poor operational management by the individual business.',
      },
    ],
  },
  {
    id: "refund-dispute-chargeback",
    module: "Module 02 • Dispute Mechanics",
    title: "Refund vs. Dispute vs. Chargeback",
    lede: "Understanding the escalation funnel from customer resolution to card network debit.",
    topic: "Dispute Lifecycle",
    badge: "bg-chart-3/15 text-chart-3",
    steps: [
      {
        label: "Refund:",
        text: "Direct, amicable resolution between merchant and buyer before bank intervention.",
      },
      {
        label: "Dispute:",
        text: "Cardholder requests their issuing bank to question or investigate a line item.",
      },
      {
        label: "Chargeback:",
        text: "Formal card scheme process where funds are forcibly debited from the merchant account.",
      },
    ],
    calloutLabel: "Dispute Prevention Checklist:",
    callout:
      "Clear billing descriptors, explicit refund & cancellation policies, accessible customer support, pre-billing renewal notifications, tracking records, and Early Dispute Alert networks (Ethoca / RDR).",
  },
  {
    id: "merchant-record",
    module: "Module 03 • Account Protection",
    title: "Protect Your Merchant Record",
    lede: "Safeguard your payment processing history and prevent improper MATCH/TMF listings.",
    topic: "Account Governance",
    badge: "bg-chart-4/10 text-chart-4",
    intro:
      "When encountering unrecognized transactions, risk/compliance alerts, or account termination warnings:",
    bullets: [
      {
        label: "Immediate Action:",
        text: "Contact our risk team immediately and retain your Case Number, email correspondence, and transaction documentation.",
      },
      {
        label: "Record Audit:",
        text: "Operational dispute resolution with customers does NOT automatically rectify system-level acquiring database records.",
      },
      {
        label: "MATCH List Governance:",
        text: "MATCH (Member Alert to Control High-Risk) is presented here as an introductory industry compliance concept. Individual mislabeling cases and dispute escalations are processed privately off-page.",
      },
    ],
  },
] as const;

function CardBody({ card }: { card: (typeof ACADEMY_CARDS)[number] }) {
  return (
    <div className="space-y-3 text-sm text-foreground">
      {"intro" in card ? <p>{card.intro}</p> : null}
      {"bullets" in card ? (
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {card.bullets.map((item) => (
            <li key={item.label}>
              <strong className="text-foreground">{item.label}</strong>{" "}
              {item.label === "Immediate Action:" ? (
                <>
                  Contact our{" "}
                  <a href="/#diagnostic" className="font-semibold text-primary underline decoration-border underline-offset-4 hover:decoration-primary">
                    risk team
                  </a>{" "}
                  immediately and retain your Case Number, email correspondence, and transaction documentation.
                </>
              ) : (
                item.text
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {"steps" in card ? (
        <ul className="space-y-2">
          {card.steps.map((step) => (
            <li key={step.label} className="rounded-md border border-border bg-muted/60 p-2.5">
              <strong>{step.label}</strong> {step.text}
            </li>
          ))}
        </ul>
      ) : null}
      {"callout" in card ? (
        <p className="rounded-md border border-chart-3/30 bg-chart-3/10 p-2.5 text-xs text-foreground">
          <strong>{card.calloutLabel}</strong> {card.callout}
        </p>
      ) : null}
    </div>
  );
}

export function AcademyCardDetails({ id }: { id: string }) {
  const card = ACADEMY_CARDS.find((item) => item.id === id);
  if (!card) return null;
  return (
    <div className="mt-4">
      <CardBody card={card} />
    </div>
  );
}

export function AcademyKnowledgeCards({ action }: { action?: ReactNode }) {
  return (
    <div>
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-3xl">
          <h2 id="academy-section-title" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Payments Academy: Core Knowledge Cards
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Essential guidance on risk classification, dispute lifecycle mechanics, and protecting your acquiring record.
          </p>
        </div>
        {action}
      </header>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {ACADEMY_CARDS.map((card) => (
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
                href={`${ACADEMY_RISK_PATH}#${card.id}`}
                className="inline-flex min-h-8 items-center gap-1 font-semibold text-primary underline decoration-border underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Learn more <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
