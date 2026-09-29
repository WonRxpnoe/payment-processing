/**
 * Site preview gate — smoke mock.
 * Machine-only: the private cookie decision. No network.
 * Run: npm run test:smoke
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ComingSoonCover } from "../components/ComingSoonCover";
import { decideSitePreview, SITE_PREVIEW_COOKIE } from "./site-preview";

const root = process.cwd();

describe("site preview gate", () => {
  it("keeps the public cover closed", () => {
    const html = renderToStaticMarkup(<ComingSoonCover />);
    expect(html).toContain("Coming soon");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("Open site");
    expect(html).not.toContain("yourdomain.com");
  });

  it("opens only for the private preview cookie", () => {
    expect(
      decideSitePreview({ href: "https://kithpay.example/", cookie: undefined }).preview,
    ).toBe(false);
    expect(
      decideSitePreview({ href: "https://kithpay.example/academy", cookie: undefined }).preview,
    ).toBe(false);

    const unlock = decideSitePreview({
      href: "https://kithpay.example/academy?preview=1",
      cookie: undefined,
    });
    expect(unlock.preview).toBe(true);
    expect(unlock.redirectHref).toBe("/academy");
    expect(unlock.setCookie).toContain(`${SITE_PREVIEW_COOKIE}=1`);

    expect(
      decideSitePreview({ href: "https://kithpay.example/", cookie: "1" }).preview,
    ).toBe(true);
    expect(
      decideSitePreview({ href: "https://kithpay.example/", cookie: "1" }).redirectHref,
    ).toBeUndefined();

    const lock = decideSitePreview({
      href: "http://localhost:5173/?preview=0",
      cookie: "1",
    });
    expect(lock.preview).toBe(false);
    expect(lock.redirectHref).toBe("/");
    expect(lock.setCookie).toContain("Max-Age=0");
    expect(lock.setCookie).not.toContain("Secure");
  });

  it("wraps every page and leaves the homepage markup in place", () => {
    const shell = readFileSync(join(root, "src/routes/__root.tsx"), "utf8");
    const home = readFileSync(join(root, "src/routes/index.tsx"), "utf8");
    expect(shell).toContain("decideSitePreview");
    expect(shell).toContain("<ComingSoonCover />");
    expect(shell).toContain("<Outlet />");
    expect(home).not.toContain("ComingSoonCover");
    expect(home).toContain("<EducationSection /><MerchantHealth /><Diagnostics />");
  });
});
