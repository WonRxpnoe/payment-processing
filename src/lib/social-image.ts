/**
 * Browser icon and share-card wiring. Every file referenced here is rendered
 * from the brand SVGs by scripts/generate-brand-assets.mjs — regenerate with
 * `npm run brand:assets` after the logo or the card copy changes.
 */
import { SOCIAL_CARDS, type SocialCardVariant } from "./social-cards";

export const SOCIAL_IMAGE_DIR = "/og";
export const SOCIAL_IMAGE_WIDTH = 1200;
export const SOCIAL_IMAGE_HEIGHT = 630;
export const SOCIAL_IMAGE_TYPE = "image/png";

/** Matches --chart-1 in src/styles.css and the blue in the logo gradient. */
export const BRAND_THEME_COLOR = "#1A73E8";

export const BRAND_ICON_LINKS = [
  { rel: "icon", href: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
  { rel: "manifest", href: "/site.webmanifest" },
];

export function socialCardPath(variant: SocialCardVariant = "home"): string {
  return `${SOCIAL_IMAGE_DIR}/${SOCIAL_CARDS[variant].file}`;
}

/** Describes what the card actually renders: the logo plus the card title. */
export function socialCardAlt(variant: SocialCardVariant = "home"): string {
  return `KithPay — ${SOCIAL_CARDS[variant].title}`;
}

/**
 * Crawlers reject relative image URLs, so the card is only advertised once the
 * request origin is known.
 */
export function socialImageMeta(origin: string | undefined, variant: SocialCardVariant = "home") {
  if (!origin) return [];
  const href = `${origin}${socialCardPath(variant)}`;
  const alt = socialCardAlt(variant);
  return [
    { property: "og:image", content: href },
    { property: "og:image:type", content: SOCIAL_IMAGE_TYPE },
    { property: "og:image:width", content: String(SOCIAL_IMAGE_WIDTH) },
    { property: "og:image:height", content: String(SOCIAL_IMAGE_HEIGHT) },
    { property: "og:image:alt", content: alt },
    { name: "twitter:image", content: href },
    { name: "twitter:image:alt", content: alt },
  ];
}
