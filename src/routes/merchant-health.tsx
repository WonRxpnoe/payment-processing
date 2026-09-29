import { createFileRoute } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { MerchantHealthBody } from "../components/MerchantHealthBody";
import { MerchantHealthHeader } from "../components/MerchantHealthHeader";
import { Footer, Header } from "./index";
import {
  MERCHANT_HEALTH_DESCRIPTION,
  MERCHANT_HEALTH_FAQ,
  MERCHANT_HEALTH_KEYWORDS,
  MERCHANT_HEALTH_PATH,
  MERCHANT_HEALTH_ROBOTS,
  MERCHANT_HEALTH_SOCIAL_DESCRIPTION,
  MERCHANT_HEALTH_SOCIAL_TITLE,
  MERCHANT_HEALTH_TITLE,
  merchantHealthSchema,
} from "../lib/merchant-health-seo";

const readOrigin = createIsomorphicFn()
  .server(() => getRequestUrl({ xForwardedHost: true, xForwardedProto: true }).origin)
  .client(() => window.location.origin);

export const Route = createFileRoute("/merchant-health")({
  loader: () => ({ origin: readOrigin() }),
  head: ({ loaderData }) => {
    const pageUrl = `${loaderData?.origin ?? ""}${MERCHANT_HEALTH_PATH}`;
    return {
      meta: [
        { title: MERCHANT_HEALTH_TITLE },
        { name: "title", content: MERCHANT_HEALTH_TITLE },
        { name: "description", content: MERCHANT_HEALTH_DESCRIPTION },
        { name: "keywords", content: MERCHANT_HEALTH_KEYWORDS },
        { name: "robots", content: MERCHANT_HEALTH_ROBOTS },
        { property: "og:type", content: "article" },
        { property: "og:url", content: pageUrl },
        { property: "og:title", content: MERCHANT_HEALTH_SOCIAL_TITLE },
        { property: "og:description", content: MERCHANT_HEALTH_SOCIAL_DESCRIPTION },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: MERCHANT_HEALTH_SOCIAL_TITLE },
        { name: "twitter:description", content: MERCHANT_HEALTH_SOCIAL_DESCRIPTION },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(merchantHealthSchema(pageUrl)),
        },
      ],
    };
  },
  component: MerchantHealthPage,
});

function MerchantHealthPage() {
  return (
    <main className="min-h-screen bg-background">
      <div aria-hidden="true" className="grid h-1.5 grid-cols-4">
        <span className="bg-chart-1" />
        <span className="bg-chart-2" />
        <span className="bg-chart-3" />
        <span className="bg-chart-4" />
      </div>
      <Header />
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
          <MerchantHealthHeader currentPage className="mb-0 border-b-0 pb-0" />
        </div>
      </div>
      <MerchantHealthBody />
      <section
        id="merchant-health-faq"
        className="mx-auto max-w-5xl px-5 pb-24 lg:px-8"
        aria-labelledby="merchant-health-faq-title"
      >
        <h2 id="merchant-health-faq-title" className="text-2xl font-bold">
          Merchant Performance Review questions
        </h2>
        <dl className="mt-6 max-w-3xl space-y-6">
          {MERCHANT_HEALTH_FAQ.map((item) => (
            <div key={item.question}>
              <dt className="font-semibold">{item.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
      <Footer />
    </main>
  );
}
