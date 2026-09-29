import { Fragment } from "react";
import { EXPANDED_GUIDES_LABEL } from "../lib/academy-advanced-seo";
import { ACADEMY_PATH } from "../lib/academy-risk-seo";
import { ACADEMY_VIEW_ALL_TOPICS } from "../lib/academy-taxonomy";
import { cn } from "../lib/utils";

type Crumb = { label: string; href?: string };

const linkClass =
  "inline-flex min-h-6 items-center underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function ViewAllAcademyHeaderNav({
  crumbs,
  activeSlug,
  className,
  showBreadcrumb = true,
}: {
  crumbs?: readonly Crumb[];
  activeSlug?: string;
  className?: string;
  showBreadcrumb?: boolean;
}) {
  const trail: readonly Crumb[] = crumbs ?? [
    { label: "Home", href: "/" },
    { label: "Merchant Academy", href: ACADEMY_PATH },
    { label: EXPANDED_GUIDES_LABEL },
  ];

  return (
    <div className={cn("mb-8 border-b border-border pb-4", className)}>
      {showBreadcrumb ? <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          {trail.map((crumb, index) => {
            const current = !crumb.href;
            return (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 ? (
                  <li aria-hidden="true">
                    <span>/</span>
                  </li>
                ) : null}
                <li className={current ? "font-semibold text-foreground" : undefined}>
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
      </nav> : null}
      <nav aria-label="Deep dive topics" className="flex flex-wrap items-center gap-2 text-xs">
        <span className="mr-1 font-medium text-muted-foreground">Deep Dive Topics:</span>
        {ACADEMY_VIEW_ALL_TOPICS.map((topic) => {
          const active = topic.slug === activeSlug;
          const chipClass = cn(
            "inline-flex min-h-8 items-center rounded-full px-3 py-1 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
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
