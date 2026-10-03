// geoboard@1 v1 slice — area and perimeter on a square grid by shading unit squares (maths M07).
// Area = shaded squares; perimeter = unit edges between a shaded square and an unshaded one (or the edge).
import { clampInt, numbersFrom } from "../kit/math.ts";

export type Mode = "build" | "measure" | "contrast";
export type Cell = string; // "x,y"

export interface GeoConfig {
  mode: Mode;
  w: number;
  h: number;
  area: number | null;
  perimeter: number | null;
  ask: "area" | "perimeter";
  contrast: "same_area" | "same_perimeter";
  shape: Set<Cell>;
  hideAnswer: boolean;
  issues: string[];
  error: string | null;
}

export const cellKey = (x: number, y: number): Cell => `${x},${y}`;
const parse = (k: Cell) => k.split(",").map(Number) as [number, number];

export function area(cells: Set<Cell>): number {
  return cells.size;
}

export function perimeter(cells: Set<Cell>): number {
  let p = 0;
  for (const k of cells) {
    const [x, y] = parse(k);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!cells.has(cellKey(x + dx, y + dy))) p++;
  }
  return p;
}

export function connected(cells: Set<Cell>): boolean {
  if (cells.size === 0) return false;
  const [first] = cells;
  const seen = new Set([first]);
  const stack = [first];
  while (stack.length) {
    const [x, y] = parse(stack.pop()!);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = cellKey(x + dx, y + dy);
      if (cells.has(k) && !seen.has(k)) {
        seen.add(k);
        stack.push(k);
      }
    }
  }
  return seen.size === cells.size;
}

/** "rect:3x2" (at the top-left) or [[x, y], …]. */
export function parseShape(v: unknown, w: number, h: number): Set<Cell> | null {
  const out = new Set<Cell>();
  if (typeof v === "string") {
    const m = v.match(/^rect:(\d+)x(\d+)$/);
    if (!m) return null;
    const rw = Number(m[1]);
    const rh = Number(m[2]);
    if (rw > w || rh > h) return null;
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) out.add(cellKey(x, y));
    return out;
  }
  if (!Array.isArray(v)) return null;
  for (const c of v) {
    if (!Array.isArray(c) || !Number.isInteger(c[0]) || !Number.isInteger(c[1]) || c[0] < 0 || c[1] < 0 || c[0] >= w || c[1] >= h) return null;
    out.add(cellKey(c[0], c[1]));
  }
  return out;
}

export function normalize(p: Record<string, unknown>, hit = 48): GeoConfig {
  const issues: string[] = [];
  const nums = numbersFrom(p.numbers).filter((x) => Number.isInteger(x) && x > 0);
  const maxW = Math.max(3, Math.floor(320 / hit));
  let w = clampInt(p.w, 2, 12, maxW);
  if (w > maxW) {
    issues.push(`w: ${w} columns would make squares smaller than ${hit}px at 360px; using ${maxW}`);
    w = maxW;
  }
  const h = clampInt(p.h, 2, 8, 6);
  let mode: Mode = p.mode === "build" || p.mode === "measure" || p.mode === "contrast" ? p.mode : "build";
  const shapeRaw = p.cells ?? p.shape;
  const shapeIn = shapeRaw !== undefined ? parseShape(shapeRaw, w, h) : null;
  if (shapeRaw !== undefined && !shapeIn) issues.push(`shape: ${JSON.stringify(shapeRaw)} is not 'rect:WxH' or cells inside the ${w}×${h} grid`);
  if ((p.mode === "show" || p.mode === "predict" || p.mode === undefined) && shapeIn) mode = "measure";
  // Generic: two numbers = a rectangle to measure (length, breadth) if it fits; one number = build that area.
  let shape = shapeIn ?? new Set<Cell>();
  if (!shapeIn && mode !== "build" && nums.length >= 2 && nums[0] <= w && nums[1] <= h) shape = parseShape(`rect:${nums[0]}x${nums[1]}`, w, h)!;
  if (!shapeIn && (p.mode === "show" || p.mode === "predict" || p.mode === undefined) && nums.length >= 2 && nums[0] <= w && nums[1] <= h) {
    mode = "measure";
    shape = parseShape(`rect:${nums[0]}x${nums[1]}`, w, h)!;
  }
  const areaT = typeof p.area === "number" ? clampInt(p.area, 1, w * h, 6) : mode === "build" && typeof p.perimeter !== "number" ? (nums[0] && nums[0] <= w * h ? nums[0] : 6) : null;
  const perimT = typeof p.perimeter === "number" ? clampInt(p.perimeter, 4, 2 * (w * h) + 2, 12) : null;
  let error: string | null = null;
  if (mode === "build" && areaT !== null && perimT !== null && !buildable(w, h, areaT, perimT)) error = `no shape on a ${w}×${h} grid has area ${areaT} and perimeter ${perimT}`;
  if ((mode === "measure" || mode === "contrast") && shape.size === 0) error = `${mode} needs a shape`;
  if (shape.size && !connected(shape)) error = "shape must be one connected piece";
  return {
    mode,
    w,
    h,
    area: areaT,
    perimeter: perimT,
    ask: p.ask === "perimeter" ? "perimeter" : "area",
    contrast: p.contrast === "same_perimeter" ? "same_perimeter" : "same_area",
    shape,
    hideAnswer: p.mode === "predict" || p.predict === true,
    issues,
    error,
  };
}

/**
 * Construct a shape with area a and perimeter p inside w×h, or null. Shapes tried: a block of r rows × c
 * columns filled row by row (perimeter 2(r+c) whatever the last row's length) plus a tail of t squares
 * extending the top row to the right (+2 per square). This is also the engine's golden "solve" script.
 * Conservative: a target it cannot construct is reported unreachable even if some other shape exists.
 */
export function construct(w: number, h: number, a: number, p: number): Set<Cell> | null {
  if (a < 1 || a > w * h || p % 2) return null;
  for (let t = 0; t < a; t++)
    for (let c = 1; c + t <= w; c++) {
      const block = a - t;
      const r = Math.ceil(block / c);
      if (r > h || (r === 1 && block !== c) || (t > 0 && block < c)) continue;
      if (2 * (r + c) + 2 * t !== p) continue;
      const out = new Set<Cell>();
      for (let i = 0; i < block; i++) out.add(cellKey(i % c, Math.floor(i / c)));
      for (let i = 0; i < t; i++) out.add(cellKey(c + i, 0));
      return out;
    }
  return null;
}
export const buildable = (w: number, h: number, a: number, p: number) => construct(w, h, a, p) !== null;

export function buildCorrect(c: Pick<GeoConfig, "area" | "perimeter">, cells: Set<Cell>): boolean {
  if (!connected(cells)) return false;
  return (c.area === null || area(cells) === c.area) && (c.perimeter === null || perimeter(cells) === c.perimeter);
}

export function measureCorrect(c: Pick<GeoConfig, "ask" | "shape">, entry: string): boolean {
  const v = Number(entry);
  return /^\d+$/.test(entry) && v === (c.ask === "area" ? area(c.shape) : perimeter(c.shape));
}
/** AREA_PERIM_SWAP: the other measure was given. */
export function measureMisc(c: Pick<GeoConfig, "ask" | "shape">, entry: string): string | null {
  const v = Number(entry);
  if (measureCorrect(c, entry)) return null;
  const other = c.ask === "area" ? perimeter(c.shape) : area(c.shape);
  return v === other ? "area_perimeter_swap" : null;
}

export function contrastCorrect(c: Pick<GeoConfig, "contrast" | "shape">, cells: Set<Cell>): boolean {
  if (!connected(cells)) return false;
  return c.contrast === "same_area"
    ? area(cells) === area(c.shape) && perimeter(cells) !== perimeter(c.shape)
    : perimeter(cells) === perimeter(c.shape) && area(cells) !== area(c.shape);
}

/** A shape meeting the build goal (the golden script and the reveal), or null. */
export function solveBuild(c: Pick<GeoConfig, "w" | "h" | "area" | "perimeter">): Set<Cell> | null {
  if (c.area !== null && c.perimeter !== null) return construct(c.w, c.h, c.area, c.perimeter);
  if (c.area !== null) {
    for (let p = 4; p <= 2 * c.area + 2; p += 2) {
      const s = construct(c.w, c.h, c.area, p);
      if (s) return s;
    }
    return null;
  }
  if (c.perimeter !== null) {
    for (let a = 1; a <= c.w * c.h; a++) {
      const s = construct(c.w, c.h, a, c.perimeter);
      if (s) return s;
    }
  }
  return null;
}
