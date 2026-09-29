export const SITE_PREVIEW_COOKIE = "kithpay_preview";
export const SITE_PREVIEW_MAX_AGE = 60 * 60 * 24 * 365;

export type SitePreviewDecision = {
  preview: boolean;
  redirectHref?: string;
  setCookie?: string;
};

export function previewCookie(value: "1" | "0", secure: boolean): string {
  const maxAge = value === "1" ? SITE_PREVIEW_MAX_AGE : 0;
  const stored = value === "1" ? "1" : "";
  const securePart = secure ? "; Secure" : "";
  return `${SITE_PREVIEW_COOKIE}=${stored}; Path=/; Max-Age=${maxAge}; SameSite=Lax${securePart}`;
}

export function decideSitePreview(input: {
  href: string;
  cookie: string | undefined;
}): SitePreviewDecision {
  const url = new URL(input.href);
  const flag = url.searchParams.get("preview");
  const secure = url.protocol === "https:";

  if (flag === "1" || flag === "0") {
    url.searchParams.delete("preview");
    return {
      preview: flag === "1",
      redirectHref: `${url.pathname}${url.search}${url.hash}`,
      setCookie: previewCookie(flag === "1" ? "1" : "0", secure),
    };
  }

  return { preview: input.cookie === "1" };
}
