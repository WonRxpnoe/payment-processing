import { ACADEMY_RISK_PATH } from "./academy-risk-seo";

export const MERCHANT_RESOURCES_PATH = "/resources";

export const MERCHANT_RESOURCES_LABEL = "Merchant Resources";

export const MERCHANT_HEALTH_ENGINE_LABEL = "Merchant Health Engine";

export const TAXONOMY_ROBOTS =
  "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

export type MerchantTopic = {
  slug: string;
  label: string;
  href: string;
  anchor: string;
  description: string;
  furtherReading?: { href: string; label: string };
};

export const MERCHANT_TOPICS: readonly MerchantTopic[] = [
  {
    slug: "merchant-risk",
    label: "Merchant Risk Management",
    href: "/tags/merchant-risk",
    anchor: "merchant-risk",
    description:
      "How acquirers read merchant risk, and which account signals they review before changing processing terms.",
    furtherReading: {
      href: ACADEMY_RISK_PATH,
      label: "Merchant Risk, Disputes & Record Protection",
    },
  },
  {
    slug: "rolling-reserve",
    label: "Rolling Reserves",
    href: "/tags/rolling-reserve",
    anchor: "rolling-reserves",
    description:
      "Why a rolling reserve is applied on new merchant accounts, and how a performance review can change that hold.",
  },
  {
    slug: "chargeback-mitigation",
    label: "Chargeback Mitigation",
    href: "/tags/chargeback-mitigation",
    anchor: "chargeback-mitigation",
    description:
      "How dispute ratios and reason codes factor into merchant account health and the monthly review.",
  },
  {
    slug: "acquirer-underwriting",
    label: "Acquirer Underwriting",
    href: "/tags/acquirer-underwriting",
    anchor: "acquirer-underwriting",
    description:
      "What acquiring banks look at during underwriting and at later performance reviews.",
  },
  {
    slug: "payout-schedules",
    label: "Settlement Cycles",
    href: "/tags/payout-schedules",
    anchor: "payout-schedules",
    description:
      "How settlement timing is set for new merchants, and when a review can move payouts to a faster cycle.",
  },
];

export function topicBySlug(slug: string) {
  return MERCHANT_TOPICS.find((topic) => topic.slug === slug);
}

export function breadcrumbListSchema(items: readonly { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}
