/**
 * Academy taxonomy header — breadcrumbs and topic chips.
 * Machine-only. No network. Run: npm run test:smoke
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AcademyHeaderNav } from "./AcademyHeaderNav";
import { academyRiskSchema } from "../lib/academy-risk-seo";
import { ACADEMY_TOPICS, academyTopicBySlug } from "../lib/academy-taxonomy";

describe("academy taxonomy header", () => {
  it("renders the article breadcrumb and crawlable topic chips", () => {
    const html = renderToStaticMarkup(<AcademyHeaderNav />);
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/academy"');
    expect(html).toContain("Merchant Academy");
    expect(html).toContain("Risk &amp; Compliance Essentials");
    expect(html).toContain("Academy Topics:");
    for (const topic of ACADEMY_TOPICS) {
      expect(html).toContain(`href="${topic.href}"`);
      expect(html).toContain(`#${topic.label.replaceAll("&", "&amp;")}`);
    }
    expect(html).not.toContain("yourdomain.com");
    expect(html).not.toContain("bg-slate-100");
    expect(html).not.toContain("text-gray-500");
    const chipsOnly = renderToStaticMarkup(<AcademyHeaderNav showBreadcrumb={false} />);
    expect(chipsOnly).toContain("Academy Topics:");
    expect(chipsOnly).not.toContain('aria-label="Breadcrumb"');
  });

  it("marks the active academy chip and keeps unknown slugs unresolved", () => {
    const html = renderToStaticMarkup(
      <AcademyHeaderNav
        activeSlug="match-list"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Merchant Academy", href: "/academy" },
          { label: "MATCH List & TMF" },
        ]}
      />,
    );
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain('href="/tags/match-list"');
    expect(html).toContain('href="/tags/high-risk-merchant"');
    expect(academyTopicBySlug("missing")).toBeUndefined();
    expect(academyTopicBySlug("rdr-ethoca")?.lessonHref).toBe(
      "/academy/merchant-risk-fundamentals#refund-dispute-chargeback",
    );
  });

  it("publishes a breadcrumb that matches the visible academy trail", () => {
    const schema = academyRiskSchema("https://kithpay.example/academy/merchant-risk-fundamentals");
    const webpage = schema["@graph"][0] as {
      breadcrumb: { itemListElement: { name: string; item: string }[] };
    };
    expect(webpage.breadcrumb.itemListElement.map((crumb) => crumb.name)).toEqual([
      "Home",
      "Merchant Academy",
      "Risk & Compliance Essentials",
    ]);
    expect(webpage.breadcrumb.itemListElement.map((crumb) => crumb.item)).toEqual([
      "https://kithpay.example/",
      "https://kithpay.example/academy",
      "https://kithpay.example/academy/merchant-risk-fundamentals",
    ]);
    const page = readFileSync(
      join(process.cwd(), "src/routes/academy/merchant-risk-fundamentals.tsx"),
      "utf8",
    );
    expect(page).toContain("<AcademyHeaderNav />");
    expect(page).toContain('id={section.id}');
  });
});
