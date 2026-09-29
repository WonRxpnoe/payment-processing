export const ACADEMY_PATH = "/academy";

export const ACADEMY_RISK_PATH = "/academy/merchant-risk-fundamentals";

export const ACADEMY_RISK_TITLE =
  "Merchant Risk, Disputes & Record Protection | Payments Academy";

export const ACADEMY_RISK_DESCRIPTION =
  "Master payment fundamentals: Understand high-risk merchant factors (GLP-1, CBD), differentiate refund vs. dispute vs. chargeback, and learn how to protect your MATCH database merchant record.";

export const ACADEMY_RISK_SOCIAL_DESCRIPTION =
  "Understand what makes a merchant high-risk, navigate chargeback mechanics, and safeguard your merchant history from MATCH listing.";

export const ACADEMY_RISK_KEYWORDS =
  "high risk merchant account, refund vs chargeback, dispute management, MATCH list merchant, payment processor termination, card scheme compliance";

export const ACADEMY_RISK_ROBOTS =
  "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

export const ACADEMY_RISK_SECTIONS = [
  {
    id: "high-risk",
    name: "What Makes a Merchant High Risk?",
    question: "What makes a business classified as a high-risk merchant?",
    answer:
      "High risk is a composite evaluation rather than a single verdict. Risk drivers include industry vertical, regulatory scrutinies (e.g., GLP-1, CBD, adult products), card-not-present (CNP) transaction environments, recurring subscription billing, fulfillment lead times, and chargeback history. High-risk classification reflects structural payment risk rather than poor operational quality.",
  },
  {
    id: "refund-dispute-chargeback",
    name: "Refund vs. Dispute vs. Chargeback",
    question: "What is the difference between a refund, a dispute, and a chargeback?",
    answer:
      "A refund is resolved directly between the merchant and the customer. A dispute occurs when a cardholder asks their issuing bank to question a transaction. A chargeback enters official card network dispute resolution channels where funds are forcibly debited from the merchant.",
  },
  {
    id: "merchant-record",
    name: "Protect Your Merchant Record",
    question: "What is the MATCH list in merchant processing?",
    answer:
      "The MATCH (Member Alert to Control High-Risk) list is an industry database maintained by Mastercard used by acquirers to track terminated merchant accounts. Placement on MATCH severely limits a business's ability to obtain payment processing.",
  },
] as const;

export function academyRiskSchema(pageUrl: string) {
  const origin = new URL(pageUrl).origin;
  const webpageId = `${pageUrl}#webpage`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": webpageId,
        url: pageUrl,
        name: "Merchant Risk & Payment Fundamentals Academy",
        description:
          "Educational guide detailing high-risk classification vectors, dispute mechanics, and merchant record protection protocols.",
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
              item: `${origin}${ACADEMY_PATH}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "Risk & Compliance Essentials",
              item: pageUrl,
            },
          ],
        },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#itemList`,
        name: "Merchant Risk & Payment Management Essentials",
        itemListElement: ACADEMY_RISK_SECTIONS.map((section, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: section.name,
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: ACADEMY_RISK_SECTIONS.map((section) => ({
          "@type": "Question",
          name: section.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: section.answer,
          },
        })),
      },
    ],
  };
}
