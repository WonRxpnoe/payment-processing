import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Gauge,
  Layers3,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Users,
  Building2,
  LineChart,
} from "lucide-react";
import { KithPayLogo } from "../components/KithPayLogo";
import { MerchantHealthHeader } from "../components/MerchantHealthHeader";
import { ACADEMY_RISK_PATH, ACADEMY_RISK_SOCIAL_DESCRIPTION } from "../lib/academy-risk-seo";
import { MERCHANT_HEALTH_FAQ, MERCHANT_HEALTH_PATH } from "../lib/merchant-health-seo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const STAGES = [
  { name: "Screening", bg: "bg-chart-1", ring: "border-chart-1" },
  { name: "Risk check", bg: "bg-chart-2", ring: "border-chart-2" },
  { name: "Routing", bg: "bg-chart-3", ring: "border-chart-3" },
  { name: "Settled", bg: "bg-chart-4", ring: "border-chart-4" },
];

function RouteFlow() {
  // step -1 = dot at start; 0..3 = dot reached that node; 4 = hold, then restart
  const [step, setStep] = useState(-1);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      setStep(3);
      return;
    }
    const id = setInterval(() => setStep((s) => (s >= 4 ? -1 : s + 1)), 1100);
    return () => clearInterval(id);
  }, []);
  const pos = step < 0 ? 0 : Math.min(step, 3) / 3;
  return (
    <div className="mt-4 rounded-md border border-border bg-background px-2 py-4 sm:p-4">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-semibold">Smart acquirer routing</span>
        <span className="text-xs text-muted-foreground">{step >= 3 ? "All checks passed" : "Processing…"}</span>
      </div>
      <div className="relative px-[18px]">
        <div className="absolute inset-x-[18px] top-[17px] h-0.5 bg-border" />
        <div className="absolute left-[18px] top-[17px] h-0.5 bg-accent transition-all duration-1000 ease-in-out" style={{ width: `calc((100% - 36px) * ${pos})` }} />
        <span
          className={`absolute top-[18px] z-20 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)] ease-in-out ${step < 0 ? "duration-0" : "transition-all duration-1000"}`}
          style={{ left: `calc(18px + (100% - 36px) * ${pos})` }}
        />
        <div className="relative z-10 -mx-[18px] flex justify-between">
          {STAGES.map((s, i) => {
            const passed = step >= i;
            return (
              <div key={s.name} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
                <span className={`grid size-9 place-items-center rounded-full border-2 transition-all duration-500 ${passed ? `${s.bg} ${s.ring} scale-110 text-primary-foreground` : "border-border bg-card text-muted-foreground"}`}>
                  {passed ? <Check className="size-4" /> : <span className="size-1.5 rounded-full bg-border" />}
                </span>
                <span className="max-w-full text-xs font-semibold leading-tight text-foreground">{s.name}</span>
                <span className={`max-w-full text-[10px] font-semibold uppercase leading-tight tracking-wide transition-colors ${passed ? "text-accent" : "text-muted-foreground/60"}`}>{passed ? "Passed" : "Pending"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KithPay — Payment Infrastructure for High-Risk Merchants" },
      { name: "description", content: "Stable, transparent payment processing for high-risk businesses — with the guidance to grow safely." },
      { property: "og:title", content: "KithPay — Payment Infrastructure for High-Risk Merchants" },
      { property: "og:description", content: "Stable, transparent payment processing for high-risk businesses — with the guidance to grow safely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const Placeholder = ({ className = "" }: { className?: string }) => (
  <span aria-hidden="true" className={`block rounded-full bg-muted ${className}`} />
);

const MiniChart = () => (
  <svg viewBox="0 0 420 120" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--accent)" stopOpacity=".2" />
        <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path d="M4 105 C46 97 60 91 86 84 S128 90 153 67 S199 72 229 52 S270 59 301 33 S351 42 416 12 V120 H4 Z" fill="url(#chartFill)" />
    <path className="chart-draw" d="M4 105 C46 97 60 91 86 84 S128 90 153 67 S199 72 229 52 S270 59 301 33 S351 42 416 12" fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

function BrandMark() {
  return (
    <a href="/" className="inline-flex w-fit justify-self-start rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <KithPayLogo height={36} className="h-9 w-auto" />
    </a>
  );
}

function destinationHref(href: string | undefined): href is string {
  return typeof href === "string" && href.length > 1 && href !== "#";
}

const NAV_ITEMS = [
  {
    label: "Platform",
    items: [
      { label: "Processing" },
      { label: "Smart routing" },
      { label: "Chargeback defense" },
    ],
  },
  {
    label: "Industries",
    items: [
      { label: "iGaming" },
      { label: "Nutraceuticals" },
      { label: "Subscriptions" },
    ],
  },
  { label: "Academy", href: "#academy" },
  {
    label: "Company",
    items: [
      { label: "About" },
      { label: "Academy", href: "#academy" },
      { label: "Contact", href: "#diagnostic" },
    ],
  },
] as const;

function NavLink({ item }: { item: (typeof NAV_ITEMS)[number] }) {
  const className =
    "flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[15px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=open]:bg-muted data-[state=open]:text-foreground";

  if (!("items" in item)) {
    return (
      <a href={item.href} className={className}>
        {item.label}
      </a>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className}>
        {item.label}
        <ChevronDown className="size-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-52 p-1.5">
        {item.items.map((entry) =>
          "href" in entry && destinationHref(entry.href) ? (
            <DropdownMenuItem key={entry.label} asChild className="px-3 py-2 text-[15px] font-medium">
              <a href={entry.href} className="flex items-center justify-between gap-3">
                {entry.label}
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={entry.label} className="px-3 py-2 text-[15px] font-medium">
              {entry.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  return (
    <header className="border-b border-border bg-background/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 lg:grid lg:h-20 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:px-8 lg:py-0">
        <BrandMark />
        <nav
          aria-label="Primary navigation"
          className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 lg:w-auto lg:justify-center"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
        </nav>
        <div className="ml-auto flex justify-end lg:ml-0">
          <a href="#diagnostic" className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Talk to an advisor <ArrowUpRight className="size-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

function HealthEngine() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    let frame = 0;
    const updateScrollTilt = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = scene.getBoundingClientRect();
        const viewportCenter = window.innerHeight / 2;
        const sceneCenter = rect.top + rect.height / 2;
        const progress = Math.max(-1, Math.min(1, (sceneCenter - viewportCenter) / window.innerHeight));
        scene.style.setProperty("--scroll-tilt", `${progress * -5}deg`);
        scene.style.setProperty("--scroll-shift", `${progress * 14}px`);
      });
    };

    updateScrollTilt();
    window.addEventListener("scroll", updateScrollTilt, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScrollTilt);
    };
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    const scene = sceneRef.current;
    if (!scene) return;
    const rect = scene.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    scene.style.setProperty("--pointer-x", `${x * 7}deg`);
    scene.style.setProperty("--pointer-y", `${y * -7}deg`);
    scene.style.setProperty("--glow-x", `${(x + 0.5) * 100}%`);
    scene.style.setProperty("--glow-y", `${(y + 0.5) * 100}%`);
  };

  const resetPointer = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.style.setProperty("--pointer-x", "0deg");
    scene.style.setProperty("--pointer-y", "0deg");
  };

  const stats = [
    { icon: ShieldCheck, label: "Chargeback ratio", value: "0.42%", c: "text-chart-4", b: "bg-chart-4/10" },
    { icon: Gauge, label: "Approval rate", value: "93.8%", c: "text-chart-1", b: "bg-chart-1/10" },
    { icon: Sparkles, label: "Reserve status", value: "Healthy", c: "text-chart-3", b: "bg-chart-3/15" },
  ];
  return (
    <div
      ref={sceneRef}
      className="health-engine-scene relative mx-auto w-full min-w-0 max-w-[540px] lg:ml-auto"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <div aria-hidden="true" className="health-engine-backplate absolute -inset-5 -z-10 rounded-[28px] bg-secondary/70" />
      <span aria-hidden="true" className="health-engine-orbit health-engine-orbit-blue absolute -right-2 top-16 z-20 size-4 rounded-full bg-chart-1 sm:-right-5" />
      <span aria-hidden="true" className="health-engine-orbit health-engine-orbit-yellow absolute -left-3 bottom-24 z-20 size-3 rounded-full bg-chart-3" />
      <div className="health-engine-card overflow-hidden rounded-lg border border-border bg-card shadow-[0_30px_70px_-35px_color-mix(in_oklab,var(--primary)_35%,transparent)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary"><Gauge className="size-4 text-primary" /></span>
            <div className="min-w-0"><p className="text-sm font-semibold">Merchant Health Engine</p><p className="text-xs text-muted-foreground">Live account overview</p></div>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"><span className="size-1.5 rounded-full bg-accent" />All clear</span>
        </div>
        <div className="px-3 py-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map(({ icon: Icon, label, value, c, b }) => (
              <div key={label} className="health-engine-layer rounded-md border border-border bg-background p-3.5">
                <span className={`mb-4 grid size-8 place-items-center rounded-full ${b}`}><Icon className={`size-4 ${c}`} /></span>
                <p className="font-display text-lg font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div className="health-engine-layer health-engine-layer-chart mt-4 rounded-md border border-border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="min-w-0 font-semibold">Monthly processing volume</span><span className="shrink-0 text-xs text-accent">Steady growth</span></div>
            <div className="mt-4 h-28"><MiniChart /></div>
          </div>
          <div className="health-engine-layer health-engine-layer-route"><RouteFlow /></div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div aria-hidden="true" className="absolute inset-0 opacity-60 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      <div className="relative mx-auto grid w-full min-w-0 min-h-[650px] max-w-7xl items-center gap-16 px-5 py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-8 lg:py-24">
        <div className="min-w-0 max-w-xl">
          <p className="mb-8 flex w-fit max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground"><span className="size-1.5 shrink-0 rounded-full bg-accent" /><span className="min-w-0">High-risk isn't dark. It's misunderstood.</span></p>
          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[56px]">
            Respect the rules. <span className="text-primary">Master them.</span> Grow in the open.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            Payment infrastructure for high-risk merchants — built on multi-bank stability, clear risk guidance, and advisors who help you stay healthy for the long run.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#diagnostic" className="flex h-12 items-center gap-2 rounded-md bg-primary px-5 font-semibold text-primary-foreground">Get your free health report <ArrowUpRight className="size-4" /></a>
            <a href="#academy" className="flex h-12 items-center rounded-md border border-border bg-card px-5 font-semibold">Explore the Academy</a>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex -space-x-2">{["bg-chart-1","bg-chart-2","bg-chart-3","bg-chart-4"].map((c) => <span key={c} className={`size-8 rounded-full border-2 border-background ${c}`} />)}</div>
            Guided by former bank risk officers
          </div>
        </div>
        <div className="min-w-0">
          <MerchantHealthHeader className="mx-auto w-full min-w-0 max-w-[540px] lg:ml-auto" />
          <HealthEngine />
        </div>
      </div>
    </section>
  );
}

function TrustBand() {
  const items = [
    { icon: ShieldCheck, t: "PCI DSS Level 1", s: "Certified security", c: "text-chart-1", b: "bg-chart-1/10" },
    { icon: Building2, t: "20+ acquiring banks", s: "Global network", c: "text-chart-2", b: "bg-chart-2/10" },
    { icon: RouteIcon, t: "Smart routing", s: "Automatic failover", c: "text-chart-3", b: "bg-chart-3/15" },
    { icon: Users, t: "Dedicated advisor", s: "1-on-1 guidance", c: "text-chart-4", b: "bg-chart-4/10" },
  ];
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border px-5 sm:grid-cols-4 lg:px-8">
        {items.map(({ icon: Icon, t, s, c, b }) => (
          <div key={t} className="flex min-h-32 flex-col items-start justify-center gap-3 bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-center">
            <span className={`grid size-11 shrink-0 place-items-center rounded-full ${b}`}><Icon className={`size-5 ${c}`} /></span>
            <div className="min-w-0"><p className="text-sm font-semibold">{t}</p><p className="text-xs text-muted-foreground">{s}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EducationSection() {
  const rows = [
    { c: "text-chart-1", b: "bg-chart-1/10", icon: Gauge, t: "Transparent risk scoring", d: "See exactly what banks look at — and how to keep your account in good standing." },
    { c: "text-chart-3", b: "bg-chart-3/15", icon: Layers3, t: "Multi-bank redundancy", d: "Your volume is spread across acquirers, so one decision never stops your business." },
    { c: "text-chart-4", b: "bg-chart-4/10", icon: ShieldCheck, t: "Chargeback prevention", d: "Pre-dispute alerts, 3D Secure 2.0 and fraud scoring keep ratios well below thresholds." },
  ];
  return (
    <section className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-14 grid gap-8 lg:grid-cols-2">
          <div><p className="mb-3 text-sm font-semibold text-accent">Why merchants stay with us</p><h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Stability isn't luck. It's built on understanding.</h2></div>
          <p className="max-w-md text-muted-foreground lg:justify-self-end">Most frozen accounts don't fail overnight — they drift. We show you the signals early and help you correct course before it matters.</p>
        </div>
        <div className="grid overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b border-border p-6 sm:p-9 lg:border-r lg:border-b-0">
            <p className="mb-8 font-semibold">Your protection layers</p>
            <div className="relative h-64 overflow-hidden rounded-md bg-secondary/70">
              <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/20" />
              <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/30" />
              <div className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground"><ShieldCheck className="size-6" /></div>
              {[["left-10 top-10","text-chart-1"], ["right-10 top-10","text-chart-2"], ["bottom-10 left-16","text-chart-3"], ["bottom-10 right-16","text-chart-4"]].map(([p, c]) => <span key={p} className={`absolute ${p} grid size-9 place-items-center rounded-full border border-border bg-card shadow-sm`}><Check className={`size-3.5 ${c}`} /></span>)}
            </div>
          </div>
          <div className="divide-y divide-border">
            {rows.map(({ icon: Icon, t, d, c, b }) => (
              <div key={t} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-5 p-6 sm:p-8">
                <span className={`grid size-11 place-items-center rounded-full ${b}`}><Icon className={`size-5 ${c}`} /></span>
                <div><p className="font-semibold">{t}</p><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const INITIAL_TERMS: { id?: string; title: string; detail: string }[] = [
  { title: "Higher Processing Fees:", detail: "Adjusted risk premium for newly established accounts." },
  { title: "Lower Volume Caps:", detail: "Initial monthly processing limits to monitor operational capacity." },
  { id: "rolling-reserves", title: "Rolling Reserves:", detail: "Temporary withholding of a percentage of sales to offset potential dispute risks." },
  { id: "payout-schedules", title: "Slower Settlement Cycles:", detail: "Longer payout schedules to ensure order fulfillment verification." },
  { title: "Enhanced Monitoring:", detail: "Increased automated oversight on transaction anomalies and chargeback ratios." },
];

const REVIEW_METRICS = [
  "Chargeback & Dispute Ratios",
  "Refund Rates & Processing Velocity",
  "Fraud & TC40 / SAFE Incident Reports",
  "Total Processing Volume vs. Approved Caps",
  "Average Order Value (AOV) Consistency",
  "Regulatory & Scheme Compliance",
  "Operational Account Behavior",
];

const REVIEW_OUTCOMES = [
  { title: "Processing Rate Optimization:", detail: "Lower interchange-plus or flat fees." },
  { title: "Reserve Release / Reduction:", detail: "Decreased rolling reserve percentage or faster release cycles." },
  { title: "Higher Monthly Volume Caps:", detail: "Extended limits to support business expansion." },
  { title: "Accelerated Payouts:", detail: "Faster settlement cycles (e.g., T+2 or T+1)." },
];

const MONTHLY_CHECKS = [
  { title: "Processing Volume Alignment:", detail: "Is monthly processing volume staying within your approved limit?" },
  { title: "Average Order Value (AOV):", detail: "Has your actual AOV significantly deviated from your declared onboarding profile?" },
  { title: "Disputes & Chargebacks:", detail: "Are dispute root causes and Reason Codes analyzed and mitigated?" },
  { title: "Refund Analysis:", detail: "Are refund requests being processed promptly without unusual spikes?" },
  { title: "Unusual transactions:", detail: "Have out-of-pattern transactions been reviewed and addressed?" },
  { title: "Fulfillment & Logistics:", detail: "Are shipping times and tracking updates running within standard operational windows?" },
  { title: "Website & Business Model Changes:", detail: "Have there been updates to site terms, domain, product lines, or billing models?" },
  { title: "Acquirer Communications:", detail: "Have all compliance notices, document requests, and system notifications been addressed?" },
];

export function MerchantHealth({ titleAs = "h2" }: { titleAs?: "h1" | "h2" }) {
  const Title = titleAs;
  return (
    <section id="merchant-health" className="bg-background py-24 lg:py-32" aria-labelledby="merchant-health-heading">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <header className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-semibold text-accent">Merchant health</p>
          <Title id="merchant-health-heading" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Merchant Health &amp; Performance Review: Scaling Your Payment Setup
          </Title>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Understanding your processing history, maintaining health metrics, and optimizing your terms over time with acquirers.
          </p>
          {titleAs === "h2" ? (
            <a href={MERCHANT_HEALTH_PATH} className="mt-6 inline-flex min-h-8 items-center gap-2 text-sm font-semibold text-primary">
              Merchant Performance Review <ArrowUpRight className="size-4" />
            </a>
          ) : null}
        </header>

        <article id="merchant-health-article" className="mb-10 rounded-lg border border-border bg-secondary/70 p-6 sm:p-8">
          <h3 id="merchant-risk" className="scroll-mt-24 text-xl font-semibold">Why New Merchants Start with Conservative Processing Terms</h3>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            When onboarding without an established processing history, acquirers apply conservative underwriting conditions to mitigate financial and chargeback risks. These initial terms often include:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground">
            {INITIAL_TERMS.map((item) => (
              <li key={item.title} id={item.id} className={item.id ? "scroll-mt-24" : undefined}>
                <strong>{item.title}</strong> {item.detail}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-md bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground">
            <strong>Note:</strong> Initial terms are not permanent. After 3 to 6 months of consistent, compliant processing, merchants may request an acquirer review. Adjustments depend on card scheme regulations and acquirer-specific underwriting rules.
          </p>
        </article>

        <article className="mb-10">
          <h3 id="acquirer-underwriting" className="scroll-mt-24 text-xl font-semibold">The 90-Day &amp; 6-Month Merchant Performance Review</h3>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
            Acquirers evaluate merchant accounts at key operational milestones (90 days and 6 months) to assess stability and eligibility for optimized processing terms.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <h4 className="font-semibold">Key Metrics Evaluated:</h4>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {REVIEW_METRICS.map((metric) => (
                  <li key={metric}>{metric}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h4 className="font-semibold">Review Outcomes (If Health Metrics are Met):</h4>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {REVIEW_OUTCOMES.map((item) => (
                  <li key={item.title}>
                    <strong className="text-foreground">{item.title}</strong> {item.detail}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-accent/30 bg-card p-6 shadow-sm sm:p-8">
          <h3 id="chargeback-mitigation" className="scroll-mt-24 text-xl font-semibold">Monthly Merchant Account Health Checklist</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Regular internal audits help prevent account freezes, unexpected reserves, or acquiring penalties. Perform these checks monthly:
          </p>
          <ul className="mt-4 space-y-3">
            {MONTHLY_CHECKS.map((item) => (
              <li key={item.title}>
                <label className="flex items-start gap-3 text-sm text-foreground">
                  <input type="checkbox" className="mt-1 size-4 shrink-0 accent-primary" />
                  <span>
                    <strong>{item.title}</strong> {item.detail}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </article>

        <div id="merchant-health-faq" className="mt-10 max-w-3xl">
          <h3 className="text-xl font-semibold">Merchant Performance Review questions</h3>
          <dl className="mt-6 space-y-6">
            {MERCHANT_HEALTH_FAQ.map((item) => (
              <div key={item.question}>
                <dt className="font-semibold">{item.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Diagnostics() {
  const fields = ["Industry", "Monthly volume", "Chargeback ratio", "Current processor"];
  return (
    <section id="diagnostic" className="bg-primary py-24 text-primary-foreground lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10 rounded-lg bg-background px-5 py-5 text-foreground sm:px-6">
          <MerchantHealthHeader className="mb-0 border-b-0 pb-0" />
        </div>
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <span className="mb-7 grid size-11 place-items-center rounded-md bg-primary-foreground/10"><LineChart className="size-5" /></span>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">How healthy is your payment setup?</h2>
          <p className="mt-6 text-primary-foreground/80">Answer four questions and receive a free Merchant Health Report — your risk profile, weak points, and a clear plan to strengthen them.</p>
        </div>
        <div className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/[0.06] p-5 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f} className="rounded-md border border-primary-foreground/15 bg-primary-foreground/[0.06] p-4">
                <div className="flex items-center justify-between text-sm text-primary-foreground/70">{f}<ChevronDown className="size-4" /></div>
                <p className="mt-3 text-sm font-medium">Select…</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-md bg-primary-foreground p-5 text-foreground">
            <div><p className="text-xs text-muted-foreground">Free · Takes 2 minutes</p><p className="font-semibold">Generate my health report</p></div>
            <span className="grid size-11 place-items-center rounded-full bg-accent text-accent-foreground"><ArrowUpRight className="size-4" /></span>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

function Academy() {
  return (
    <section id="academy" className="bg-card py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div><p className="mb-3 text-sm font-semibold text-accent">Merchant Academy</p><h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Learn to run it right.</h2></div>
          <a href="#academy" className="inline-flex min-h-8 items-center gap-2 text-sm font-semibold text-primary">View all articles <ArrowUpRight className="size-4" /></a>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <article className="overflow-hidden rounded-lg border border-border bg-background">
            <a href={ACADEMY_RISK_PATH} className="block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <div className="relative h-48 bg-chart-1/10">
                <div className="absolute inset-0 text-chart-1 [background-image:radial-gradient(currentColor_0.7px,transparent_0.7px)] [background-size:14px_14px] opacity-20" />
                <span className="absolute left-6 top-6 grid size-10 place-items-center rounded-md bg-card shadow-sm"><BookOpen className="size-4 text-chart-1" /></span>
              </div>
              <div className="p-6">
                <p className="mb-3 text-sm font-semibold text-accent">Payments Academy</p>
                <h3 className="font-display text-xl font-bold tracking-tight">Merchant Risk, Disputes &amp; Record Protection</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{ACADEMY_RISK_SOCIAL_DESCRIPTION}</p>
              </div>
            </a>
          </article>
          {/* Remaining article slots stay empty until real content is provided */}
          {([[ShieldCheck, "text-chart-4", "bg-chart-4/10"], [Layers3, "text-chart-3", "bg-chart-3/15"]] as const).map(([Icon, c, b], i) => (
            <article key={i} className="overflow-hidden rounded-lg border border-dashed border-border bg-background">
              <div className={`relative h-48 ${b}`}>
                <div className={`absolute inset-0 ${c} [background-image:radial-gradient(currentColor_0.7px,transparent_0.7px)] [background-size:14px_14px] opacity-20`} />
                <span className="absolute left-6 top-6 grid size-10 place-items-center rounded-md bg-card shadow-sm"><Icon className={`size-4 ${c}`} /></span>
              </div>
              <div className="p-6">
                <Placeholder className="mb-4 h-2.5 w-20" />
                <Placeholder className="mb-3 h-3.5 w-[88%]" />
                <Placeholder className="mb-7 h-3.5 w-[62%]" />
                <Placeholder className="h-2 w-24" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const cols = NAV_ITEMS.filter((item) => "items" in item);
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 md:grid-cols-[1.5fr_repeat(3,1fr)] lg:px-8">
        <div><BrandMark /><p className="mt-5 max-w-xs text-sm text-muted-foreground">Steady payment infrastructure for businesses others call high-risk.</p></div>
        {cols.map((column) => (
          <div key={column.label}>
            <p className="mb-4 text-sm font-semibold">{column.label}</p>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {column.items.map((entry) => (
                <li key={entry.label}>
                  {"href" in entry && destinationHref(entry.href) ? (
                    <a href={entry.href} className="inline-flex min-h-6 items-center underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground">{entry.label}</a>
                  ) : (
                    <span>{entry.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}

function Index() {
  return <main className="min-h-screen overflow-hidden"><div aria-hidden="true" className="grid h-1.5 grid-cols-4"><span className="bg-chart-1" /><span className="bg-chart-2" /><span className="bg-chart-3" /><span className="bg-chart-4" /></div><Header /><Hero /><TrustBand /><EducationSection /><MerchantHealth /><Diagnostics /><Academy /><Footer /></main>;
}
