/**
 * Merchant health article body — smoke mock.
 * Machine-only: semantic markup plus monthly audit state helpers. No network.
 * Run: npm run test:smoke
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MerchantHealthBody } from "./MerchantHealthBody";
import {
  MONTHLY_AUDIT_ITEMS,
  auditMonthKey,
  auditProgress,
  emptyAudit,
  parseStoredAudit,
  toggleAuditItem,
} from "../lib/merchant-health-audit";

const page = readFileSync(join(process.cwd(), "src/routes/merchant-health.tsx"), "utf8");

describe("merchant health article body", () => {
  it("renders semantic sections and the monthly self-audit on the article page", () => {
    const html = renderToStaticMarkup(<MerchantHealthBody />);

    expect(html).toContain('aria-labelledby="merchant-health-title"');
    expect(html).toContain("<article");
    expect(html.match(/<article/g)?.length).toBe(3);
    expect(html).toContain("Merchant Account Health &amp; Performance Review Roadmap");
    expect(html).toContain("1. Why New Merchants Begin with Conservative Processing Terms");
    expect(html).toContain("2. The 90-Day &amp; 6-Month Merchant Performance Review");
    expect(html).toContain("Important Governance Note:");
    expect(html).toContain("never permanent");
    expect(html).toContain("&lt; 0.9% Target");
    expect(html).toContain("Monthly Merchant Account Health Self-Audit");
    expect(html).toContain('id="merchant-risk"');
    expect(html).toContain('id="rolling-reserves"');
    expect(html).toContain('id="payout-schedules"');
    expect(html).toContain('id="acquirer-underwriting"');
    expect(html).toContain('id="chargeback-mitigation"');
    expect(html).toContain('type="checkbox"');
    expect(html.match(/type="checkbox"/g)?.length).toBe(MONTHLY_AUDIT_ITEMS.length);
    expect(html).toContain("0 of 7 checks complete");
    expect(html).toContain("Clear this month");
    expect(html).not.toMatch(/[\u4e00-\u9fff]/);

    expect(page).toContain("<MerchantHealthBody />");
    expect(page).toContain('id="merchant-health-faq"');
    expect(page).not.toContain("<MerchantHealth ");
  });
});

describe("monthly audit progress", () => {
  it("counts checks, toggles one item, and drops a stored audit from another month", () => {
    expect(auditProgress([true, false, true])).toEqual({ done: 2, total: 3, percent: 67 });
    expect(auditProgress(emptyAudit(0))).toEqual({ done: 0, total: 0, percent: 0 });

    const toggled = toggleAuditItem([false, false], 1);
    expect(toggled).toEqual([false, true]);
    expect(toggleAuditItem(toggled, 1)).toEqual([false, false]);
    expect(toggleAuditItem([true], 4)).toEqual([true]);

    const month = auditMonthKey(new Date(2026, 8, 28));
    expect(month).toBe("2026-09");
    expect(parseStoredAudit(null, month, 2)).toEqual([false, false]);
    expect(parseStoredAudit("{", month, 2)).toEqual([false, false]);
    expect(parseStoredAudit(JSON.stringify({ month: "2026-08", checked: [true, true] }), month, 2)).toEqual([
      false,
      false,
    ]);
    expect(
      parseStoredAudit(JSON.stringify({ month, checked: [true, "yes"] }), month, 2),
    ).toEqual([true, false]);
  });
});
