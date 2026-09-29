export const MERCHANT_HEALTH_ARTICLE_TITLE =
  "Merchant Account Health & Performance Review Roadmap";

export const MERCHANT_HEALTH_ARTICLE_LEAD =
  "Why new merchant accounts start with conservative processing terms, how acquirers audit performance at 90 days, and how to proactively optimize your payment infrastructure.";

export const CONSERVATIVE_TERMS = [
  {
    title: "Higher Processing Rates:",
    detail: "Adjusted risk premiums during initial evaluation phases.",
  },
  {
    title: "Lower Monthly Caps:",
    detail: "Conservative processing limits to assess operational velocity.",
  },
  {
    id: "rolling-reserves",
    title: "Rolling Reserves:",
    detail: "Temporary withholding of sales percentages to cover potential chargeback liabilities.",
  },
  {
    id: "payout-schedules",
    title: "Extended Settlement Schedules:",
    detail: "Longer payout delays (e.g., T+5 or T+7) for fulfillment validation.",
  },
  {
    title: "Enhanced Compliance Oversight:",
    detail: "Automated risk triggers monitoring transaction spikes or unusual geographical patterns.",
    wide: true,
  },
] as const;

export const ACQUIRER_AUDIT_METRICS = [
  { label: "Chargeback Ratio", target: "< 0.9% Target" },
  { label: "Refund Ratio", target: "Stable Velocity" },
  { label: "Fraud & TC40 / SAFE Alerts", target: "Zero Excessive Alerts" },
  { label: "Monthly Volume vs. Cap", target: "Within Limits" },
  { label: "Average Order Value (AOV)", target: "Consistent with Profile" },
  { label: "Account Behavior & Compliance", target: "Fully Compliant" },
] as const;

export const TERM_OPTIMIZATIONS = [
  {
    title: "Rate Reduction:",
    detail: "Lower interchange-plus or standard discount rates.",
  },
  {
    title: "Reserve Release:",
    detail: "Elimination or percentage reduction of rolling reserves.",
  },
  {
    title: "Cap Expansion:",
    detail: "Increased monthly processing ceilings to accommodate scaling.",
  },
  {
    title: "Payout Acceleration:",
    detail: "Shorter payout settlement windows (e.g., T+2 or T+1).",
  },
] as const;

export const MONTHLY_AUDIT_ITEMS = [
  {
    id: "volume",
    title: "Processing Volume Check:",
    detail: "Is overall monthly volume remaining within approved underwriting caps?",
  },
  {
    id: "aov",
    title: "AOV Tracking:",
    detail: "Is the actual Average Order Value aligned with original onboarding declarations?",
  },
  {
    id: "disputes",
    title: "Dispute & Chargeback Root Cause:",
    detail: "Are chargeback reason codes analyzed and mitigated via alert networks?",
  },
  {
    id: "refunds",
    title: "Refund Patterns:",
    detail: "Are customer refunds processed systematically without unusual volumetric spikes?",
  },
  {
    id: "fulfillment",
    title: "Fulfillment Velocity:",
    detail: "Are product shipping tracking numbers generated and uploaded within declared SLAs?",
  },
  {
    id: "model",
    title: "Business Model & Domain Changes:",
    detail:
      "Have updates to your website, terms of service, or billing descriptor been communicated to acquirers?",
  },
  {
    id: "notices",
    title: "Pending Acquirer Notices:",
    detail: "Have all compliance tickets, document requests, and portal alerts been answered?",
  },
] as const;

export const AUDIT_STORAGE_KEY = "kithpay.merchant-health.monthly-audit";

export type StoredAudit = {
  month: string;
  checked: boolean[];
};

export function emptyAudit(length: number): boolean[] {
  return Array.from({ length }, () => false);
}

export function auditMonthKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function formatAuditMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

export function auditProgress(checked: readonly boolean[]): {
  done: number;
  total: number;
  percent: number;
} {
  const total = checked.length;
  const done = checked.filter(Boolean).length;
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

export function toggleAuditItem(checked: readonly boolean[], index: number): boolean[] {
  if (index < 0 || index >= checked.length) return [...checked];
  return checked.map((value, itemIndex) => (itemIndex === index ? !value : value));
}

export function parseStoredAudit(raw: string | null, month: string, length: number): boolean[] {
  const empty = emptyAudit(length);
  if (!raw) return empty;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredAudit>;
    if (parsed.month !== month || !Array.isArray(parsed.checked) || parsed.checked.length !== length) {
      return empty;
    }
    return parsed.checked.map((value) => value === true);
  } catch {
    return empty;
  }
}
