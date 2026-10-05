/**
 * Copy for the rendered share cards.
 *
 * Deliberately import-free: scripts/generate-brand-assets.mjs loads this file
 * directly through Node's TypeScript support, which does not resolve the
 * extensionless relative imports the rest of src/lib uses.
 *
 * Each title is the page's own social title with the brand suffix removed —
 * the card already shows the logo. social-image.smoke.test.tsx fails if a
 * card and its page drift apart.
 */
export type SocialCard = {
  /** File name inside public/og. */
  file: string;
  title: string;
  description: string;
};

export const SOCIAL_CARDS = {
  home: {
    file: "kithpay-og.png",
    title: "Payment Infrastructure for High-Risk Merchants",
    description:
      "Stable, transparent payment processing for high-risk businesses — with the guidance to grow safely.",
  },
  merchantHealth: {
    file: "og-merchant-health.png",
    title: "Merchant Health & Performance Review: Optimize Payment Terms",
    description:
      "Why do new merchants start with conservative payment terms? Discover the 90-day review roadmap to lower rates and release reserves.",
  },
  academy: {
    file: "og-academy.png",
    title: "Merchant Academy",
    description:
      "Payment lessons for merchants on risk, disputes, merchant records, account architecture, processing pricing, outsourced PCI, and recurring billing.",
  },
  academyRisk: {
    file: "og-academy-risk.png",
    title: "Merchant Risk, Disputes & Record Protection",
    description:
      "Understand what makes a merchant high-risk, navigate chargeback mechanics, and safeguard your merchant history from MATCH listing.",
  },
  academyAdvanced: {
    file: "og-academy-advanced.png",
    title: "Advanced Merchant Payments Guide: PCI, Pricing & Subscriptions",
    description:
      "In-depth insights on merchant accounts, fee breakdowns, outsourced PCI compliance, and recurring billing models.",
  },
  resources: {
    file: "og-resources.png",
    title: "Merchant Resources",
    description:
      "Guides and topics for merchant account health, risk management, rolling reserves, chargebacks, acquirer underwriting, and settlement cycles.",
  },
} as const satisfies Record<string, SocialCard>;

export type SocialCardVariant = keyof typeof SOCIAL_CARDS;
