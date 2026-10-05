/**
 * Brand assets — smoke mock.
 * Machine-only: the thicken pass (a share card per page) and the gap-fill pass
 * (provenance lock, rendered-pixel checks, single origin reader).
 * No network. Run: npm run test:smoke
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

import { ACADEMY_RISK_SOCIAL_DESCRIPTION, ACADEMY_RISK_TITLE } from "./academy-risk-seo";
import {
  ACADEMY_ADVANCED_SOCIAL_DESCRIPTION,
  ACADEMY_ADVANCED_SOCIAL_TITLE,
} from "./academy-advanced-seo";
import {
  MERCHANT_HEALTH_SOCIAL_DESCRIPTION,
  MERCHANT_HEALTH_SOCIAL_TITLE,
} from "./merchant-health-seo";
import { SOCIAL_CARDS, type SocialCardVariant } from "./social-cards";
import {
  BRAND_ICON_LINKS,
  BRAND_THEME_COLOR,
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_WIDTH,
  socialCardAlt,
  socialCardPath,
  socialImageMeta,
} from "./social-image";

const SITE_DESCRIPTION =
  "Stable, transparent payment processing for high-risk businesses — with the guidance to grow safely.";

function read(path: string): Buffer {
  return readFileSync(join(process.cwd(), path));
}

function readPublic(path: string): Buffer {
  return read(join("public", path.replace(/^\//, "")));
}

function source(path: string): string {
  return read(path).toString("utf8");
}

// --- PNG inspection --------------------------------------------------------

type Pixel = { r: number; g: number; b: number; a: number };

/**
 * Minimal reader for the 8-bit RGBA, non-interlaced PNGs resvg emits. Decoding
 * the pixels is what catches a card that rasterised without its text or logo —
 * the headers alone look fine in that case.
 */
function decodePng(file: Buffer) {
  expect(file.subarray(1, 4).toString("ascii"), "PNG signature").toBe("PNG");
  const width = file.readUInt32BE(16);
  const height = file.readUInt32BE(20);
  expect(file.readUInt8(24), "bit depth").toBe(8);
  expect(file.readUInt8(25), "colour type").toBe(6);
  expect(file.readUInt8(28), "interlace").toBe(0);

  const chunks: Buffer[] = [];
  let offset = 8;
  while (offset + 8 <= file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "IDAT") chunks.push(file.subarray(offset + 8, offset + 8 + length));
    if (type === "IEND") break;
    offset += 12 + length;
  }

  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  const paeth = (left: number, up: number, upLeft: number) => {
    const base = left + up - upLeft;
    const dLeft = Math.abs(base - left);
    const dUp = Math.abs(base - up);
    const dUpLeft = Math.abs(base - upLeft);
    if (dLeft <= dUp && dLeft <= dUpLeft) return left;
    return dUp <= dUpLeft ? up : upLeft;
  };

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    const filter = raw.readUInt8(rowStart);
    for (let x = 0; x < stride; x += 1) {
      const left = x >= 4 ? pixels.readUInt8(y * stride + x - 4) : 0;
      const up = y > 0 ? pixels.readUInt8((y - 1) * stride + x) : 0;
      const upLeft = x >= 4 && y > 0 ? pixels.readUInt8((y - 1) * stride + x - 4) : 0;
      const value = raw.readUInt8(rowStart + 1 + x);
      let decoded = value;
      if (filter === 1) decoded = value + left;
      else if (filter === 2) decoded = value + up;
      else if (filter === 3) decoded = value + ((left + up) >> 1);
      else if (filter === 4) decoded = value + paeth(left, up, upLeft);
      pixels.writeUInt8(decoded & 0xff, y * stride + x);
    }
  }

  const at = (x: number, y: number): Pixel => {
    const index = (y * width + x) * 4;
    return {
      r: pixels.readUInt8(index),
      g: pixels.readUInt8(index + 1),
      b: pixels.readUInt8(index + 2),
      a: pixels.readUInt8(index + 3),
    };
  };

  function count(predicate: (pixel: Pixel, x: number, y: number) => boolean): number {
    let total = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (predicate(at(x, y), x, y)) total += 1;
      }
    }
    return total;
  }

  /** Bounding box of the matching pixels, or null when nothing matches. */
  function bounds(predicate: (pixel: Pixel, x: number, y: number) => boolean) {
    let top = Infinity;
    let left = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (!predicate(at(x, y), x, y)) continue;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
    return right < left ? null : { top, left, right, bottom };
  }

  return { width, height, at, count, bounds, area: width * height };
}

function hex({ r, g, b }: Pixel): string {
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

function icoEntries(file: Buffer) {
  expect(file.readUInt16LE(0), "ICO reserved field").toBe(0);
  expect(file.readUInt16LE(2), "ICO image type").toBe(1);
  const count = file.readUInt16LE(4);
  return Array.from({ length: count }, (_, index) => {
    const entry = 6 + index * 16;
    // ICO directory fields are little-endian, unlike the PNGs they carry.
    const length = file.readUInt32LE(entry + 8);
    const start = file.readUInt32LE(entry + 12);
    return {
      declared: file.readUInt8(entry),
      image: file.subarray(start, start + length),
    };
  });
}

// --- Fixtures --------------------------------------------------------------

const ROUTES: Record<SocialCardVariant, string> = {
  home: "src/routes/index.tsx",
  merchantHealth: "src/routes/merchant-health.tsx",
  academy: "src/routes/academy/index.tsx",
  academyRisk: "src/routes/academy/merchant-risk-fundamentals.tsx",
  academyAdvanced: "src/routes/academy/advanced-merchant-guides.tsx",
  resources: "src/routes/resources.tsx",
};

/** The card omits the brand, because the logo is already on the artwork. */
function cardTitleFor(pageTitle: string): string {
  return pageTitle.replace(/^KithPay\s—\s/, "").replace(/\s\|\s.+$/, "");
}

/**
 * `refs` names the constants a route shares with this file; an empty list means
 * the route spells its social copy out inline, so the literal is checked there.
 */
const PAGE_COPY: Array<{
  variant: SocialCardVariant;
  pageTitle: string;
  pageDescription: string;
  refs: string[];
}> = [
  {
    variant: "home",
    pageTitle: "KithPay — Payment Infrastructure for High-Risk Merchants",
    pageDescription: SITE_DESCRIPTION,
    refs: [],
  },
  {
    variant: "merchantHealth",
    pageTitle: MERCHANT_HEALTH_SOCIAL_TITLE,
    pageDescription: MERCHANT_HEALTH_SOCIAL_DESCRIPTION,
    refs: ["MERCHANT_HEALTH_SOCIAL_TITLE", "MERCHANT_HEALTH_SOCIAL_DESCRIPTION"],
  },
  {
    variant: "academy",
    pageTitle: "Merchant Academy | KithPay",
    pageDescription:
      "Payment lessons for merchants on risk, disputes, merchant records, account architecture, processing pricing, outsourced PCI, and recurring billing.",
    refs: [],
  },
  {
    variant: "academyRisk",
    pageTitle: ACADEMY_RISK_TITLE,
    pageDescription: ACADEMY_RISK_SOCIAL_DESCRIPTION,
    refs: ["ACADEMY_RISK_TITLE", "ACADEMY_RISK_SOCIAL_DESCRIPTION"],
  },
  {
    variant: "academyAdvanced",
    pageTitle: ACADEMY_ADVANCED_SOCIAL_TITLE,
    pageDescription: ACADEMY_ADVANCED_SOCIAL_DESCRIPTION,
    refs: ["ACADEMY_ADVANCED_SOCIAL_TITLE", "ACADEMY_ADVANCED_SOCIAL_DESCRIPTION"],
  },
  {
    variant: "resources",
    pageTitle: "Merchant Resources | KithPay",
    pageDescription:
      "Guides and topics for merchant account health, risk management, rolling reserves, chargebacks, acquirer underwriting, and settlement cycles.",
    refs: [],
  },
];

const root = source("src/routes/__root.tsx");
const generator = source("scripts/generate-brand-assets.mjs");
const manifest = JSON.parse(readPublic("/site.webmanifest").toString("utf8"));
const lock = JSON.parse(source("scripts/brand-assets.lock.json"));
const variants = Object.keys(SOCIAL_CARDS) as SocialCardVariant[];

function sha256(path: string): string {
  return createHash("sha256").update(read(path)).digest("hex");
}

const CARD_MARGIN = 88;
/** The logo occupies the top-left corner; type must stay clear of it. */
const LOGO_FLOOR = 210;

describe("brand assets — thicken", () => {
  it("renders one card per page at the size crawlers expect", () => {
    expect(variants.length).toBe(PAGE_COPY.length);
    const files = new Set(variants.map((variant) => SOCIAL_CARDS[variant].file));
    expect(files.size, "each card writes its own file").toBe(variants.length);

    for (const variant of variants) {
      const card = decodePng(readPublic(socialCardPath(variant)));
      expect({ width: card.width, height: card.height }, variant).toEqual({
        width: SOCIAL_IMAGE_WIDTH,
        height: SOCIAL_IMAGE_HEIGHT,
      });
    }
  });

  it("paints the brand bar, the logo, and the copy onto every card", () => {
    for (const variant of variants) {
      const card = decodePng(readPublic(socialCardPath(variant)));

      // The four-colour bar mirrors --chart-1..4 on the site itself.
      expect(
        [150, 450, 750, 1050].map((x) => hex(card.at(x, 5))),
        variant,
      ).toEqual(["#1a73e8", "#ea4335", "#fbbc04", "#34a853"]);
      expect(hex(card.at(600, 600)), `${variant} keeps a light field`).toBe("#ffffff");

      const logoBlue = card.count(
        (pixel, x, y) =>
          y >= 76 && y <= 200 && x >= 88 && x <= 440 && pixel.b > 150 && pixel.b - pixel.r > 60,
      );
      expect(logoBlue, `${variant} draws the logo`).toBeGreaterThan(2000);

      const inkedText = card.count(
        (pixel, x, y) =>
          y > 170 && y < 540 && x > 70 && x < 960 && pixel.r + pixel.g + pixel.b < 220,
      );
      expect(inkedText, `${variant} sets its headline and description`).toBeGreaterThan(4000);
    }
  });

  it("keeps the type inside its margins and clear of the logo", () => {
    for (const variant of variants) {
      const card = decodePng(readPublic(socialCardPath(variant)));
      // The navy half of the wordmark is dark and unsaturated like the copy, so
      // the type is measured below the logo rather than across the whole card.
      const type = card.bounds(
        (pixel, _x, y) =>
          y >= LOGO_FLOOR &&
          (pixel.r + pixel.g + pixel.b) / 3 < 150 &&
          Math.max(pixel.r, pixel.g, pixel.b) - Math.min(pixel.r, pixel.g, pixel.b) < 45,
      );

      expect(type, `${variant} renders type below the logo`).not.toBeNull();
      if (!type) continue;
      expect(type.left, `${variant} left margin`).toBeGreaterThanOrEqual(CARD_MARGIN - 2);
      expect(type.right, `${variant} overruns the right margin`).toBeLessThanOrEqual(
        card.width - CARD_MARGIN,
      );
      expect(type.bottom, `${variant} runs off the bottom edge`).toBeLessThanOrEqual(
        card.height - 40,
      );

      const logoBottom = card.bounds(
        (pixel, _x, y) =>
          y > 14 &&
          y < LOGO_FLOOR &&
          Math.max(pixel.r, pixel.g, pixel.b) - Math.min(pixel.r, pixel.g, pixel.b) > 60,
      )?.bottom;
      expect(logoBottom, `${variant} draws the mark`).toBeDefined();
      expect(type.top - (logoBottom ?? 0), `${variant} crowds the logo`).toBeGreaterThan(8);
    }
  });

  it("keeps card copy identical to the page it represents", () => {
    for (const { variant, pageTitle, pageDescription, refs } of PAGE_COPY) {
      const card = SOCIAL_CARDS[variant];
      expect(card.title, `${variant} title`).toBe(cardTitleFor(pageTitle));
      expect(card.description, `${variant} description`).toBe(pageDescription);

      const route = source(ROUTES[variant]);
      if (refs.length === 0) {
        expect(route, `${ROUTES[variant]} publishes that title`).toContain(pageTitle);
        expect(route, `${ROUTES[variant]} publishes that description`).toContain(pageDescription);
      } else {
        for (const ref of refs) {
          expect(route, `${ROUTES[variant]} reads ${ref}`).toContain(ref);
        }
      }
    }
  });

  it("points each route at its own card and nowhere else", () => {
    for (const variant of variants) {
      const route = source(ROUTES[variant]);
      if (variant === "home") {
        expect(root).toContain("...socialImageMeta(loaderData?.origin)");
        expect(socialCardPath()).toBe(socialCardPath("home"));
      } else {
        expect(route, ROUTES[variant]).toContain(
          `...socialImageMeta(loaderData?.origin, "${variant}")`,
        );
      }
      // One wiring path only: no page hand-rolls its own image tags.
      expect(route, ROUTES[variant]).not.toContain('"og:image"');
      expect(route, ROUTES[variant]).not.toContain('"twitter:image"');
    }

    const tags = source("src/routes/tags/$slug.tsx");
    expect(tags, "topic pages follow their hub").toContain(
      '...socialImageMeta(loaderData?.origin, topic?.academy ? "academy" : "resources")',
    );
  });

  it("describes what the card actually shows", () => {
    for (const variant of variants) {
      expect(socialCardAlt(variant)).toBe(`KithPay — ${SOCIAL_CARDS[variant].title}`);
    }
    const meta = socialImageMeta("https://example.com", "academy");
    const byKey = Object.fromEntries(
      meta.map((tag) => [("property" in tag ? tag.property : tag.name) as string, tag.content]),
    );
    expect(byKey["og:image"]).toBe("https://example.com/og/og-academy.png");
    expect(byKey["twitter:image"]).toBe("https://example.com/og/og-academy.png");
    expect(byKey["og:image:width"]).toBe(String(SOCIAL_IMAGE_WIDTH));
    expect(byKey["og:image:height"]).toBe(String(SOCIAL_IMAGE_HEIGHT));
    expect(byKey["og:image:alt"]).toBe(socialCardAlt("academy"));
    expect(byKey["twitter:image:alt"]).toBe(socialCardAlt("academy"));
  });
});

describe("brand assets — fill gaps", () => {
  it("fails when the committed artwork is older than its sources", () => {
    expect(Object.keys(lock.sources).sort()).toEqual([
      "public/brand/kithpay-logo.svg",
      "public/brand/kithpay-mark.svg",
      "scripts/generate-brand-assets.mjs",
      "src/lib/social-cards.ts",
    ]);
    for (const [file, expected] of Object.entries(lock.sources)) {
      expect(sha256(file), `${file} changed — run \`npm run brand:assets\``).toBe(expected);
    }
  });

  it("fails when an image was hand-edited or swapped for another", () => {
    // Pins file-to-artwork: without this, moving og-resources.png over
    // og-academy.png passes every other check in this file.
    const expectedOutputs = [
      "public/apple-touch-icon.png",
      "public/favicon.ico",
      "public/favicon.svg",
      "public/icon-192.png",
      "public/icon-512.png",
      "public/icon-maskable-512.png",
      ...variants.map((variant) => `public${socialCardPath(variant)}`),
    ].sort();
    expect(Object.keys(lock.outputs).sort()).toEqual(expectedOutputs);

    for (const [file, expected] of Object.entries(lock.outputs)) {
      expect(sha256(file), `${file} does not match the recorded render`).toBe(expected);
    }
  });

  it("serves the tab icon without the artwork's redundant path data", () => {
    // The brand mark is 51KB of padded coordinates; browsers fetch this file to
    // draw 16 pixels. Shrinking it is only safe while it still renders exactly,
    // so the budget and the pixels are checked together.
    const svg = readPublic("/favicon.svg");
    expect(svg.byteLength, "favicon.svg grew past its budget").toBeLessThan(32 * 1024);

    const source = read("public/brand/kithpay-mark.svg");
    expect(svg.byteLength, "favicon.svg is no smaller than the raw artwork").toBeLessThan(
      source.byteLength * 0.6,
    );

    // Lossless means lossless: no geometric approximation may be enabled.
    for (const lossy of ["straightCurves", "convertToQ", "curveSmoothShorthands"]) {
      expect(generator, `${lossy} nudges edges at larger sizes`).toContain(`${lossy}: false`);
    }
  });

  it("ships a tab icon at every size a browser asks for", () => {
    const entries = icoEntries(readPublic("/favicon.ico"));
    expect(entries.map((entry) => entry.declared)).toEqual([16, 32, 48]);
    for (const entry of entries) {
      const icon = decodePng(entry.image);
      expect({ width: icon.width, height: icon.height }).toEqual({
        width: entry.declared,
        height: entry.declared,
      });
      expect(
        icon.count((pixel) => pixel.a > 16),
        `${entry.declared}px artwork`,
      ).toBeGreaterThan(icon.area * 0.1);
    }

    const svg = readPublic("/favicon.svg").toString("utf8");
    const [, , boxWidth = 0, boxHeight = 0] = (/viewBox="([^"]+)"/.exec(svg)?.[1] ?? "")
      .split(" ")
      .map(Number);
    expect(boxWidth).toBeGreaterThan(0);
    expect(boxWidth, "square viewBox so the mark is never squashed").toBeCloseTo(boxHeight, 5);
    expect(svg).toContain("<title");
  });

  it("renders both halves of the mark into the app icons", () => {
    for (const file of ["/icon-192.png", "/icon-512.png", "/icon-maskable-512.png"]) {
      const icon = decodePng(readPublic(file));
      const blue = icon.count((p) => p.a > 200 && p.b > 120 && p.b - p.g > 30);
      const green = icon.count((p) => p.a > 200 && p.g > 120 && p.g - p.b > 30);
      expect(blue / icon.area, `${file} blue body`).toBeGreaterThan(0.05);
      expect(green / icon.area, `${file} green rib`).toBeGreaterThan(0.02);
    }

    // iOS composites the home-screen icon on its own background.
    const apple = decodePng(readPublic("/apple-touch-icon.png"));
    expect({ width: apple.width, height: apple.height }).toEqual({ width: 180, height: 180 });
    expect(
      apple.count((pixel) => pixel.a === 255),
      "fully opaque",
    ).toBe(apple.area);

    const maskable = decodePng(readPublic("/icon-maskable-512.png"));
    expect(
      maskable.count((pixel) => pixel.a > 16 && pixel.r < 250),
      "maskable padding keeps the mark inside the safe zone",
    ).toBeLessThan(maskable.area * 0.45);
  });

  it("keeps the manifest pointing at icons that exist", () => {
    expect(manifest.id).toBe("/");
    expect(manifest.name).toBe("KithPay");
    expect(manifest.theme_color).toBe(BRAND_THEME_COLOR);
    expect(manifest.background_color).toBe("#ffffff");
    expect(manifest.description).toBe(SOCIAL_CARDS.home.description);
    expect(manifest.icons.map((icon: { purpose: string }) => icon.purpose)).toContain("maskable");
    for (const icon of manifest.icons as Array<{ src: string; sizes: string }>) {
      const [declared] = icon.sizes.split("x").map(Number);
      expect(decodePng(readPublic(icon.src)).width, icon.src).toBe(declared);
    }
  });

  it("puts the icons, manifest, and theme colour in the document head", () => {
    expect(root).toContain("...BRAND_ICON_LINKS");
    expect(root).toContain('{ name: "theme-color", content: BRAND_THEME_COLOR }');
    expect(root).toContain('{ property: "og:site_name", content: "KithPay" }');
    expect(root).toContain("origin: readOrigin()");

    const rels = BRAND_ICON_LINKS.map((link) => link.rel);
    expect(rels).toContain("apple-touch-icon");
    expect(rels).toContain("manifest");
    expect(BRAND_ICON_LINKS.filter((link) => link.rel === "icon")).toHaveLength(2);
    for (const link of BRAND_ICON_LINKS) {
      if (link.href.endsWith(".webmanifest")) continue;
      expect(readPublic(link.href).byteLength, link.href).toBeGreaterThan(0);
    }
  });

  it("emits nothing rather than a relative URL crawlers would reject", () => {
    expect(socialImageMeta(undefined)).toEqual([]);
    expect(socialImageMeta("")).toEqual([]);
    expect(socialImageMeta("", "academy")).toEqual([]);
  });

  it("resolves the request origin in exactly one place", () => {
    const readers = [...Object.values(ROUTES), "src/routes/tags/$slug.tsx"];
    for (const route of readers) {
      const text = source(route);
      expect(text, `${route} should import readOrigin`).not.toContain(
        "const readOrigin = createIsomorphicFn()",
      );
      expect(text, `${route} imports the shared reader`).toMatch(
        /from "\.\.\/(\.\.\/)?lib\/request-origin"/,
      );
    }
  });

  it("keeps the generator free of hardcoded card copy", () => {
    expect(generator).toContain('from "../src/lib/social-cards.ts"');
    expect(generator).toContain("Object.values(SOCIAL_CARDS)");
    expect(generator).not.toContain(SITE_DESCRIPTION);
  });
});
