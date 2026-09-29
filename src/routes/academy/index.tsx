import { createFileRoute } from "@tanstack/react-router";
import { Footer, Header } from "../index";
import { ACADEMY_PATH } from "../../lib/academy-risk-seo";
import { readOrigin } from "../../lib/request-origin";
import { AcademyHeaderNav } from "../../components/AcademyHeaderNav";
import { AcademyExtendedCards } from "../../components/AcademyExtendedCards";
import { AcademyKnowledgeCards } from "../../components/AcademyKnowledgeCards";
import { ViewAllAcademyHeaderNav } from "../../components/ViewAllAcademyHeaderNav";

export const Route = createFileRoute("/academy/")({
  loader: () => ({ origin: readOrigin() }),
  head: ({ loaderData }) => {
    const pageUrl = `${loaderData?.origin ?? ""}${ACADEMY_PATH}`;
    const description =
      "Payment lessons for merchants on risk, disputes, merchant records, account architecture, processing pricing, outsourced PCI, and recurring billing.";
    return {
      meta: [
        { title: "Merchant Academy | KithPay" },
        { name: "description", content: description },
        { property: "og:title", content: "Merchant Academy | KithPay" },
        { property: "og:description", content: description },
        { property: "og:url", content: pageUrl },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Merchant Academy | KithPay" },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
    };
  },
  component: AcademyIndexPage,
});

function AcademyIndexPage() {
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
          <li aria-current="page" className="font-semibold text-foreground">
            Merchant Academy
          </li>
        </ol>
      </nav>
      <section className="bg-card py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-accent">Payments Academy</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Learn to run it right.</h1>
          <section aria-labelledby="academy-section-title" className="mt-12">
            <AcademyHeaderNav showBreadcrumb={false} className="mb-8" />
            <AcademyKnowledgeCards />
          </section>
          <div className="mt-16">
            <ViewAllAcademyHeaderNav showBreadcrumb={false} />
            <AcademyExtendedCards />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
