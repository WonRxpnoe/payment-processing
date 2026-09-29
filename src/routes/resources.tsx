import { createFileRoute } from "@tanstack/react-router";
import { MerchantHealthHeader } from "../components/MerchantHealthHeader";
import { MERCHANT_HEALTH_PATH } from "../lib/merchant-health-seo";
import { readOrigin } from "../lib/request-origin";
import {
  MERCHANT_RESOURCES_LABEL,
  MERCHANT_RESOURCES_PATH,
  MERCHANT_TOPICS,
  TAXONOMY_ROBOTS,
  breadcrumbListSchema,
} from "../lib/merchant-taxonomy";
import { Footer, Header } from "./index";

const RESOURCES_TITLE = "Merchant Resources | KithPay";
const RESOURCES_DESCRIPTION =
  "Guides and topics for merchant account health, risk management, rolling reserves, chargebacks, acquirer underwriting, and settlement cycles.";

export const Route = createFileRoute("/resources")({
  loader: () => ({ origin: readOrigin() }),
  head: ({ loaderData }) => {
    const pageUrl = `${loaderData?.origin ?? ""}${MERCHANT_RESOURCES_PATH}`;
    const origin = loaderData?.origin ?? "";
    return {
      meta: [
        { title: RESOURCES_TITLE },
        { name: "description", content: RESOURCES_DESCRIPTION },
        { name: "robots", content: TAXONOMY_ROBOTS },
        { property: "og:type", content: "website" },
        { property: "og:url", content: pageUrl },
        { property: "og:title", content: RESOURCES_TITLE },
        { property: "og:description", content: RESOURCES_DESCRIPTION },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: RESOURCES_TITLE },
        { name: "twitter:description", content: RESOURCES_DESCRIPTION },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbListSchema([
              { name: "Home", item: `${origin}/` },
              { name: MERCHANT_RESOURCES_LABEL, item: pageUrl },
            ]),
          ),
        },
      ],
    };
  },
  component: ResourcesPage,
});

function ResourcesPage() {
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
          <MerchantHealthHeader
            className="mb-0 border-b-0 pb-0"
            crumbs={[{ label: "Home", href: "/" }, { label: MERCHANT_RESOURCES_LABEL }]}
          />
        </div>
      </div>
      <section className="bg-background py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <header className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold text-accent">Merchant resources</p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {MERCHANT_RESOURCES_LABEL}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {RESOURCES_DESCRIPTION}
            </p>
          </header>
          <ul className="mt-10 max-w-3xl space-y-6">
            <li>
              <a
                href={MERCHANT_HEALTH_PATH}
                className="inline-flex min-h-8 items-center text-sm font-semibold text-primary underline decoration-border underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Merchant Health Engine
              </a>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                How new merchants start on conservative terms, and what a performance review can
                change.
              </p>
            </li>
            {MERCHANT_TOPICS.map((topic) => (
              <li key={topic.slug} id={topic.anchor}>
                <a
                  href={topic.href}
                  className="inline-flex min-h-8 items-center text-sm font-semibold text-primary underline decoration-border underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  #{topic.label}
                </a>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {topic.description}
                </p>
                {topic.furtherReading ? (
                  <a
                    href={topic.furtherReading.href}
                    className="mt-2 inline-flex min-h-6 items-center text-sm text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {topic.furtherReading.label}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Footer />
    </main>
  );
}
