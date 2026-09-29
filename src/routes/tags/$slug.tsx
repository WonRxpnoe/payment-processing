import { createFileRoute, notFound } from "@tanstack/react-router";
import { MerchantHealthHeader } from "../../components/MerchantHealthHeader";
import { AcademyHeaderNav } from "../../components/AcademyHeaderNav";
import { supplementForViewAllSlug } from "../../components/AcademyExtendedCards";
import { ViewAllAcademyHeaderNav } from "../../components/ViewAllAcademyHeaderNav";
import { MERCHANT_HEALTH_PATH } from "../../lib/merchant-health-seo";
import { readOrigin } from "../../lib/request-origin";
import { ACADEMY_HUB, academyTopicBySlug, academyViewAllTopicBySlug } from "../../lib/academy-taxonomy";
import {
  MERCHANT_RESOURCES_LABEL,
  MERCHANT_RESOURCES_PATH,
  TAXONOMY_ROBOTS,
  breadcrumbListSchema,
  topicBySlug,
} from "../../lib/merchant-taxonomy";
import { Footer, Header } from "../index";

function resolveTopic(slug: string) {
  const merchant = topicBySlug(slug);
  if (merchant) {
    return {
      slug: merchant.slug,
      label: merchant.label,
      href: merchant.href,
      description: merchant.description,
      lessonHref: `${MERCHANT_HEALTH_PATH}#${merchant.anchor}`,
      lessonLabel: "Read in the Merchant Health Engine",
      hubLabel: MERCHANT_RESOURCES_LABEL,
      hubPath: MERCHANT_RESOURCES_PATH,
      furtherReading: merchant.furtherReading,
      academy: false,
      viewAll: false,
    };
  }
  const academy = academyTopicBySlug(slug);
  if (academy) {
    return {
      slug: academy.slug,
      label: academy.label,
      href: academy.href,
      description: academy.description,
      lessonHref: academy.lessonHref,
      lessonLabel: "Read in Payments Academy",
      hubLabel: ACADEMY_HUB.label,
      hubPath: ACADEMY_HUB.href,
      furtherReading: undefined,
      academy: true,
      viewAll: false,
    };
  }
  const viewAll = academyViewAllTopicBySlug(slug);
  if (!viewAll) return undefined;
  return {
    slug: viewAll.slug,
    label: viewAll.label,
    href: viewAll.href,
    description: viewAll.description,
    lessonHref: viewAll.lessonHref,
    lessonLabel: "Read in Payments Academy",
    hubLabel: ACADEMY_HUB.label,
    hubPath: ACADEMY_HUB.href,
    furtherReading: undefined,
    academy: true,
    viewAll: true,
  };
}

export const Route = createFileRoute("/tags/$slug")({
  loader: ({ params }) => {
    const topic = resolveTopic(params.slug);
    if (!topic) throw notFound();
    return { origin: readOrigin(), topic };
  },
  head: ({ loaderData }) => {
    const topic = loaderData?.topic;
    const origin = loaderData?.origin ?? "";
    const pageUrl = `${origin}${topic?.href ?? ""}`;
    const title = topic ? `${topic.label} | KithPay` : "Merchant Resources | KithPay";
    const description = topic?.description ?? "";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: TAXONOMY_ROBOTS },
        { property: "og:type", content: "article" },
        { property: "og:url", content: pageUrl },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbListSchema([
              { name: "Home", item: `${origin}/` },
              { name: topic?.hubLabel ?? "", item: `${origin}${topic?.hubPath ?? ""}` },
              { name: topic?.label ?? "", item: pageUrl },
            ]),
          ),
        },
      ],
    };
  },
  component: TagPage,
});

function TagPage() {
  const { topic } = Route.useLoaderData();
  const points = topic.viewAll ? supplementForViewAllSlug(topic.slug)?.points : undefined;
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
          {topic.viewAll ? (
            <ViewAllAcademyHeaderNav
              activeSlug={topic.slug}
              className="mb-0 border-b-0 pb-0"
              crumbs={[
                { label: "Home", href: "/" },
                { label: topic.hubLabel, href: topic.hubPath },
                { label: topic.label },
              ]}
            />
          ) : topic.academy ? (
            <AcademyHeaderNav
              activeSlug={topic.slug}
              className="mb-0 border-b-0 pb-0"
              crumbs={[
                { label: "Home", href: "/" },
                { label: topic.hubLabel, href: topic.hubPath },
                { label: topic.label },
              ]}
            />
          ) : (
            <MerchantHealthHeader
              activeSlug={topic.slug}
              className="mb-0 border-b-0 pb-0"
              crumbs={[
                { label: "Home", href: "/" },
                { label: topic.hubLabel, href: topic.hubPath },
                { label: topic.label },
              ]}
            />
          )}
        </div>
      </div>
      <article className="bg-background py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <header className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold text-accent">Related topic</p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {topic.label}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {topic.description}
            </p>
          </header>
          {points ? (
            <ul className="mt-8 max-w-3xl list-disc space-y-2 pl-5 text-muted-foreground">
              {points.map((point) => (
                <li key={point.label}>
                  <strong className="text-foreground">{point.label}</strong> {point.text}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-10 flex max-w-3xl flex-col items-start gap-4">
            <a
              href={topic.lessonHref}
              className="inline-flex min-h-8 items-center text-sm font-semibold text-primary underline decoration-border underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {topic.lessonLabel}
            </a>
            {topic.furtherReading ? (
              <a
                href={topic.furtherReading.href}
                className="inline-flex min-h-8 items-center text-sm font-semibold text-primary underline decoration-border underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {topic.furtherReading.label}
              </a>
            ) : null}
          </div>
        </div>
      </article>
      <Footer />
    </main>
  );
}
