import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  HERO_GRID_DEPTH,
  HERO_GRID_EDGE_BAND,
  HERO_GRID_FOCAL_LENGTH,
  HERO_GRID_MAX_CHORD,
  HERO_GRID_MAX_GAP,
  insertStop,
  perspectiveLineWidth,
  projectGridPoint,
  projectedPolyline,
  sealLattice,
  sealSourceStops,
  type GridProjection,
} from "./hero-grid";

const viewport: Pick<GridProjection, "width" | "height" | "edgeBand"> = {
  width: 1000,
  height: 600,
  edgeBand: 0.22,
};

describe("hero perspective grid", () => {
  it("shrinks cells at the focus and keeps outer cells larger", () => {
    const focus = { x: 500, y: 280 };
    const projection: GridProjection = { depth: 520, radius: 700, focalLength: 640, ...viewport };
    const nearA = projectGridPoint({ x: 500, y: 250 }, focus, projection);
    const nearB = projectGridPoint({ x: 556, y: 250 }, focus, projection);
    const farA = projectGridPoint({ x: 180, y: 250 }, focus, projection);
    const farB = projectGridPoint({ x: 236, y: 250 }, focus, projection);
    const nearGap = Math.hypot(nearB.x - nearA.x, nearB.y - nearA.y);
    const farGap = Math.hypot(farB.x - farA.x, farB.y - farA.y);

    expect(nearGap).toBeLessThan(56);
    expect(farGap).toBeGreaterThan(nearGap);
  });

  it("pulls the plane inward toward the focus", () => {
    const focus = { x: 500, y: 280 };
    const point = { x: 680, y: 280 };
    const projected = projectGridPoint(point, focus, {
      depth: 520,
      radius: 700,
      focalLength: 640,
      ...viewport,
    });

    expect(projected.x).toBeGreaterThan(focus.x);
    expect(projected.x).toBeLessThan(point.x);
    expect(projected.y).toBeCloseTo(focus.y, 4);
  });

  it("pins the hero frame so the grid still fills the section", () => {
    const focus = { x: 720, y: 180 };
    const projection: GridProjection = { depth: 520, radius: 800, focalLength: 640, ...viewport };
    expect(projectGridPoint({ x: 0, y: 240 }, focus, projection)).toEqual({ x: 0, y: 240 });
    expect(projectGridPoint({ x: 1000, y: 240 }, focus, projection)).toEqual({ x: 1000, y: 240 });
  });

  it("splits a stretched span until each screen gap is sealed", () => {
    const stops = sealSourceStops(0, 80, (left, right) => (right - left) * 3, 30);
    expect(stops[0]).toBe(0);
    expect(stops[stops.length - 1]).toBe(80);
    expect(stops.length).toBeGreaterThan(2);
    for (let i = 1; i < stops.length; i++) {
      expect((stops[i] - stops[i - 1]) * 3).toBeLessThanOrEqual(30);
    }
  });

  it("leaves a span alone when it is already tight", () => {
    expect(sealSourceStops(0, 40, () => 10, HERO_GRID_MAX_GAP)).toEqual([0, 40]);
  });

  it("keeps the hero frame in the lattice", () => {
    expect(insertStop([0, 80], 0)).toEqual([0, 80]);
    expect(insertStop([0, 80], 40)).toEqual([0, 40, 80]);
  });

  it("breaks long chords so a bend cannot open a gap", () => {
    const points = projectedPolyline({ x: 0, y: 0 }, { x: 100, y: 0 }, (point) => point, HERO_GRID_MAX_CHORD);
    expect(points.length).toBeGreaterThan(2);
    for (let i = 1; i < points.length; i++) {
      const gap = Math.hypot(points[i].screen.x - points[i - 1].screen.x, points[i].screen.y - points[i - 1].screen.y);
      expect(gap).toBeLessThanOrEqual(HERO_GRID_MAX_CHORD);
    }
  });

  it("seals the rim without closing the well", () => {
    const width = 1000;
    const height = 600;
    const focus = { x: 220, y: 180 };
    const projection: GridProjection = {
      depth: HERO_GRID_DEPTH,
      radius: Math.hypot(width, height) * 0.9,
      focalLength: HERO_GRID_FOCAL_LENGTH,
      width,
      height,
      edgeBand: HERO_GRID_EDGE_BAND,
    };
    const gapAt = (left: number, right: number) => {
      let max = 0;
      for (let i = 0; i <= 5; i++) {
        const y = (height * i) / 5;
        const a = projectGridPoint({ x: left, y }, focus, projection);
        const b = projectGridPoint({ x: right, y }, focus, projection);
        max = Math.max(max, Math.hypot(b.x - a.x, b.y - a.y));
      }
      return max;
    };
    const base: number[] = [];
    for (let x = -56; x <= width + 56; x += 56) base.push(x);
    const stops = sealLattice(base, gapAt, HERO_GRID_MAX_GAP);
    let maxGap = 0;
    let focusGap = Number.POSITIVE_INFINITY;
    let edgeGap = 0;
    for (let i = 1; i < stops.length; i++) {
      const gap = gapAt(stops[i - 1], stops[i]);
      const mid = (stops[i - 1] + stops[i]) / 2;
      maxGap = Math.max(maxGap, gap);
      if (Math.abs(mid - focus.x) < 70) focusGap = Math.min(focusGap, gap);
      if (mid > width - 90) edgeGap = Math.max(edgeGap, gap);
    }
    expect(maxGap).toBeLessThanOrEqual(HERO_GRID_MAX_GAP);
    expect(focusGap).toBeLessThan(edgeGap);
  });

  it("gives nearer cells a heavier stroke than cells packed at the focus", () => {
    expect(perspectiveLineWidth(28, 56)).toBeGreaterThan(perspectiveLineWidth(28, 14));
    expect(perspectiveLineWidth(28, 14)).toBeLessThan(1.2);
    expect(perspectiveLineWidth(28, 56)).toBeGreaterThan(2);
  });

  it("stays flat when depth is disabled", () => {
    const point = { x: 120, y: 80 };
    const projected = projectGridPoint(point, { x: 40, y: 40 }, {
      depth: 0,
      radius: 400,
      focalLength: 640,
      ...viewport,
    });
    expect(projected).toEqual(point);
  });

  it("draws the perspective grid behind the hero copy", () => {
    const source = readFileSync(join(process.cwd(), "src/routes/index.tsx"), "utf8");
    const hero = source.slice(source.indexOf("function Hero"), source.indexOf("function TrustBand"));
    expect(hero).toContain("<HeroPerspectiveGrid />");
    expect(hero.indexOf("<HeroPerspectiveGrid />")).toBeLessThan(hero.indexOf("Respect the rules."));
    expect(hero).not.toContain("background-size:56px_56px");
  });
});
