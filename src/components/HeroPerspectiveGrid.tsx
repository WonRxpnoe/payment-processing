import { useEffect, useRef } from "react";
import {
  HERO_GRID_DEPTH,
  HERO_GRID_EDGE_BAND,
  HERO_GRID_FOCAL_LENGTH,
  HERO_GRID_MAX_CHORD,
  HERO_GRID_MAX_GAP,
  HERO_GRID_SPACING,
  insertStop,
  perspectiveLineWidth,
  projectGridPoint,
  projectedPolyline,
  sealLattice,
  type GridPoint,
  type GridProjection,
} from "../lib/hero-grid";

const REST_X = 0.5;
const REST_Y = 0.38;
const FOLLOW = 0.072;

export function HeroPerspectiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.parentElement;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const focus = { x: REST_X, y: REST_Y };
    const target = { x: REST_X, y: REST_Y };
    let frame = 0;
    let alive = true;

    const paint = () => {
      const rect = section.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width < 1 || height < 1) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bitmapWidth = Math.round(width * dpr);
      const bitmapHeight = Math.round(height * dpr);
      if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
        canvas.width = bitmapWidth;
        canvas.height = bitmapHeight;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = getComputedStyle(canvas).color;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      const projection: GridProjection = {
        depth: motion.matches ? 0 : HERO_GRID_DEPTH,
        radius: Math.hypot(width, height) * 0.9,
        focalLength: HERO_GRID_FOCAL_LENGTH,
        width,
        height,
        edgeBand: HERO_GRID_EDGE_BAND,
      };
      const origin = { x: focus.x * width, y: focus.y * height };
      const xStart = -HERO_GRID_SPACING;
      const yStart = -HERO_GRID_SPACING;
      const xEnd = width + HERO_GRID_SPACING;
      const yEnd = height + HERO_GRID_SPACING;
      const project = (point: GridPoint) => projectGridPoint(point, origin, projection);
      const layers = new Map<number, number[]>();

      const pushSegment = (ax: number, ay: number, bx: number, by: number, sourceGap: number) => {
        const screenGap = Math.hypot(bx - ax, by - ay);
        if (screenGap < 0.4) return;
        const widthKey = Math.round(perspectiveLineWidth(sourceGap, screenGap) * 4) / 4;
        const bucket = layers.get(widthKey);
        if (bucket) bucket.push(ax, ay, bx, by);
        else layers.set(widthKey, [ax, ay, bx, by]);
      };

      const trace = (samples: ReturnType<typeof projectedPolyline>) => {
        for (let i = 1; i < samples.length; i++) {
          const previous = samples[i - 1];
          const next = samples[i];
          const sourceGap = Math.hypot(next.source.x - previous.source.x, next.source.y - previous.source.y);
          pushSegment(previous.screen.x, previous.screen.y, next.screen.x, next.screen.y, sourceGap);
        }
      };

      const screenGap = (axis: "x" | "y", left: number, right: number) => {
        let max = 0;
        const span = axis === "x" ? height : width;
        for (let i = 0; i <= 6; i++) {
          const along = (span * i) / 6;
          const a = axis === "x" ? project({ x: left, y: along }) : project({ x: along, y: left });
          const b = axis === "x" ? project({ x: right, y: along }) : project({ x: along, y: right });
          max = Math.max(max, Math.hypot(b.x - a.x, b.y - a.y));
        }
        return max;
      };

      const lattice = (start: number, end: number, frame: number, axis: "x" | "y") => {
        const stops: number[] = [];
        for (let value = start; value <= end + 0.1; value += HERO_GRID_SPACING) stops.push(value);
        const sealed = projection.depth === 0 ? stops : sealLattice(stops, (left, right) => screenGap(axis, left, right), HERO_GRID_MAX_GAP);
        return insertStop(insertStop(sealed, 0), frame);
      };

      const xStops = lattice(xStart, xEnd, width, "x");
      const yStops = lattice(yStart, yEnd, height, "y");

      for (const x of xStops) {
        trace(projectedPolyline({ x, y: yStart }, { x, y: yEnd }, project, HERO_GRID_MAX_CHORD));
      }
      for (const y of yStops) {
        trace(projectedPolyline({ x: xStart, y }, { x: xEnd, y }, project, HERO_GRID_MAX_CHORD));
      }

      for (const [widthKey, segments] of layers) {
        ctx.save();
        ctx.globalAlpha = 0.38;
        ctx.lineWidth = widthKey + 1.2;
        ctx.beginPath();
        for (let i = 0; i < segments.length; i += 4) {
          ctx.moveTo(segments[i], segments[i + 1]);
          ctx.lineTo(segments[i + 2], segments[i + 3]);
        }
        ctx.stroke();
        ctx.restore();

        ctx.lineWidth = widthKey;
        ctx.beginPath();
        for (let i = 0; i < segments.length; i += 4) {
          ctx.moveTo(segments[i], segments[i + 1]);
          ctx.lineTo(segments[i + 2], segments[i + 3]);
        }
        ctx.stroke();
      }
    };

    const tick = () => {
      if (!alive) return;
      focus.x += (target.x - focus.x) * FOLLOW;
      focus.y += (target.y - focus.y) * FOLLOW;
      paint();
      const dx = target.x - focus.x;
      const dy = target.y - focus.y;
      if (dx * dx + dy * dy > 1e-7) frame = requestAnimationFrame(tick);
      else {
        focus.x = target.x;
        focus.y = target.y;
        paint();
        frame = 0;
      }
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (motion.matches || event.pointerType === "touch") return;
      const rect = section.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      target.x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      target.y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      wake();
    };

    const onPointerLeave = () => {
      target.x = REST_X;
      target.y = REST_Y;
      wake();
    };

    const onMotionChange = () => {
      paint();
    };

    const observer = new ResizeObserver(() => {
      paint();
    });
    observer.observe(section);
    section.addEventListener("pointermove", onPointerMove);
    section.addEventListener("pointerleave", onPointerLeave);
    motion.addEventListener("change", onMotionChange);
    paint();

    return () => {
      alive = false;
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
      motion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-border opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_78%)]"
    />
  );
}
