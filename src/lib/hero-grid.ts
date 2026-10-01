export type GridPoint = {
  x: number;
  y: number;
};

export type GridProjection = {
  depth: number;
  radius: number;
  focalLength: number;
  width: number;
  height: number;
  edgeBand: number;
};

export const HERO_GRID_SPACING = 56;
export const HERO_GRID_DEPTH = 620;
export const HERO_GRID_FOCAL_LENGTH = 480;
export const HERO_GRID_EDGE_BAND = 0.5;
export const HERO_GRID_MAX_GAP = 72;
export const HERO_GRID_MAX_CHORD = 24;

function edgeWeight(point: GridPoint, projection: GridProjection): number {
  const { width, height, edgeBand } = projection;
  if (width <= 0 || height <= 0 || edgeBand <= 0) return 1;
  const inset = Math.min(point.x, point.y, width - point.x, height - point.y);
  const band = Math.min(width, height) * edgeBand;
  if (band <= 0) return 1;
  const t = Math.min(Math.max(inset, 0) / band, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// Sink the plane away from the camera around the focus. Scale < 1 pulls
// vertices inward, so cells shrink at the far point and stay larger outside it.
export function projectGridPoint(point: GridPoint, focus: GridPoint, projection: GridProjection): GridPoint {
  if (projection.depth === 0 || projection.focalLength <= 0) {
    return { x: point.x, y: point.y };
  }

  const dx = point.x - focus.x;
  const dy = point.y - focus.y;
  const dist = Math.hypot(dx, dy);
  const radius = projection.radius > 0 ? projection.radius : 1;
  const falloff = Math.min(dist / radius, 1);
  const influence = Math.exp(-1.55 * falloff * falloff) * edgeWeight(point, projection);
  const z = -projection.depth * influence;
  const scale = projection.focalLength / (projection.focalLength - z);

  return {
    x: focus.x + dx * scale,
    y: focus.y + dy * scale,
  };
}

// Near cells spread out on screen and take a heavier stroke. Far cells,
// packed around the focus, stay fine so the well does not turn into a blot.
export function perspectiveLineWidth(sourceGap: number, screenGap: number): number {
  if (sourceGap <= 0) return 1;
  const scale = screenGap / sourceGap;
  const t = Math.min(1, Math.max(0, (scale - 0.42) / 1.15));
  return 0.75 + t * 1.85;
}

export type ProjectedSample = {
  source: GridPoint;
  screen: GridPoint;
};

// Split a source span while its projected screen gap is still a hole.
export function sealSourceStops(
  start: number,
  end: number,
  gapAt: (left: number, right: number) => number,
  maxGap: number,
  maxLevel = 6,
): number[] {
  if (!(end > start)) return [start];
  const stops: number[] = [];
  const walk = (left: number, right: number, level: number) => {
    if (level < maxLevel && right - left > 2 && gapAt(left, right) > maxGap) {
      const mid = (left + right) / 2;
      walk(left, mid, level + 1);
      walk(mid, right, level + 1);
      return;
    }
    stops.push(left);
  };
  walk(start, end, 0);
  stops.push(end);
  return stops;
}

// Start from the regular lattice and only subdivide spans that opened a hole.
export function sealLattice(
  stops: number[],
  gapAt: (left: number, right: number) => number,
  maxGap: number,
  maxLevel = 6,
): number[] {
  if (stops.length < 2) return stops;
  const sealed: number[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const piece = sealSourceStops(stops[i], stops[i + 1], gapAt, maxGap, maxLevel);
    sealed.push(...piece.slice(0, -1));
  }
  sealed.push(stops[stops.length - 1]);
  return sealed;
}

export function insertStop(stops: number[], value: number): number[] {
  if (stops.some((stop) => Math.abs(stop - value) < 0.5)) return stops;
  return [...stops, value].sort((left, right) => left - right);
}

// Follow the curve closely enough that a straight chord cannot skip a bend.
export function projectedPolyline(
  from: GridPoint,
  to: GridPoint,
  project: (point: GridPoint) => GridPoint,
  maxChord: number,
  maxLevel = 5,
): ProjectedSample[] {
  const points: ProjectedSample[] = [];
  const walk = (a: GridPoint, b: GridPoint, level: number) => {
    const screenA = project(a);
    const screenB = project(b);
    if (level < maxLevel && Math.hypot(screenB.x - screenA.x, screenB.y - screenA.y) > maxChord) {
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      walk(a, mid, level + 1);
      walk(mid, b, level + 1);
      return;
    }
    points.push({ source: a, screen: screenA });
  };
  walk(from, to, 0);
  points.push({ source: to, screen: project(to) });
  return points;
}
