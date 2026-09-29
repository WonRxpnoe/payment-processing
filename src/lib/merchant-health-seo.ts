import {
  MERCHANT_HEALTH_ENGINE_LABEL,
  MERCHANT_RESOURCES_LABEL,
  MERCHANT_RESOURCES_PATH,
} from "./merchant-taxonomy";

export const MERCHANT_HEALTH_PATH = "/merchant-health";

export const MERCHANT_HEALTH_TITLE =
  "Merchant Health & Performance Review: Optimize Payment Terms | KithPay";

export const MERCHANT_HEALTH_SOCIAL_TITLE =
  "Merchant Health & Performance Review: Optimize Payment Terms";

export const MERCHANT_HEALTH_DESCRIPTION =
  "Learn how acquiring banks evaluate new merchants and how a 90-day to 6-month Merchant Performance Review can lead to lower processing rates, reduced rolling reserves, and faster settlement cycles.";

export const MERCHANT_HEALTH_SOCIAL_DESCRIPTION =
  "Why do new merchants start with conservative payment terms? Discover the 90-day review roadmap to lower rates and release reserves.";

export const MERCHANT_HEALTH_KEYWORDS =
  "Merchant Performance Review, Merchant Account Health, Lowering Payment Processing Fees, Rolling Reserve Reduction, Chargeback Ratio Management, Acquirer Review Criteria";

export const MERCHANT_HEALTH_ROBOTS =
  "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

export const MERCHANT_HEALTH_LOGO_PATH = "/brand/kithpay-logo.svg";

export const MERCHANT_HEALTH_FAQ = [
  {
    question: "Why do new merchants receive conservative payment processing terms?",
    answer:
      "New merchants lack an established processing history with acquirers. To mitigate risk, acquiring banks apply conservative terms such as higher processing fees, lower monthly volume limits, rolling reserves, slower payout schedules, and enhanced compliance oversight.",
  },
  {
    question: "Can initial processing terms be renegotiated after launching?",
    answer:
      "Initial processing terms are not permanent. After 3 to 6 months of stable, compliant processing, merchants may request an acquirer review. Lower rates, reserve changes, higher volume caps, and faster settlement depend on card scheme regulations and acquirer-specific underwriting rules.",
  },
  {
    question: "What metrics are audited during a Merchant Performance Review?",
    answer:
      "Acquirers analyze key metrics over 90-day and 6-month windows, including chargeback rates, refund ratios, fraud dispute reason codes, processing volume relative to approved limits, Average Order Value (AOV) consistency, and fulfillment timelines.",
  },
] as const;

export function merchantHealthSchema(pageUrl: string) {
  const origin = new URL(pageUrl).origin;
  const webpageId = `${pageUrl}#webpage`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": webpageId,
        url: pageUrl,
        name: "Merchant Health & Performance Review",
        description:
          "Comprehensive operational guide for high-risk and standard merchants to improve payment processing terms.",
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
              name: MERCHANT_RESOURCES_LABEL,
              item: `${origin}${MERCHANT_RESOURCES_PATH}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: MERCHANT_HEALTH_ENGINE_LABEL,
              item: pageUrl,
            },
          ],
        },
      },
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        isPartOf: { "@id": webpageId },
        headline: "Merchant Health & Performance Review: Scaling Your Payment Setup",
        description:
          "Detailed insights into why initial merchant terms are conservative and how a 90-day to 6-month performance review helps renegotiate acquirer terms.",
        inLanguage: "en-US",
        mainEntityOfPage: pageUrl,
        author: {
          "@type": "Organization",
          name: "KithPay",
        },
        publisher: {
          "@type": "Organization",
          name: "KithPay",
          logo: {
            "@type": "ImageObject",
            url: `${origin}${MERCHANT_HEALTH_LOGO_PATH}`,
          },
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: MERCHANT_HEALTH_FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}
