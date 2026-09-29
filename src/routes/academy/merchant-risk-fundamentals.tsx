import { createFileRoute } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { Footer, Header } from "../index";
import {
  ACADEMY_RISK_DESCRIPTION,
  ACADEMY_RISK_KEYWORDS,
  ACADEMY_RISK_PATH,
  ACADEMY_RISK_ROBOTS,
  ACADEMY_RISK_SOCIAL_DESCRIPTION,
  ACADEMY_RISK_TITLE,
  ACADEMY_RISK_TOPICS,
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
      <nav aria-label="Breadcrumb" className="border-b border-border bg-background">
        <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-5 py-4 text-sm text-muted-foreground lg:px-8">
          <li>
            <a href="/" className="inline-flex min-h-6 items-center underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground">
              Home
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <a href="/#academy" className="inline-flex min-h-6 items-center underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground">
              Merchant Academy
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-foreground">
            Merchant Risk
          </li>
        </ol>
      </nav>
      <article className="bg-background py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <header className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold text-accent">Payments Academy</p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Merchant Risk, Disputes &amp; Record Protection
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{ACADEMY_RISK_DESCRIPTION}</p>
          </header>
          <ul className="mt-10 max-w-3xl list-disc space-y-2 pl-6 text-foreground">
            {ACADEMY_RISK_TOPICS.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </div>
      </article>
      <Footer />
    </main>
  );
}
