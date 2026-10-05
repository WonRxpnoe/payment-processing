/**
 * Renders every browser and social image from the two brand SVGs so the tab
 * icon, the installed-app icon, and the share card all show the same artwork.
 *
 * Run: npm run brand:assets
 *
 * Outputs (all committed):
 *   public/favicon.svg            public/favicon.ico
 *   public/apple-touch-icon.png   public/icon-192.png
 *   public/icon-512.png           public/icon-maskable-512.png
 *   public/site.webmanifest       public/og/*.png  (one per SOCIAL_CARDS entry)
 *   scripts/brand-assets.lock.json (provenance, so stale output fails the tests)
 */
import { Resvg } from "@resvg/resvg-js";
import * as fontkit from "fontkit";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { optimize } from "svgo";

import { SOCIAL_CARDS } from "../src/lib/social-cards.ts";

const ROOT = join(dirname(new URL(import.meta.url).pathname), "..");
const PUBLIC = join(ROOT, "public");
const MARK_SVG = join(PUBLIC, "brand/kithpay-mark.svg");
const LOGO_SVG = join(PUBLIC, "brand/kithpay-logo.svg");

const LOCK_FILE = join(ROOT, "scripts/brand-assets.lock.json");

const FONT_CACHE = join(ROOT, "scripts/.font-cache");
const FONT_FILE = join(FONT_CACHE, "DMSans.ttf");
const FONT_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf";

/** Google palette already used by --chart-1..4 in src/styles.css. */
const BRAND = {
  blue: "#1A73E8",
  red: "#EA4335",
  yellow: "#FBBC04",
  green: "#34A853",
  ink: "#202124",
  muted: "#5F6368",
};

const SOURCE_FILES = [
  "public/brand/kithpay-logo.svg",
  "public/brand/kithpay-mark.svg",
  "src/lib/social-cards.ts",
  "scripts/generate-brand-assets.mjs",
];

// --- SVG helpers -----------------------------------------------------------

function readViewBox(svg) {
  const match = /viewBox="([^"]+)"/.exec(svg);
  if (!match) throw new Error("source SVG has no viewBox");
  const [x, y, width, height] = match[1].trim().split(/\s+/).map(Number);
  return { x, y, width, height };
}

/** Centers the artwork in a square box and leaves `pad` of breathing room. */
function squareViewBox(viewBox, pad) {
  const side = Math.max(viewBox.width, viewBox.height) * (1 + pad * 2);
  const centerX = viewBox.x + viewBox.width / 2;
  const centerY = viewBox.y + viewBox.height / 2;
  return `${centerX - side / 2} ${centerY - side / 2} ${side} ${side}`;
}

function withViewBox(svg, viewBox) {
  return svg.replace(/viewBox="[^"]+"/, `viewBox="${viewBox}"`);
}

function innerSvg(svg) {
  return svg.slice(svg.indexOf(">", svg.indexOf("<svg")) + 1, svg.lastIndexOf("</svg>"));
}

/** Namespaces ids so inlined artwork cannot collide with the card's own gradients. */
function prefixIds(svg, prefix) {
  return svg
    .replace(/ id="([^"]+)"/g, ` id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`);
}

function renderPng(svg, size, background) {
  return new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    ...(background ? { background } : {}),
  })
    .render()
    .asPng();
}

// --- ICO container ---------------------------------------------------------

/** Packs PNGs into an .ico; every browser since IE11 reads PNG-in-ICO. */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = header.length + images.length * 16;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

// --- Text as outlines ------------------------------------------------------

async function loadFont() {
  if (!existsSync(FONT_FILE)) {
    mkdirSync(FONT_CACHE, { recursive: true });
    const response = await fetch(FONT_URL);
    if (!response.ok) throw new Error(`font download failed: ${response.status}`);
    writeFileSync(FONT_FILE, Buffer.from(await response.arrayBuffer()));
  }
  return fontkit.create(readFileSync(FONT_FILE));
}

/**
 * Converts a line of text to outlines. resvg has no web-font loader, and
 * outlines also keep the card identical on machines without DM Sans.
 */
function textOutline(font, text, { x, baseline, size, weight, opticalSize, tracking = 0, fill }) {
  const instance = font.getVariation({ wght: weight, opsz: opticalSize });
  const run = instance.layout(text);
  const scale = size / font.unitsPerEm;
  const trackingUnits = tracking / scale;

  let cursor = 0;
  const glyphs = [];
  run.glyphs.forEach((glyph, index) => {
    const position = run.positions[index];
    const d = glyph.path.toSVG();
    if (d) {
      const dx = cursor + (position.xOffset ?? 0);
      const dy = position.yOffset ?? 0;
      glyphs.push(`<path transform="translate(${dx} ${dy})" d="${d}"/>`);
    }
    cursor += (position.xAdvance ?? 0) + trackingUnits;
  });

  return {
    width: (cursor - trackingUnits) * scale,
    svg: `<g fill="${fill}" transform="translate(${x} ${baseline}) scale(${scale} ${-scale})">${glyphs.join("")}</g>`,
  };
}

function measure(font, text, options) {
  return textOutline(font, text, { ...options, x: 0, baseline: 0, fill: "none" }).width;
}

function wrapText(font, text, maxWidth, options) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(font, candidate, options) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// --- Social card -----------------------------------------------------------

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

const HEADLINE_STYLE = { weight: 700, opticalSize: 40, tracking: -1 };
const SUBLINE_STYLE = { weight: 500, opticalSize: 24, tracking: 0 };
const HEADLINE_SIZES = [62, 56, 50, 45];
const SUBLINE_SIZES = [27, 25, 23];
const BLOCK_GAP = 72;

/** Baselines sit on the type's own metrics, so measure the visual extent. */
const CAP_HEIGHT = 0.72;
const DESCENDER = 0.26;

function wrapAt(font, text, size, style, column) {
  const options = { ...style, size };
  return { ...options, lines: wrapText(font, text, column, options) };
}

function blockHeight(headline, subline) {
  return (
    headline.size * CAP_HEIGHT +
    (headline.lines.length - 1) * Math.round(headline.size * 1.22) +
    BLOCK_GAP +
    (subline.lines.length - 1) * Math.round(subline.size * 1.45) +
    subline.size * DESCENDER
  );
}

/**
 * Card titles run from "Merchant Academy" to sixty-plus characters, so the type
 * steps down until the whole block clears the logo and the bottom edge. Without
 * the height check a three-line headline rides up over the logo.
 */
function fitCard(font, card, { column, available }) {
  let fallback;
  for (const headlineSize of HEADLINE_SIZES) {
    const headline = wrapAt(font, card.title, headlineSize, HEADLINE_STYLE, column);
    if (headline.lines.length > 3) continue;
    for (const sublineSize of SUBLINE_SIZES) {
      const subline = wrapAt(font, card.description, sublineSize, SUBLINE_STYLE, column);
      if (subline.lines.length > 4) continue;
      fallback ??= { headline, subline };
      if (blockHeight(headline, subline) <= available) return { headline, subline };
    }
  }
  return (
    fallback ?? {
      headline: wrapAt(font, card.title, 45, HEADLINE_STYLE, column),
      subline: wrapAt(font, card.description, 23, SUBLINE_STYLE, column),
    }
  );
}

function socialCardSvg(font, logo, card) {
  const width = CARD_WIDTH;
  const height = CARD_HEIGHT;
  const margin = 88;
  const column = width - margin * 2 - 252;

  const logoWidth = 348;
  const logoBox = readViewBox(logo);
  const logoHeight = (logoWidth * logoBox.height) / logoBox.width;
  const logoTop = 76;

  const band = { top: logoTop + logoHeight + 28, bottom: height - 64 };
  const { headline, subline } = fitCard(font, card, {
    column,
    available: band.bottom - band.top,
  });

  const headlineLeading = Math.round(headline.size * 1.22);
  const sublineLeading = Math.round(subline.size * 1.45);

  // Centre the block on its visual extent, but never let it climb into the logo.
  const textHeight = blockHeight(headline, subline);
  const visualTop = Math.max(band.top, (band.top + band.bottom) / 2 - textHeight / 2);
  const firstBaseline = visualTop + headline.size * CAP_HEIGHT;
  const sublineFirstBaseline =
    firstBaseline + (headline.lines.length - 1) * headlineLeading + BLOCK_GAP;

  const text = [
    ...headline.lines.map((line, index) =>
      textOutline(font, line, {
        ...headline,
        x: margin,
        baseline: firstBaseline + index * headlineLeading,
        fill: BRAND.ink,
      }),
    ),
    ...subline.lines.map((line, index) =>
      textOutline(font, line, {
        ...subline,
        x: margin,
        baseline: sublineFirstBaseline + index * sublineLeading,
        fill: BRAND.muted,
      }),
    ),
  ]
    .map((line) => line.svg)
    .join("");

  const bars = [BRAND.blue, BRAND.red, BRAND.yellow, BRAND.green]
    .map(
      (color, index) =>
        `<rect x="${(index * width) / 4}" y="0" width="${width / 4}" height="12" fill="${color}"/>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="blueGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1108 86) scale(560)">
      <stop offset="0" stop-color="${BRAND.blue}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${BRAND.blue}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="greenGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1142 596) scale(420)">
      <stop offset="0" stop-color="${BRAND.green}" stop-opacity="0.14"/>
      <stop offset="1" stop-color="${BRAND.green}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <rect width="${width}" height="${height}" fill="url(#blueGlow)"/>
  <rect width="${width}" height="${height}" fill="url(#greenGlow)"/>
  ${bars}
  <svg x="${margin}" y="${logoTop}" width="${logoWidth}" height="${logoHeight}" viewBox="${logoBox.x} ${logoBox.y} ${logoBox.width} ${logoBox.height}">${innerSvg(prefixIds(logo, "logo"))}</svg>
  ${text}
</svg>`;
}

/**
 * The mark is drawn as ~1100 absolute cubics, each repeating its command letter
 * and padding coordinates to two decimals, which costs 51KB on a file browsers
 * fetch to draw a 16px tab. Rewriting the path data without that redundancy
 * halves it and renders byte-identically from 16px to 512px.
 *
 * The geometric approximations are deliberately off. They would reach 20KB, but
 * they nudge edges at 128px and up, and the whole point of shipping SVG is that
 * it stays exact at any size. Precision is left high for the same reason: the
 * savings here come from syntax, not from throwing away coordinates.
 *
 * Only favicon.svg ships as vector text, so only it is shrunk; every PNG still
 * rasterises from the untouched artwork.
 */
function shrinkSvg(svg) {
  const { data } = optimize(svg, {
    multipass: true,
    plugins: [
      "removeComments",
      "removeMetadata",
      // removeTitle/removeDesc are omitted on purpose: the mark names itself
      // through aria-labelledby, so dropping <title> leaves the icon unlabelled.
      "cleanupNumericValues",
      "collapseGroups",
      "removeEmptyContainers",
      {
        name: "convertPathData",
        params: {
          floatPrecision: 5,
          straightCurves: false,
          convertToQ: false,
          curveSmoothShorthands: false,
          lineShorthands: false,
          utilizeAbsolute: false,
        },
      },
    ],
  });
  return `${data.trimEnd()}\n`;
}

// --- Build -----------------------------------------------------------------

const mark = readFileSync(MARK_SVG, "utf8");
const logo = readFileSync(LOGO_SVG, "utf8");
const markBox = readViewBox(mark);

const tabMark = withViewBox(mark, squareViewBox(markBox, 0.03));
const appMark = withViewBox(mark, squareViewBox(markBox, 0.12));
const maskableMark = withViewBox(mark, squareViewBox(markBox, 0.3));

writeFileSync(join(PUBLIC, "favicon.svg"), shrinkSvg(tabMark));

writeFileSync(
  join(PUBLIC, "favicon.ico"),
  buildIco([16, 32, 48].map((size) => ({ size, png: renderPng(tabMark, size) }))),
);

writeFileSync(join(PUBLIC, "apple-touch-icon.png"), renderPng(appMark, 180, "#ffffff"));
writeFileSync(join(PUBLIC, "icon-192.png"), renderPng(tabMark, 192));
writeFileSync(join(PUBLIC, "icon-512.png"), renderPng(tabMark, 512));
writeFileSync(join(PUBLIC, "icon-maskable-512.png"), renderPng(maskableMark, 512, "#ffffff"));

const font = await loadFont();
mkdirSync(join(PUBLIC, "og"), { recursive: true });
for (const card of Object.values(SOCIAL_CARDS)) {
  writeFileSync(
    join(PUBLIC, "og", card.file),
    renderPng(socialCardSvg(font, logo, card), CARD_WIDTH),
  );
}

const OUTPUT_FILES = [
  "public/favicon.svg",
  "public/favicon.ico",
  "public/apple-touch-icon.png",
  "public/icon-192.png",
  "public/icon-512.png",
  "public/icon-maskable-512.png",
  ...Object.values(SOCIAL_CARDS).map((card) => `public/og/${card.file}`),
];

const manifest = {
  id: "/",
  name: "KithPay",
  short_name: "KithPay",
  description: SOCIAL_CARDS.home.description,
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: BRAND.blue,
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};
writeFileSync(join(PUBLIC, "site.webmanifest"), `${JSON.stringify(manifest, null, 2)}\n`);

/**
 * Records what the committed artwork was rendered from and what came out of it.
 * Rendering is deterministic, so the smoke test checks both halves against the
 * working tree: `sources` catches a logo or copy edit that was never
 * regenerated, `outputs` catches an image that was hand-edited or swapped.
 */
const digest = (file) =>
  createHash("sha256")
    .update(readFileSync(join(ROOT, file)))
    .digest("hex");
const lock = {
  note: "Generated by scripts/generate-brand-assets.mjs — run `npm run brand:assets` to refresh.",
  sources: Object.fromEntries(SOURCE_FILES.map((file) => [file, digest(file)])),
  outputs: Object.fromEntries(OUTPUT_FILES.map((file) => [file, digest(file)])),
};
writeFileSync(LOCK_FILE, `${JSON.stringify(lock, null, 2)}\n`);

console.log(`brand assets written to public/ (${Object.keys(SOCIAL_CARDS).length} share cards)`);
