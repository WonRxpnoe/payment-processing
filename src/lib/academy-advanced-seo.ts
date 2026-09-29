export const ACADEMY_ADVANCED_PATH = "/academy/advanced-merchant-guides";

export const EXPANDED_GUIDES_LABEL = "Expanded Merchant Guides";

export const ACADEMY_ADVANCED_TITLE =
  "Advanced Merchant Payments Guide: PCI, Pricing & Subscriptions | Academy";

export const ACADEMY_ADVANCED_SOCIAL_TITLE =
  "Advanced Merchant Payments Guide: PCI, Pricing & Subscriptions";

export const ACADEMY_ADVANCED_DESCRIPTION =
  "Master advanced payment architecture: Learn about merchant accounts (ISO, Acquirer, MCC), pricing structure breakdown, shared PCI DSS compliance, and compliant recurring subscription billing.";

export const ACADEMY_ADVANCED_SOCIAL_DESCRIPTION =
  "In-depth insights on merchant accounts, fee breakdowns, outsourced PCI compliance, and recurring billing models.";

export const ACADEMY_ADVANCED_KEYWORDS =
  "merchant account architecture, payment processing fees, PCI DSS shared responsibility, recurring billing compliance, MCC classification, interchange pricing";

export const ACADEMY_ADVANCED_ROBOTS =
  "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

export const ACADEMY_ADVANCED_WEBPAGE_NAME = "Advanced Merchant Processing Academy";

export const ACADEMY_ADVANCED_WEBPAGE_DESCRIPTION =
  "In-depth educational resources covering merchant account stakeholders, pricing models, outsourced PCI DSS compliance, and subscription billing.";

export const ACADEMY_ADVANCED_SECTIONS = [
  {
    id: "merchant-accounts",
    name: "Understand Your Merchant Account Ecosystem",
    faqs: [
      {
        id: "account-approval",
        question: "Who approves a merchant account application?",
        answer:
          "The sponsoring bank (Acquirer) holds final underwriting authority. ISOs (Independent Sales Organizations) and payment processors facilitate application intake and gateway routing, but financial exposure and final account approval reside with the acquiring bank.",
      },
      {
        id: "mcc-reporting",
        question: "Why is correct Merchant Category Code (MCC) reporting critical?",
        answer:
          "Misrepresenting or misreporting an MCC (Merchant Category Code) to bypass high-risk underwriting triggers severe penalties from card schemes (Visa/Mastercard), immediate account termination, and potential placement on the MATCH list.",
      },
    ],
  },
  {
    id: "pricing",
    name: "Why Your Payment Processing Pricing Looks Like This",
    faqs: [],
  },
  {
    id: "pci-dss",
    name: "PCI DSS Compliance When Payments Are Outsourced",
    faqs: [
      {
        id: "pci-outsourcing",
        question: "Does PCI DSS apply if payment processing is outsourced to a gateway?",
        answer:
          "Yes. While outsourcing processing via hosted payment fields or iframe integrations reduces PCI scope (often qualifying for SAQ A), the merchant remains ultimately responsible for maintaining a secure environment and submitting annual compliance attestations.",
      },
    ],
  },
  {
    id: "recurring-billing",
    name: "Recurring & Subscription Billing Done Right",
    faqs: [],
  },
] as const;

export function academyAdvancedSchema(pageUrl: string) {
  const origin = new URL(pageUrl).origin;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: ACADEMY_ADVANCED_WEBPAGE_NAME,
        description: ACADEMY_ADVANCED_WEBPAGE_DESCRIPTION,
        isPartOf: {
          "@type": "WebSite",
          name: "KithPay",
          url: `${origin}/`,
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: `${origin}/`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Merchant Academy",
              item: `${origin}/academy`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: EXPANDED_GUIDES_LABEL,
              item: pageUrl,
            },
          ],
        },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#itemList`,
        name: "Advanced Merchant Knowledge Resources",
        itemListElement: ACADEMY_ADVANCED_SECTIONS.map((section, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: section.name,
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: ACADEMY_ADVANCED_SECTIONS.flatMap((section) =>
          section.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        ),
      },
    ],
  };
}
