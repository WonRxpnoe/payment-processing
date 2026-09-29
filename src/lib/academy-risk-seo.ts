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

export const ACADEMY_RISK_TOPICS = [
  "High-risk merchant factors, including GLP-1 and CBD",
  "Refund vs. dispute vs. chargeback",
  "MATCH database merchant record",
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
        name: "Merchant Risk, Disputes & Record Protection",
        description: ACADEMY_RISK_DESCRIPTION,
        inLanguage: "en-US",
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
              item: `${origin}/#academy`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "Merchant Risk",
              item: pageUrl,
            },
          ],
        },
      },
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        isPartOf: { "@id": webpageId },
        headline: "Merchant Risk, Disputes & Record Protection",
        description: ACADEMY_RISK_DESCRIPTION,
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
            url: `${origin}/brand/kithpay-logo.svg`,
          },
        },
      },
    ],
  };
}
