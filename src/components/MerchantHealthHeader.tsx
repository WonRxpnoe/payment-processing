import { Fragment } from "react";
import { MERCHANT_HEALTH_PATH } from "../lib/merchant-health-seo";
import {
  MERCHANT_HEALTH_ENGINE_LABEL,
  MERCHANT_RESOURCES_LABEL,
  MERCHANT_RESOURCES_PATH,
  MERCHANT_TOPICS,
} from "../lib/merchant-taxonomy";
import { cn } from "../lib/utils";

type Crumb = { label: string; href?: string };

const linkClass =
  "inline-flex min-h-6 items-center underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function MerchantHealthHeader({
  crumbs,
  activeSlug,
  currentPage = false,
  className,
}: {
  crumbs?: readonly Crumb[];
  activeSlug?: string;
  currentPage?: boolean;
  className?: string;
}) {
  const trail: readonly Crumb[] = crumbs ?? [
    { label: "Home", href: "/" },
    { label: MERCHANT_RESOURCES_LABEL, href: MERCHANT_RESOURCES_PATH },
    currentPage
      ? { label: MERCHANT_HEALTH_ENGINE_LABEL }
      : { label: MERCHANT_HEALTH_ENGINE_LABEL, href: MERCHANT_HEALTH_PATH },
  ];

  return (
    <div className={cn("mb-6 border-b border-border pb-4", className)}>
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          {trail.map((crumb, index) => {
            const current = !crumb.href;
            return (
              <Fragment key={crumb.label}>
                {index > 0 ? <li aria-hidden="true">/</li> : null}
                <li
                  className={
                    current || index === trail.length - 1
                      ? "font-semibold text-foreground"
                      : undefined
                  }
                >
                  {crumb.href ? (
                    <a href={crumb.href} className={linkClass}>
                      {crumb.label}
                    </a>
                  ) : (
                    <span aria-current="page">{crumb.label}</span>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </nav>
      <nav aria-label="Related topics" className="flex flex-wrap items-center gap-2 text-xs">
        <span className="mr-1 font-medium text-muted-foreground">Related Topics:</span>
        {MERCHANT_TOPICS.map((topic) => {
          const active = topic.slug === activeSlug;
          const chipClass = cn(
            "inline-flex min-h-8 items-center rounded-full px-2.5 py-1 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            active
              ? "bg-secondary text-secondary-foreground"
              : "bg-muted text-foreground hover:bg-secondary hover:text-secondary-foreground",
          );
          return active ? (
            <span key={topic.slug} aria-current="page" className={chipClass}>
              #{topic.label}
            </span>
          ) : (
            <a key={topic.slug} href={topic.href} className={chipClass}>
              #{topic.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
