import { createFileRoute } from "@tanstack/react-router";
import { Footer, Header } from "../index";
import { AcademyExtendedCardDetails } from "../../components/AcademyExtendedCards";
import { ViewAllAcademyHeaderNav } from "../../components/ViewAllAcademyHeaderNav";
import { readOrigin } from "../../lib/request-origin";
import {
  ACADEMY_ADVANCED_DESCRIPTION,
  ACADEMY_ADVANCED_KEYWORDS,
  ACADEMY_ADVANCED_PATH,
  ACADEMY_ADVANCED_ROBOTS,
  ACADEMY_ADVANCED_SECTIONS,
  ACADEMY_ADVANCED_SOCIAL_DESCRIPTION,
  ACADEMY_ADVANCED_SOCIAL_TITLE,
  ACADEMY_ADVANCED_TITLE,
  academyAdvancedSchema,
} from "../../lib/academy-advanced-seo";

export const Route = createFileRoute("/academy/advanced-merchant-guides")({
  loader: () => ({ origin: readOrigin() }),
  head: ({ loaderData }) => {
    const pageUrl = `${loaderData?.origin ?? ""}${ACADEMY_ADVANCED_PATH}`;
    return {
      meta: [
        { title: ACADEMY_ADVANCED_TITLE },
        { name: "title", content: ACADEMY_ADVANCED_TITLE },
        { name: "description", content: ACADEMY_ADVANCED_DESCRIPTION },
        { name: "keywords", content: ACADEMY_ADVANCED_KEYWORDS },
        { name: "robots", content: ACADEMY_ADVANCED_ROBOTS },
        { property: "og:type", content: "article" },
        { property: "og:url", content: pageUrl },
        { property: "og:title", content: ACADEMY_ADVANCED_SOCIAL_TITLE },
        { property: "og:description", content: ACADEMY_ADVANCED_SOCIAL_DESCRIPTION },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: ACADEMY_ADVANCED_SOCIAL_TITLE },
        { name: "twitter:description", content: ACADEMY_ADVANCED_SOCIAL_DESCRIPTION },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(academyAdvancedSchema(pageUrl)),
        },
      ],
    };
  },
  component: AcademyAdvancedPage,
});

function AcademyAdvancedPage() {
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
          <ViewAllAcademyHeaderNav />
          <header className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold text-accent">Payments Academy</p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{ACADEMY_ADVANCED_SOCIAL_TITLE}</h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{ACADEMY_ADVANCED_DESCRIPTION}</p>
          </header>
          <div className="mt-12 max-w-3xl space-y-10">
            {ACADEMY_ADVANCED_SECTIONS.map((section) => (
              <section id={section.id} key={section.id}>
                <h2 className="font-display text-2xl font-bold tracking-tight">{section.name}</h2>
                <AcademyExtendedCardDetails id={section.id} />
                {section.faqs.map((faq) => (
                  <div key={faq.question} id={faq.id} className="mt-4">
                    <h3 className="text-lg font-semibold">{faq.question}</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      </article>
      <Footer />
    </main>
  );
}
