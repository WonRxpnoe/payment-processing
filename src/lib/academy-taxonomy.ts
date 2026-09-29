import { supplementForViewAllSlug } from "../components/AcademyExtendedCards";
import { ACADEMY_ADVANCED_PATH, ACADEMY_ADVANCED_SECTIONS } from "./academy-advanced-seo";
import { ACADEMY_PATH, ACADEMY_RISK_PATH, ACADEMY_RISK_SECTIONS } from "./academy-risk-seo";

const highRisk = ACADEMY_RISK_SECTIONS[0];
const disputes = ACADEMY_RISK_SECTIONS[1];
const merchantRecord = ACADEMY_RISK_SECTIONS[2];

export const ACADEMY_TOPICS = [
  {
    slug: "high-risk-merchant",
    label: "High-Risk Classification",
    href: "/tags/high-risk-merchant",
    lessonHref: `${ACADEMY_RISK_PATH}#${highRisk.id}`,
    description: highRisk.answer,
  },
  {
    slug: "dispute-resolution",
    label: "Dispute vs Chargeback",
    href: "/tags/dispute-resolution",
    lessonHref: `${ACADEMY_RISK_PATH}#${disputes.id}`,
    description: disputes.answer,
  },
  {
    slug: "match-list",
    label: "MATCH List & TMF",
    href: "/tags/match-list",
    lessonHref: `${ACADEMY_RISK_PATH}#${merchantRecord.id}`,
    description: merchantRecord.answer,
  },
  {
    slug: "card-not-present",
    label: "CNP Security",
    href: "/tags/card-not-present",
    lessonHref: `${ACADEMY_RISK_PATH}#${highRisk.id}`,
    description:
      "Card-not-present (CNP) transaction environments are one of the structural factors acquirers weigh when classifying a merchant as high risk.",
  },
  {
    slug: "rdr-ethoca",
    label: "Early Dispute Alerts",
    href: "/tags/rdr-ethoca",
    lessonHref: `${ACADEMY_RISK_PATH}#${disputes.id}`,
    description:
      "Early dispute alerts are grouped with dispute handling. The current lesson explains how a refund, a dispute, and a chargeback differ.",
  },
] as const;

const ecosystem = ACADEMY_ADVANCED_SECTIONS[0];
const pricing = ACADEMY_ADVANCED_SECTIONS[1];
const pci = ACADEMY_ADVANCED_SECTIONS[2];
const recurring = ACADEMY_ADVANCED_SECTIONS[3];

export const ACADEMY_VIEW_ALL_TOPICS = [
  {
    slug: "merchant-account-ecosystem",
    label: "Merchant Account Ecosystem",
    href: "/tags/merchant-account-ecosystem",
    lessonHref: `${ACADEMY_ADVANCED_PATH}#${ecosystem.faqs[0].id}`,
    description: ecosystem.faqs[0].answer,
  },
  {
    slug: "mcc-classification",
    label: "MCC Classification",
    href: "/tags/mcc-classification",
    lessonHref: `${ACADEMY_ADVANCED_PATH}#${ecosystem.faqs[1].id}`,
    description: ecosystem.faqs[1].answer,
  },
  {
    slug: "interchange-pricing",
    label: "Processing Rates & Reserves",
    href: "/tags/interchange-pricing",
    lessonHref: `${ACADEMY_ADVANCED_PATH}#${pricing.id}`,
    description: supplementForViewAllSlug("interchange-pricing")?.description ?? pricing.name,
  },
  {
    slug: "pci-dss-saq",
    label: "Outsourced PCI Compliance",
    href: "/tags/pci-dss-saq",
    lessonHref: `${ACADEMY_ADVANCED_PATH}#${pci.faqs[0].id}`,
    description: pci.faqs[0].answer,
  },
  {
    slug: "subscription-billing-rules",
    label: "Recurring Billing Rules",
    href: "/tags/subscription-billing-rules",
    lessonHref: `${ACADEMY_ADVANCED_PATH}#${recurring.id}`,
    description: supplementForViewAllSlug("subscription-billing-rules")?.description ?? recurring.name,
  },
] as const;

export function academyTopicBySlug(slug: string) {
  return ACADEMY_TOPICS.find((topic) => topic.slug === slug);
}

export function academyViewAllTopicBySlug(slug: string) {
  return ACADEMY_VIEW_ALL_TOPICS.find((topic) => topic.slug === slug);
}

export const ACADEMY_HUB = {
  label: "Merchant Academy",
  href: ACADEMY_PATH,
};
