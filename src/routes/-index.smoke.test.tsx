/**
 * Homepage iterations — smoke mock.
 * Machine-only: the thicken pass and the gap-fill pass after the last scan.
 * No network. Run: npm run test:smoke
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "src/routes/index.tsx"), "utf8");

function sliceBetween(startMark: string, endMark: string): string {
  const start = source.indexOf(startMark);
  expect(start, startMark).toBeGreaterThanOrEqual(0);
  const end = source.indexOf(endMark, start);
  expect(end, endMark).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("homepage iteration — thicken", () => {
  it("gives the color bar, route line, and chart stroke more body", () => {
    expect(source).toContain('className="grid h-1.5 grid-cols-4"');
    expect(source).toContain("top-[17px] h-0.5 bg-border");
    expect(source).toContain("top-[17px] h-0.5 bg-accent");
    expect(source).toContain('strokeWidth="4"');
    expect(source).not.toContain('strokeWidth="3"');
    expect(source).not.toContain("top-[18px] h-px");
  });

  it("thickens icons, protection rings, and academy placeholder bars", () => {
    const trust = sliceBetween("function TrustBand", "function EducationSection");
    expect(trust).toContain("size-11");
    expect(trust).toContain("size-5");
    expect(trust).toContain("min-h-32");

    const education = sliceBetween("function EducationSection", "function Diagnostics");
    expect(education).toContain("border-2 border-primary/20");
    expect(education).toContain("border-2 border-primary/30");
    expect(education).toContain("size-11");

    const academy = sliceBetween("function Academy", "function Footer");
    expect(academy).toContain("<AcademyKnowledgeCards");
    expect(academy).toContain("View all articles");
    expect(academy).not.toContain("h-1.5 w-20");
  });

  it("uses a heavier navigation label", () => {
    expect(source).toContain("text-[15px] font-semibold");
    expect(source).toContain("size-4");
  });
});

describe("homepage iteration — fill gaps", () => {
  it("opens menus with the words already used in the footer", () => {
    expect(source).toContain("DropdownMenuTrigger");
    expect(source).toContain("DropdownMenuContent");
    for (const label of [
      "Platform",
      "Industries",
      "Academy",
      "Company",
      "Processing",
      "Smart routing",
      "Chargeback defense",
      "iGaming",
      "Nutraceuticals",
      "Subscriptions",
      "About",
      "Contact",
    ]) {
      expect(source).toContain(`label: "${label}"`);
    }
    expect(source).toContain('href: "/#academy"');
    expect(source).toContain('href: "/#diagnostic"');
    expect(source).toContain('NAV_ITEMS.filter((item) => "items" in item)');
  });

  it("keeps the header labels and the narrow-screen actions on the page", () => {
    const nav = sliceBetween('aria-label="Primary navigation"', "</nav>");
    expect(nav).toContain("flex w-full flex-wrap");
    expect(nav).not.toMatch(/className="hidden/);
    expect(source).not.toContain("hidden sm:flex");
    expect(source).toContain("Talk to an advisor");
    expect(source).toContain("View all articles");

    const route = sliceBetween("function RouteFlow", "export const Route");
    expect(route).toContain("min-w-0");
    expect(route).toContain("text-center");
  });

  it("imports icons before the route graphic that uses them", () => {
    expect(source.indexOf('from "lucide-react"')).toBeLessThan(source.indexOf("function RouteFlow"));
  });
});

describe("brand", () => {
  it("uses KithPay in page metadata", () => {
    expect(source).toContain("KithPay — Payment Infrastructure for High-Risk Merchants");
    expect(source).not.toContain("Aurelis");
    const root = readFileSync(join(process.cwd(), "src/routes/__root.tsx"), "utf8");
    expect(root).toContain('title: "KithPay"');
    expect(root).toContain('content: "KithPay"');
    expect(root).not.toContain("Aurelis");
    expect(root).not.toContain("@Lovable");
    expect(root).not.toContain("A modern payments platform.");
  });
});

describe("merchant health", () => {
  it("places the review copy beside the diagnostic and publishes schema", () => {
    const section = sliceBetween("const INITIAL_TERMS", "function Diagnostics");
    const seo = readFileSync(join(process.cwd(), "src/lib/merchant-health-seo.ts"), "utf8");
    const page = readFileSync(join(process.cwd(), "src/routes/merchant-health.tsx"), "utf8");
    expect(source).toContain("<EducationSection /><MerchantHealth /><Diagnostics />");
    expect(source).toContain('href={MERCHANT_HEALTH_PATH}');
    expect(section).toContain("Why New Merchants Start with Conservative Processing Terms");
    expect(section).toContain("The 90-Day &amp; 6-Month Merchant Performance Review");
    expect(section).toContain("Monthly Merchant Account Health Checklist");
    expect(section).toContain("Unusual transactions:");
    expect(section).toContain("acquirer-specific underwriting rules");
    expect(section).not.toMatch(/\d+(\.\d+)?%/);
    expect(source).toContain("KithPay — Payment Infrastructure for High-Risk Merchants");
    expect(source).not.toContain("application/ld+json");
    expect(seo).toContain('"@context": "https://schema.org"');
    expect(seo).toContain('name: "KithPay"');
    expect(seo).toContain('"@type": "WebPage"');
    expect(seo).toContain('"@type": "BreadcrumbList"');
    expect(seo).toContain('name: "Home"');
    expect(seo).toContain('name: "Merchant Health & Performance Review"');
    expect(seo).toContain("MERCHANT_RESOURCES_LABEL");
    expect(seo).toContain("MERCHANT_RESOURCES_PATH");
    expect(seo).toContain("MERCHANT_HEALTH_ENGINE_LABEL");
    expect(seo).not.toContain("yourdomain.com");
    expect(seo).not.toContain("[https://");
    expect(page).toContain("<MerchantHealthHeader currentPage");
    const hero = sliceBetween("function Hero", "function TrustBand");
    expect(hero.indexOf("<MerchantHealthHeader")).toBeGreaterThanOrEqual(0);
    expect(hero.indexOf("<MerchantHealthHeader")).toBeLessThan(hero.indexOf("<HealthEngine"));
    const diagnostic = sliceBetween("function Diagnostics", "function Academy");
    expect(diagnostic.indexOf("<MerchantHealthHeader")).toBeLessThan(
      diagnostic.indexOf("How healthy is your payment setup?"),
    );
    expect(section).toContain('id="merchant-risk"');
    expect(section).toContain('id: "rolling-reserves"');
    expect(section).toContain('id: "payout-schedules"');
    expect(section).toContain('id="acquirer-underwriting"');
    expect(section).toContain('id="chargeback-mitigation"');
    expect(page).toContain('rel: "canonical"');
    expect(page).toContain("MERCHANT_HEALTH_PATH");
    expect(page).toContain('type: "application/ld+json"');
    expect(page).toContain('content: "article"');
    expect(page).not.toContain("yourdomain.com");
    expect(page).not.toContain("og-merchant-health.jpg");
  });
});

describe("academy risk", () => {
  it("links the first academy card to a crawlable fundamentals page", () => {
    const academy = sliceBetween("function Academy", "function Footer");
    const cards = readFileSync(join(process.cwd(), "src/components/AcademyKnowledgeCards.tsx"), "utf8");
    const seo = readFileSync(join(process.cwd(), "src/lib/academy-risk-seo.ts"), "utf8");
    const page = readFileSync(join(process.cwd(), "src/routes/academy/merchant-risk-fundamentals.tsx"), "utf8");
    expect(academy).toContain("<AcademyKnowledgeCards");
    expect(cards).toContain("What Makes a Merchant High Risk?");
    expect(cards).toContain("Refund vs. Dispute vs. Chargeback");
    expect(cards).toContain("Protect Your Merchant Record");
    expect(cards).toContain("href={`${ACADEMY_RISK_PATH}#${card.id}`}");
    expect(cards).toContain("<article");
    expect(cards).toContain("<header");
    expect(cards).toContain("<footer");
    expect(cards).not.toContain("cursor-pointer");
    expect(cards).not.toContain("text-indigo-");
    expect(cards).not.toContain("text-gray-");
    expect(cards).not.toContain("bg-amber-");
    expect(cards).not.toContain("bg-rose-");
    expect(source).toContain("KithPay — Payment Infrastructure for High-Risk Merchants");
    expect(seo).toContain('"/academy/merchant-risk-fundamentals"');
    expect(seo).toContain('"@context": "https://schema.org"');
    expect(seo).toContain('"@type": "ItemList"');
    expect(seo).toContain('"@type": "FAQPage"');
    expect(seo).toContain('name: "Merchant Academy"');
    expect(seo).toContain('name: "Risk & Compliance Essentials"');
    expect(seo).toContain('name: "KithPay"');
    expect(seo).toContain("severely limits");
    expect(seo).not.toContain("yourdomain.com");
    expect(seo).not.toContain("og-academy-risk.jpg");
    expect(page).toContain('rel: "canonical"');
    expect(page).toContain("ACADEMY_RISK_PATH");
    expect(page).toContain('type: "application/ld+json"');
    expect(page).not.toContain("yourdomain.com");
    expect(page).not.toContain("og-academy-risk.jpg");
  });
});

describe("academy advanced guide", () => {
  it("publishes crawlable head tags without a missing social image", () => {
    const seo = readFileSync(join(process.cwd(), "src/lib/academy-advanced-seo.ts"), "utf8");
    const page = readFileSync(join(process.cwd(), "src/routes/academy/advanced-merchant-guides.tsx"), "utf8");
    const index = readFileSync(join(process.cwd(), "src/routes/academy/index.tsx"), "utf8");
    expect(seo).toContain('"/academy/advanced-merchant-guides"');
    expect(seo).toContain("Advanced Merchant Payments Guide: PCI, Pricing & Subscriptions | Academy");
    expect(seo).toContain("shared PCI DSS compliance");
    expect(seo).toContain('"@context": "https://schema.org"');
    expect(seo).toContain('"@type": "WebPage"');
    expect(seo).toContain('"@type": "ItemList"');
    expect(seo).toContain('"@type": "FAQPage"');
    expect(seo).toContain('name: "Merchant Academy"');
    expect(seo).toContain('name: EXPANDED_GUIDES_LABEL');
    expect(seo).toContain("Understand Your Merchant Account Ecosystem");
    expect(seo).toContain("Who approves a merchant account application?");
    expect(seo).toContain("final account approval reside with the acquiring bank.");
    expect(seo).toContain('name: "KithPay"');
    expect(page).toContain("<ViewAllAcademyHeaderNav />");
    expect(page).toContain("{faq.question}");
    expect(page).toContain("{faq.answer}");
    expect(seo).not.toContain("yourdomain.com");
    expect(seo).not.toContain("og-academy-advanced.jpg");
    expect(page).toContain('rel: "canonical"');
    expect(page).toContain("ACADEMY_ADVANCED_PATH");
    expect(page).toContain('property: "og:title", content: ACADEMY_ADVANCED_SOCIAL_TITLE');
    expect(page).toContain('type: "application/ld+json"');
    expect(page).not.toContain("og:image");
    expect(page).not.toContain("twitter:image");
    expect(page).not.toContain("yourdomain.com");
    const extended = readFileSync(join(process.cwd(), "src/components/AcademyExtendedCards.tsx"), "utf8");
    expect(index).toContain("<AcademyExtendedCards />");
    expect(index).toContain("<AcademyHeaderNav showBreadcrumb={false}");
    expect(index).toContain("showBreadcrumb={false}");
    expect(index).toContain("outsourced PCI, and recurring billing");
    expect(page).toContain("id={faq.id}");
    expect(extended).toContain("Understand Your Merchant Account Architecture");
    expect(extended).toContain("Why Your Payment Processing Pricing Looks Like This");
    expect(extended).toContain("PCI Compliance When Payments Are Outsourced");
    expect(extended).toContain("Recurring & Subscription Billing Done Right");
    expect(extended).toContain("href={`${ACADEMY_ADVANCED_PATH}#${card.id}`}");
    expect(extended).toContain("<article");
    expect(extended).toContain("<footer");
    expect(extended).toContain("may request an acquirer review");
    expect(extended).not.toContain("enables rate renegotiation");
    expect(extended).not.toContain("cursor-pointer");
    expect(extended).not.toContain("text-gray-");
    expect(extended).not.toContain("text-blue-600");
    expect(source).toContain("KithPay — Payment Infrastructure for High-Risk Merchants");
  });
});

describe("deploy target", () => {
  it("pins Nitro to Vercel instead of the Lovable Cloudflare default", () => {
    const config = readFileSync(join(process.cwd(), "vite.config.ts"), "utf8");
    expect(config).toContain('preset: "vercel"');
    expect(config).not.toContain("cloudflare-module");
  });
});

describe("homepage — quality", () => {
  it("keeps the headline inside a narrow viewport", () => {
    const hero = sliceBetween("function Hero", "function TrustBand");
    expect(hero).toContain("min-w-0");
    expect(hero).toContain("max-w-full");
    expect(hero).toContain("minmax(0,0.9fr)");

    const engine = sliceBetween("function HealthEngine", "function Hero");
    expect(engine).toContain("flex-wrap");
    expect(engine).toContain("min-w-0");

    const route = sliceBetween("function RouteFlow", "export const Route");
    expect(route).toContain("flex-1");
    expect(route).not.toContain("w-16");
  });

  it("does not use placeholder links that jump to the top of the page", () => {
    expect(source).not.toContain('href: "#"');
    expect(source).not.toContain('href="#"');
    expect(source).toContain('href: "/#academy"');
    expect(source).toContain('href: "/#diagnostic"');
    expect(source).toContain('href="/"');
    expect(source).toContain('rel: "canonical"');
  });

  it("keeps a visible keyboard focus style on navigation", () => {
    const nav = sliceBetween("function NavLink", "function Header");
    expect(nav).toContain("focus-visible:outline-2");
    expect(nav).not.toContain("outline-none");
  });

  it("stops the route animation when reduced motion is requested", () => {
    const route = sliceBetween("function RouteFlow", "export const Route");
    expect(route).toContain("prefers-reduced-motion");
  });

  it("keeps the enlarged logo inside the original header and the hero grid behind the copy", () => {
    const brand = sliceBetween("function BrandMark", "function destinationHref");
    expect(brand).toContain("height={36}");
    expect(brand).toContain("h-9");
    expect(brand).toContain("w-[125px]");
    expect(brand).toContain("scale-[1.21]");
    const header = sliceBetween("export function Header", "function HealthEngine");
    expect(header).toContain("lg:h-20");
    expect(source).toContain('className="grid h-1.5 grid-cols-4"');
    const hero = sliceBetween("function Hero", "function TrustBand");
    expect(hero.indexOf("<HeroPerspectiveGrid />")).toBeGreaterThanOrEqual(0);
    expect(hero.indexOf("<HeroPerspectiveGrid />")).toBeLessThan(hero.indexOf("Respect the rules."));
    const cover = readFileSync(join(process.cwd(), "src/components/ComingSoonCover.tsx"), "utf8");
    expect(cover).toContain('className="h-12 w-auto"');
    expect(cover).not.toContain("scale-");
  });

  it("keeps keyboard order aligned with the header and gives text links a 24px target", () => {
    const header = sliceBetween("function Header", "function HealthEngine");
    expect(header.indexOf("Talk to an advisor")).toBeGreaterThan(header.indexOf("Primary navigation"));
    expect(header).not.toContain("order-last");
    expect(source).toContain("justify-self-start");
    expect(source).toContain("inline-flex min-h-6");
    expect(source).toContain("inline-flex min-h-8");
  });
});
