import { useEffect, useState } from "react";
import {
  ACQUIRER_AUDIT_METRICS,
  AUDIT_STORAGE_KEY,
  CONSERVATIVE_TERMS,
  MERCHANT_HEALTH_ARTICLE_LEAD,
  MERCHANT_HEALTH_ARTICLE_TITLE,
  MONTHLY_AUDIT_ITEMS,
  TERM_OPTIMIZATIONS,
  auditMonthKey,
  auditProgress,
  emptyAudit,
  formatAuditMonth,
  parseStoredAudit,
  toggleAuditItem,
} from "../lib/merchant-health-audit";
import { cn } from "../lib/utils";

export function MerchantHealthBody() {
  return (
    <section
      className="merchant-health-body mx-auto max-w-5xl px-5 py-12 text-foreground lg:px-8 lg:py-16"
      aria-labelledby="merchant-health-title"
    >
      <header className="mb-10">
        <h1
          id="merchant-health-title"
          className="mb-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
        >
          {MERCHANT_HEALTH_ARTICLE_TITLE}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">{MERCHANT_HEALTH_ARTICLE_LEAD}</p>
      </header>

      <article
        id="merchant-risk"
        className="mb-12 scroll-mt-24 rounded-xl border border-border bg-secondary/70 p-6 shadow-sm"
      >
        <h2 className="mb-4 text-2xl font-bold text-foreground">
          1. Why New Merchants Begin with Conservative Processing Terms
        </h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          When onboarding a brand-new merchant account, acquiring banks facing zero processing history enforce
          conservative underwriting parameters to mitigate credit, operational, and fraud exposure. These initial
          safeguards typically include:
        </p>
        <ul className="mb-6 grid grid-cols-1 gap-3 text-sm text-foreground md:grid-cols-2">
          {CONSERVATIVE_TERMS.map((item) => (
            <li
              key={item.title}
              id={"id" in item ? item.id : undefined}
              className={cn(
                "flex items-start rounded border border-border bg-card p-3",
                "wide" in item && item.wide && "md:col-span-2",
                "id" in item && "scroll-mt-24",
              )}
            >
              <span className="mr-2 font-semibold text-primary" aria-hidden="true">
                •
              </span>
              <div>
                <strong>{item.title}</strong> {item.detail}
              </div>
            </li>
          ))}
        </ul>
        <div className="rounded border-l-4 border-chart-3 bg-chart-3/15 p-4 text-sm text-foreground">
          <strong>Important Governance Note:</strong> Initial processing terms are <em>never permanent</em>. After 3 to
          6 months of stable, low-risk transaction history, merchants are eligible for an Acquirer Review. Eligibility
          depends on card scheme mandates (Visa/Mastercard) and specific underwriting rules.
        </div>
      </article>

      <article id="acquirer-underwriting" className="mb-12 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold text-foreground">2. The 90-Day & 6-Month Merchant Performance Review</h2>
        <p className="mb-6 leading-relaxed text-muted-foreground">
          Acquirers evaluate merchant processing health at standard 90-day and 180-day operational milestones.
          Maintaining pristine metrics during this timeframe directly enables renegotiation of processing conditions.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 border-b border-border pb-2 text-lg font-bold text-foreground">Acquirer Audit Metrics:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {ACQUIRER_AUDIT_METRICS.map((metric) => (
                <li key={metric.label} className="flex items-center justify-between gap-3">
                  <span>{metric.label}</span>
                  <span className="shrink-0 rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
                    {metric.target}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 border-b border-border pb-2 text-lg font-bold text-foreground">
              Potential Term Optimizations:
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {TERM_OPTIMIZATIONS.map((item) => (
                <li key={item.title} className="flex items-start">
                  <span className="mr-2 font-bold text-accent" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong className="text-foreground">{item.title}</strong> {item.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>

      <MonthlyAudit />
    </section>
  );
}

function MonthlyAudit() {
  const length = MONTHLY_AUDIT_ITEMS.length;
  const [checked, setChecked] = useState<boolean[]>(() => emptyAudit(length));
  const [ready, setReady] = useState(false);
  const month = auditMonthKey(new Date());
  const { done, total, percent } = auditProgress(checked);
  const complete = total > 0 && done === total;

  useEffect(() => {
    setChecked(parseStoredAudit(window.localStorage.getItem(AUDIT_STORAGE_KEY), month, length));
    setReady(true);
  }, [length, month]);

  useEffect(() => {
    if (!ready) return;
    const record = JSON.stringify({ month, checked });
    window.localStorage.setItem(AUDIT_STORAGE_KEY, record);
  }, [checked, month, ready]);

  return (
    <article
      id="chargeback-mitigation"
      className="scroll-mt-24 rounded-2xl bg-chart-5 p-6 text-primary-foreground shadow-lg sm:p-8"
    >
      <header className="mb-6">
        <h2 id="monthly-audit-title" className="mb-2 text-2xl font-bold">
          Monthly Merchant Account Health Self-Audit
        </h2>
        <p id="monthly-audit-description" className="text-sm text-primary-foreground/80">
          Run this internal operational checklist every 30 days to avoid unexpected holds, reserve increases, or
          acquirer compliance inquiries.
        </p>
      </header>

      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold" role="status" aria-live="polite">
          {`${done} of ${total} checks complete${ready ? ` for ${formatAuditMonth(new Date())}` : ""}${
            complete ? ". Monthly audit complete." : "."
          }`}
        </p>
        <div
          className="h-2 overflow-hidden rounded-full bg-white/20"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-labelledby="monthly-audit-title"
        >
          <div className="h-full rounded-full bg-chart-4 transition-[width]" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <fieldset aria-describedby="monthly-audit-description">
        <legend className="sr-only">Monthly merchant account health checks</legend>
        <div className="space-y-4">
          {MONTHLY_AUDIT_ITEMS.map((item, index) => {
            const inputId = `monthly-audit-${item.id}`;
            const isChecked = checked[index] === true;
            return (
              <label
                key={item.id}
                htmlFor={inputId}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border border-white/15 bg-white/10 p-3 transition hover:bg-white/15",
                  isChecked && "border-white/40 bg-white/20",
                )}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => setChecked((current) => toggleAuditItem(current, index))}
                  className="mt-1 size-4 shrink-0 accent-chart-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                />
                <span className={cn("text-sm text-primary-foreground", isChecked && "text-primary-foreground/80")}>
                  <strong>{item.title}</strong> {item.detail}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <button
        type="button"
        className="mt-6 inline-flex min-h-8 items-center rounded-md border border-white/30 px-3 text-sm font-semibold text-primary-foreground hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={done === 0}
        onClick={() => setChecked(emptyAudit(length))}
      >
        Clear this month's checks
      </button>
    </article>
  );
}
