/**
 * KithPay logo — smoke mock.
 * Machine-only: SVG binaries on disk + component markup. No network.
 * Run: npm run test:smoke
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { KithPayLogo } from "./KithPayLogo";

const root = process.cwd();

const LOGO_FILES = {
  full: "public/brand/kithpay-logo.svg",
  mark: "public/brand/kithpay-mark.svg",
} as const;

function readRepo(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

function viewBoxSize(svg: string): { width: number; height: number } {
  const match = svg.match(/viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/);
  expect(match, "viewBox").not.toBeNull();
  return { width: Number(match![3]), height: Number(match![4]) };
}

describe("KithPay logo — smoke mock", () => {
  it("keeps vector logo binaries on disk, with no embedded raster", () => {
    for (const rel of Object.values(LOGO_FILES)) {
      const abs = join(root, rel);
      expect(existsSync(abs), rel).toBe(true);
      expect(statSync(abs).size).toBeGreaterThan(8_000);
      const svg = readFileSync(abs, "utf8");
      expect(svg).toMatch(/<svg[\s\S]*<\/svg>/);
      expect(svg).toMatch(/<title[^>]*>KithPay<\/title>/);
      expect(svg).toMatch(/fill="none"/);
      expect(svg).toMatch(/id="blueBody"/);
      expect(svg).toMatch(/id="greenRib"/);
      expect(svg).toMatch(/id="motion"/);
      expect(svg).toMatch(/stop-opacity="0"/);
      expect(svg).toMatch(/fill="#ffffff"/);
      expect(svg).toMatch(/fill="url\(#blueBody\)"/);
      expect(svg).toMatch(/fill="url\(#greenRib\)"/);
      expect(svg).not.toMatch(/<image[\s>]/);
      expect(svg).not.toMatch(/data:image/);
      expect(svg).not.toMatch(/lucide/i);
    }
  });

  it("splits the full wordmark from the icon-only mark", () => {
    const full = readRepo(LOGO_FILES.full);
    const mark = readRepo(LOGO_FILES.mark);
    const fullBox = viewBoxSize(full);
    const markBox = viewBoxSize(mark);

    expect(fullBox.width).toBeGreaterThan(markBox.width + 200);
    expect(full).toMatch(/fill="url\(#navy\)"/);
    expect(full).toMatch(/fill="url\(#pay\)"/);
    expect(full).toMatch(/id="navy"/);
    expect(full).toMatch(/id="pay"/);
    expect(mark).not.toMatch(/fill="url\(#navy\)"/);
    expect(mark).not.toMatch(/fill="url\(#pay\)"/);
    expect(statSync(join(root, LOGO_FILES.full)).size).toBeGreaterThan(
      statSync(join(root, LOGO_FILES.mark)).size,
    );
  });

  it("renders the full logo and the mark from the component", () => {
    const full = renderToStaticMarkup(<KithPayLogo />);
    expect(full).toMatch(/src="\/brand\/kithpay-logo\.svg"/);
    expect(full).toMatch(/alt="KithPay"/);
    expect(full).toMatch(/width="320"/);
    expect(full).not.toMatch(/kithpay-mark\.svg/);

    const mark = renderToStaticMarkup(<KithPayLogo variant="mark" className="brand-mark" />);
    expect(mark).toMatch(/src="\/brand\/kithpay-mark\.svg"/);
    expect(mark).toMatch(/alt="KithPay"/);
    expect(mark).toMatch(/width="72"/);
    expect(mark).toMatch(/class="brand-mark"/);

    const sized = renderToStaticMarkup(<KithPayLogo width={120} height={40} />);
    expect(sized).toMatch(/width="120"/);
    expect(sized).toMatch(/height="40"/);
    expect(sized).toMatch(/src="\/brand\/kithpay-logo\.svg"/);
  });

  it("wires KithPayLogo to the public brand files only", () => {
    const source = readRepo("src/components/KithPayLogo.tsx");
    expect(source).toMatch(/\/brand\/kithpay-logo\.svg/);
    expect(source).toMatch(/\/brand\/kithpay-mark\.svg/);
    expect(source).toMatch(/variant\?: "full" \| "mark"/);
    expect(source).not.toMatch(/lucide/i);
    expect(source).not.toMatch(/emoji/);
  });
});
