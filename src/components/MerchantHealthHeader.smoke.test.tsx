/**
 * Taxonomy header — breadcrumbs, topic chips, and crawlable hub links.
 * Machine-only. No network. Run: npm run test:smoke
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MerchantHealthHeader } from "./MerchantHealthHeader";
import { merchantHealthSchema } from "../lib/merchant-health-seo";
import { ACADEMY_RISK_PATH } from "../lib/academy-risk-seo";
import { MERCHANT_TOPICS, breadcrumbListSchema, topicBySlug } from "../lib/merchant-taxonomy";

describe("merchant health taxonomy header", () => {
  it("renders a current breadcrumb and crawlable topic chips without processing rates", () => {
    const html = renderToStaticMarkup(<MerchantHealthHeader currentPage />);

    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/resources"');
    expect(html).toContain("Merchant Resources");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Merchant Health Engine");
    expect(html).toContain("Related Topics:");
    for (const topic of MERCHANT_TOPICS) {
      expect(html).toContain(`href="${topic.href}"`);
      expect(html).toContain(`#${topic.label}`);
      expect(topic.description).not.toMatch(/\d+(\.\d+)?%/);
      expect(topic.description.toLowerCase()).not.toContain("calculator");
    }
    expect(html).not.toMatch(/\d+(\.\d+)?%/);
    expect(html.toLowerCase()).not.toContain("calculator");
  });

  it("links the engine crumb when the reader is still on the homepage", () => {
    const html = renderToStaticMarkup(<MerchantHealthHeader />);
    expect(html).toContain('href="/merchant-health"');
    expect(html).not.toContain('aria-current="page"');
  });

  it("marks the active topic chip on a tag page", () => {
    const html = renderToStaticMarkup(
      <MerchantHealthHeader
        activeSlug="rolling-reserve"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Merchant Resources", href: "/resources" },
          { label: "Rolling Reserves" },
        ]}
      />,
    );
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain('href="/tags/rolling-reserve"');
    expect(html).toContain('href="/tags/merchant-risk"');
  });

  it("publishes a three-level breadcrumb and real topic routes", () => {
    const schema = merchantHealthSchema("https://kithpay.example/merchant-health");
    const webpage = schema["@graph"][0] as {
      breadcrumb: { itemListElement: { name: string; item: string; position: number }[] };
    };
    const crumbs = webpage.breadcrumb.itemListElement;
    expect(crumbs.map((crumb) => crumb.name)).toEqual([
      "Home",
      "Merchant Resources",
      "Merchant Health Engine",
    ]);
    expect(crumbs.map((crumb) => crumb.item)).toEqual([
      "https://kithpay.example/",
      "https://kithpay.example/resources",
      "https://kithpay.example/merchant-health",
    ]);

    expect(topicBySlug("missing")).toBeUndefined();
    expect(topicBySlug("merchant-risk")?.furtherReading?.href).toBe(ACADEMY_RISK_PATH);
    expect(topicBySlug("payout-schedules")?.anchor).toBe("payout-schedules");

    const list = breadcrumbListSchema([
      { name: "Home", item: "https://kithpay.example/" },
      { name: "Merchant Resources", item: "https://kithpay.example/resources" },
    ]);
    expect(list.itemListElement[1]?.position).toBe(2);

    const resources = readFileSync(join(process.cwd(), "src/routes/resources.tsx"), "utf8");
    const tag = readFileSync(join(process.cwd(), "src/routes/tags/$slug.tsx"), "utf8");
    expect(resources).toContain('createFileRoute("/resources")');
    expect(resources).not.toMatch(/\d+(\.\d+)?%/);
    expect(tag).toContain('createFileRoute("/tags/$slug")');
    expect(tag).toContain("notFound()");
    expect(tag).toContain("MERCHANT_HEALTH_PATH}#${merchant.anchor}");
  });
});
