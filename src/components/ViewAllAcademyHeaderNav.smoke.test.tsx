/**
 * View-all academy taxonomy header — breadcrumbs and deep-dive chips.
 * Machine-only. No network. Run: npm run test:smoke
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ViewAllAcademyHeaderNav } from "./ViewAllAcademyHeaderNav";
import { academyAdvancedSchema } from "../lib/academy-advanced-seo";
import { ACADEMY_VIEW_ALL_TOPICS, academyViewAllTopicBySlug } from "../lib/academy-taxonomy";

describe("view-all academy taxonomy header", () => {
  it("renders the expanded-guide breadcrumb and crawlable topic chips", () => {
    const html = renderToStaticMarkup(<ViewAllAcademyHeaderNav />);
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/academy"');
    expect(html).toContain("Merchant Academy");
    expect(html).toContain("Expanded Merchant Guides");
    expect(html).toContain("Deep Dive Topics:");
    for (const topic of ACADEMY_VIEW_ALL_TOPICS) {
      expect(html).toContain(`href="${topic.href}"`);
      expect(html).toContain(`#${topic.label.replaceAll("&", "&amp;")}`);
    }
    expect(html).not.toContain("yourdomain.com");
    expect(html).not.toContain("bg-slate-100");
    expect(html).not.toContain("text-gray-500");
    expect(html).not.toContain("hover:text-blue-600");
  });

  it("marks the active deep-dive chip and keeps unknown slugs unresolved", () => {
    const html = renderToStaticMarkup(
      <ViewAllAcademyHeaderNav
        activeSlug="pci-dss-saq"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Merchant Academy", href: "/academy" },
          { label: "Outsourced PCI Compliance" },
        ]}
      />,
    );
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain('href="/tags/pci-dss-saq"');
    expect(html).toContain('href="/tags/merchant-account-ecosystem"');
    expect(academyViewAllTopicBySlug("missing")).toBeUndefined();
    expect(academyViewAllTopicBySlug("interchange-pricing")?.lessonHref).toBe(
      "/academy/advanced-merchant-guides#pricing",
    );
    expect(academyViewAllTopicBySlug("interchange-pricing")?.description).toContain(
      "may request an acquirer review",
    );
    expect(academyViewAllTopicBySlug("mcc-classification")?.lessonHref).toBe(
      "/academy/advanced-merchant-guides#mcc-reporting",
    );
    expect(academyViewAllTopicBySlug("merchant-account-ecosystem")?.lessonHref).toBe(
      "/academy/advanced-merchant-guides#account-approval",
    );
    expect(academyViewAllTopicBySlug("pci-dss-saq")?.lessonHref).toBe(
      "/academy/advanced-merchant-guides#pci-outsourcing",
    );
    const chipsOnly = renderToStaticMarkup(<ViewAllAcademyHeaderNav showBreadcrumb={false} />);
    expect(chipsOnly).toContain("Deep Dive Topics:");
    expect(chipsOnly).not.toContain('aria-label="Breadcrumb"');
  });

  it("publishes a breadcrumb that matches the visible expanded-guide trail", () => {
    const schema = academyAdvancedSchema("https://kithpay.example/academy/advanced-merchant-guides");
    const webpage = schema["@graph"][0] as {
      breadcrumb: { itemListElement: { name: string; item: string }[] };
    };
    expect(webpage.breadcrumb.itemListElement.map((crumb) => crumb.name)).toEqual([
      "Home",
      "Merchant Academy",
      "Expanded Merchant Guides",
    ]);
    expect(webpage.breadcrumb.itemListElement.map((crumb) => crumb.item)).toEqual([
      "https://kithpay.example/",
      "https://kithpay.example/academy",
      "https://kithpay.example/academy/advanced-merchant-guides",
    ]);
    const page = readFileSync(
      join(process.cwd(), "src/routes/academy/advanced-merchant-guides.tsx"),
      "utf8",
    );
    expect(page).toContain("<ViewAllAcademyHeaderNav />");
  });
});
