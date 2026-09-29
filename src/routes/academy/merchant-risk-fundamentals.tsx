import { createFileRoute } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { Footer, Header } from "../index";
import { AcademyCardDetails } from "../../components/AcademyKnowledgeCards";
import { AcademyHeaderNav } from "../../components/AcademyHeaderNav";
import {
  ACADEMY_RISK_DESCRIPTION,
  ACADEMY_RISK_KEYWORDS,
  ACADEMY_RISK_PATH,
  ACADEMY_RISK_ROBOTS,
  ACADEMY_RISK_SOCIAL_DESCRIPTION,
  ACADEMY_RISK_SECTIONS,
  ACADEMY_RISK_TITLE,
  academyRiskSchema,
} from "../../lib/academy-risk-seo";

const readOrigin = createIsomorphicFn()
  .server(() => getRequestUrl({ xForwardedHost: true, xForwardedProto: true }).origin)
  .client(() => window.location.origin);

export const Route = createFileRoute("/academy/merchant-risk-fundamentals")({
  loader: () => ({ origin: readOrigin() }),
  head: ({ loaderData }) => {
    const pageUrl = `${loaderData?.origin ?? ""}${ACADEMY_RISK_PATH}`;
    return {
      meta: [
        { title: ACADEMY_RISK_TITLE },
        { name: "title", content: ACADEMY_RISK_TITLE },
        { name: "description", content: ACADEMY_RISK_DESCRIPTION },
        { name: "keywords", content: ACADEMY_RISK_KEYWORDS },
        { name: "robots", content: ACADEMY_RISK_ROBOTS },
        { property: "og:type", content: "article" },
        { property: "og:url", content: pageUrl },
        { property: "og:title", content: ACADEMY_RISK_TITLE },
        { property: "og:description", content: ACADEMY_RISK_SOCIAL_DESCRIPTION },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: ACADEMY_RISK_TITLE },
        { name: "twitter:description", content: ACADEMY_RISK_SOCIAL_DESCRIPTION },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(academyRiskSchema(pageUrl)),
        },
      ],
    };
  },
  component: AcademyRiskPage,
});

function AcademyRiskPage() {
  return (
    <main className="min-h-screen bg-background">
      <div aria-hidden="true" className="grid h-1.5 grid-cols-4">
        <span className="bg-chart-1" />
        <span className="bg-chart-2" />
        <span className="bg-chart-3" />
        <span className="bg-chart-4" />
      </div>
      <Header />
      <article className="bg-background py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <AcademyHeaderNav />
          <header className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold text-accent">Payments Academy</p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Merchant Risk, Disputes &amp; Record Protection
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{ACADEMY_RISK_DESCRIPTION}</p>
          </header>
          <div className="mt-12 max-w-3xl space-y-10">
            {ACADEMY_RISK_SECTIONS.map((section) => (
              <section id={section.id} key={section.name}>
                <h2 className="font-display text-2xl font-bold tracking-tight">{section.name}</h2>
                <h3 className="mt-4 text-lg font-semibold">{section.question}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{section.answer}</p>
                <AcademyCardDetails id={section.id} />
              </section>
            ))}
          </div>
        </div>
      </article>
      <Footer />
    </main>
  );
}
