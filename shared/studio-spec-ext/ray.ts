// ray-lab@1 — Ray Lab (VALUES-100 V3.1: light travels in straight lines, reflection, plane mirrors, periscope and
// pinhole camera; c7-sci ch11-t01/t03/t04, c6-sci ch11 light-sources overlap).
//   mirror  — a torch shines along a grid; tap cells to stand a plane mirror (/ or \) and FIRE: the beam turns 90° at
//             each mirror, stops at walls, and must reach the target (a periscope is a mirror round with walls)
//   angle   — rotate one mirror on a pivot so the reflected ray hits the target; the protractor then shows that the
//             angle of incidence equals the angle of reflection
//   pinhole — slide the screen of a pinhole camera until the (upside-down) image is the asked height
// Truth: grid ray tracing, the law of reflection, and similar triangles, all computed here.
import { z } from "zod";
import { EnvelopeExt, MARKUP, TargetsField, UNGRADED, arr, envelope, isObj, num, oneOf, reqStr, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

const RL_STRINGS = { round: "Round", done: "right", fire: "FIRE", lock: "LOCK", mirrors: "mirrors", target: "target", tapCell: "Tap a cell to stand a mirror", rotate: "Drag the mirror to turn it", incidence: "i", reflection: "r", screen: "screen", image: "image", object: "candle", height: "height", runDone: "Lab closed", hit: "HIT", miss: "MISSED", inverted: "upside down" };
const Cell = z.tuple([z.number().int().min(0).max(11), z.number().int().min(0).max(7)]);
const RlRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("mirror"), title: z.string().min(1).max(22), sub: z.string().max(40), w: z.number().int().min(4).max(10), h: z.number().int().min(3).max(6), source: Cell, dir: z.enum(["E", "N", "W", "S"]), target: Cell, walls: z.array(Cell).max(30), maxMirrors: z.number().int().min(1).max(4), ...TargetsField }),
  z.object({ mode: z.literal("angle"), title: z.string().min(1).max(22), sub: z.string().max(40), laser: z.tuple([z.number().min(150).max(700), z.number().min(190).max(560)]), pivot: z.tuple([z.number().min(150).max(700), z.number().min(190).max(560)]), goal: z.tuple([z.number().min(150).max(700), z.number().min(190).max(560)]), tol: z.number().min(8).max(30), ...TargetsField }),
  z.object({ mode: z.literal("pinhole"), title: z.string().min(1).max(22), sub: z.string().max(40), objH: z.number().min(4).max(30), objD: z.number().min(10).max(60), imgH: z.number().min(1).max(20), tol: z.number().min(0.2).max(2), ...TargetsField }),
]);
export type RlRoundT = z.infer<typeof RlRound>;
export const RaySchema = z.object({ archetype: z.literal("ray-lab@1"), ...EnvelopeExt, strings: stringsSchema(RL_STRINGS, 40), title: z.string().min(1).max(36), rounds: z.array(RlRound).min(1).max(4) });
export type RaySpec = z.infer<typeof RaySchema>;
type MirrorRd = Extract<RlRoundT, { mode: "mirror" }>;

const DV: Record<string, [number, number]> = { E: [1, 0], N: [0, -1], W: [-1, 0], S: [0, 1] };
export type Mirrors = Record<string, "/" | "\\">;
/** trace the beam cell by cell; "/" turns E→N, N→E, W→S, S→W; "\" turns E→S, S→E, W→N, N→W */
export function traceBeam(rd: MirrorRd, mirrors: Mirrors): { path: [number, number][]; hit: boolean } {
  const walls = new Set(rd.walls.map((c) => c.join(","))); let [x, y] = rd.source, [dx, dy] = DV[rd.dir]; const path: [number, number][] = [[x, y]];
  for (let i = 0; i < 80; i++) {
    x += dx; y += dy; if (x < 0 || y < 0 || x >= rd.w || y >= rd.h || walls.has(x + "," + y)) { path.push([x, y]); return { path, hit: false }; }
    path.push([x, y]); if (x === rd.target[0] && y === rd.target[1]) return { path, hit: true };
    const m = mirrors[x + "," + y]; if (m === "/") [dx, dy] = [-dy, -dx]; else if (m === "\\") [dx, dy] = [dy, dx];
  }
  return { path, hit: false };
}
/** fewest mirrors that bring the beam to the target (DFS along the beam), or null */
export function mirrorPlan(rd: MirrorRd, cap = 4): Mirrors | null {
  const walls = new Set(rd.walls.map((c) => c.join(",")));
  let best: Mirrors | null = null;
  const go = (x: number, y: number, dx: number, dy: number, used: Mirrors, n: number, depth: number) => {
    if (best && Object.keys(best).length <= n) return;
    for (let s = 0; s < 40; s++) {
      x += dx; y += dy; const k = x + "," + y;
      if (x < 0 || y < 0 || x >= rd.w || y >= rd.h || walls.has(k)) return;
      if (x === rd.target[0] && y === rd.target[1]) { best = { ...used }; return; }
      if (used[k]) { const m = used[k]; [dx, dy] = m === "/" ? [-dy, -dx] : [dy, dx]; continue; }
      if (n < cap && depth < 12 && !(x === rd.source[0] && y === rd.source[1])) for (const m of ["/", "\\"] as const) { const [ndx, ndy] = m === "/" ? [-dy, -dx] : [dy, dx]; go(x, y, ndx, ndy, { ...used, [k]: m }, n + 1, depth + 1); }
    }
  };
  const [dx, dy] = DV[rd.dir]; go(rd.source[0], rd.source[1], dx, dy, {}, 0, 0);
  return best;
}
/** reflect the laser off a mirror at the pivot with surface angle `deg` (degrees, screen space); returns the reflected direction */
export function reflectDir(rd: Extract<RlRoundT, { mode: "angle" }>, deg: number): [number, number] {
  const ix = rd.pivot[0] - rd.laser[0], iy = rd.pivot[1] - rd.laser[1], L = Math.hypot(ix, iy) || 1, dx = ix / L, dy = iy / L;
  const nx = -Math.sin((deg * Math.PI) / 180), ny = Math.cos((deg * Math.PI) / 180), d = dx * nx + dy * ny;
  return [dx - 2 * d * nx, dy - 2 * d * ny];
}
/** distance from the goal to the reflected ray (Infinity when the goal is behind the mirror or the light hits its back) */
export function rayMiss(rd: Extract<RlRoundT, { mode: "angle" }>, deg: number): number {
  const [rx, ry] = reflectDir(rd, deg), gx = rd.goal[0] - rd.pivot[0], gy = rd.goal[1] - rd.pivot[1], t = gx * rx + gy * ry;
  if (t <= 0) return Infinity;
  return Math.abs(gx * ry - gy * rx);
}
/** the mirror angle that sends the light exactly to the goal: the surface is perpendicular to the bisector of the reversed incoming ray and the outgoing ray */
export function angleKey(rd: Extract<RlRoundT, { mode: "angle" }>): number {
  const a = [rd.laser[0] - rd.pivot[0], rd.laser[1] - rd.pivot[1]], b = [rd.goal[0] - rd.pivot[0], rd.goal[1] - rd.pivot[1]], la = Math.hypot(a[0], a[1]), lb = Math.hypot(b[0], b[1]);
  const nx = a[0] / la + b[0] / lb, ny = a[1] / la + b[1] / lb; // the normal
  return ((Math.atan2(ny, nx) * 180) / Math.PI - 90 + 360) % 180;
}
export const pinholeKey = (rd: Extract<RlRoundT, { mode: "pinhole" }>) => (rd.imgH * rd.objD) / rd.objH;
export const PIN_MAX = 40;

const rlDefault: RaySpec = {
  archetype: "ray-lab@1", skills: ["c7-science-ch11-t03", "c7-science-ch11-t04"], lang: "en", strings: { ...RL_STRINGS }, title: "Ray Lab",
  rounds: [
    { mode: "mirror", title: "Periscope", sub: "see over the wall: 2 mirrors", w: 7, h: 6, source: [0, 5], dir: "E", target: [6, 0], walls: [[4, 5], [4, 4], [4, 3], [5, 3], [6, 3]], maxMirrors: 2, targets: "c7-science-ch11-t04-m1" },
    { mode: "angle", title: "Bounce it", sub: "turn the mirror to hit the target", laser: [180, 230], pivot: [430, 470], goal: [660, 240], tol: 14 },
    { mode: "pinhole", title: "Pinhole camera", sub: "make the image 6 cm tall", objH: 15, objD: 40, imgH: 6, tol: 0.6 },
  ],
};
function cell(v: unknown, rd: { w: number; h: number }): [number, number] | null { return Array.isArray(v) && v.length === 2 && Number.isInteger(v[0]) && Number.isInteger(v[1]) && v[0] >= 0 && v[1] >= 0 && v[0] < rd.w && v[1] < rd.h ? [v[0], v[1]] : null; }
const pt = (v: unknown, dflt: [number, number]): [number, number] => (Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === "number" && Number.isFinite(n)) ? [Math.min(700, Math.max(150, v[0])), Math.min(560, Math.max(190, v[1]))] : dflt);
function repairRay(raw: Record<string, unknown>, r: string[]): RaySpec | null {
  const env = envelope(raw, rlDefault, r);
  const rounds: RlRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Light", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["mirror", "angle", "pinhole"] as const, "mirror", "mode", r);
    if (mode === "mirror") {
      const size = { w: num(x.w, 4, 10, 7, "w", r, true), h: num(x.h, 3, 6, 5, "h", r, true) }, source = cell(x.source, size), target = cell(x.target, size);
      if (!source || !target || (source[0] === target[0] && source[1] === target[1])) { r.push("mirror:cells"); continue; }
      const walls = arr(x.walls, "walls", r).map((c) => cell(c, size)).filter((c): c is [number, number] => !!c && !(c[0] === source[0] && c[1] === source[1]) && !(c[0] === target[0] && c[1] === target[1])).slice(0, 30);
      const rd: MirrorRd = { mode, ...head, ...size, source, dir: oneOf(x.dir, ["E", "N", "W", "S"] as const, "E", "dir", r), target, walls, maxMirrors: num(x.maxMirrors, 1, 4, 2, "maxMirrors", r, true) };
      const plan = mirrorPlan(rd); if (!plan) { r.push("mirror:unsolvable"); continue; }
      const need = Object.keys(plan).length; if (need === 0) { r.push("mirror:already-hits"); continue; } if (need > rd.maxMirrors) rd.maxMirrors = need;
      rounds.push(rd);
    } else if (mode === "angle") {
      const rd = { mode, ...head, laser: pt(x.laser, [180, 230]), pivot: pt(x.pivot, [430, 470]), goal: pt(x.goal, [660, 240]), tol: num(x.tol, 8, 30, 14, "tol", r) } as Extract<RlRoundT, { mode: "angle" }>;
      if (Math.hypot(rd.laser[0] - rd.pivot[0], rd.laser[1] - rd.pivot[1]) < 120 || Math.hypot(rd.goal[0] - rd.pivot[0], rd.goal[1] - rd.pivot[1]) < 120) { r.push("angle:too-close"); continue; }
      if (!(rayMiss(rd, angleKey(rd)) < 1)) { r.push("angle:no-solution"); continue; }
      rounds.push(rd);
    } else {
      const rd = { mode, ...head, objH: num(x.objH, 4, 30, 15, "objH", r), objD: num(x.objD, 10, 60, 40, "objD", r), imgH: num(x.imgH, 1, 20, 6, "imgH", r), tol: num(x.tol, 0.2, 2, 0.6, "tol", r) } as Extract<RlRoundT, { mode: "pinhole" }>;
      const k = pinholeKey(rd); if (k < 4 || k > PIN_MAX - 2) { r.push("pinhole:screen-out-of-box"); continue; }
      rounds.push(rd);
    }
  }
  if (!rounds.length) return null;
  return { archetype: "ray-lab@1", ...env, strings: strings(raw.strings, RL_STRINGS, 40, r), title: reqStr(raw.title, 36, "title", r) ?? "Ray Lab", rounds };
}
function gradeRay(spec: RaySpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const v = isObj(value) ? value : {};
  if (rd.mode === "mirror") {
    const ms: Mirrors = {}; if (isObj(v.mirrors)) for (const [k, s] of Object.entries(v.mirrors)) if (/^\d{1,2},\d{1,2}$/.test(k) && (s === "/" || s === "\\")) ms[k] = s;
    const n = Object.keys(ms).length, t = traceBeam(rd, ms), plan = mirrorPlan(rd) ?? {};
    return { verdict: t.hit && n <= rd.maxMirrors ? "right" : t.hit ? "partial" : "wrong", truth: plan, detail: t.hit ? `${n} mirrors` : "missed" };
  }
  if (rd.mode === "angle") { const deg = Number(v.angle); if (!Number.isFinite(deg)) return { verdict: "wrong", truth: +angleKey(rd).toFixed(1), detail: "no-value" }; const miss = rayMiss(rd, deg); return { verdict: miss <= rd.tol ? "right" : miss <= rd.tol * 3 ? "partial" : "wrong", truth: +angleKey(rd).toFixed(1), error: Number.isFinite(miss) ? +miss.toFixed(1) : undefined }; }
  const d = Number(v.screen), key = pinholeKey(rd); if (!Number.isFinite(d)) return { verdict: "wrong", truth: +key.toFixed(1), detail: "no-value" };
  const img = (rd.objH * d) / rd.objD, e = Math.abs(img - rd.imgH);
  return { verdict: e <= rd.tol ? "right" : e <= rd.tol * 2.5 ? "partial" : "wrong", truth: +key.toFixed(1), error: +e.toFixed(2), detail: `${img.toFixed(1)} cm` };
}
function keysRay(spec: RaySpec) {
  return spec.rounds.map((rd, k) => ({ itemId: `r${k + 1}`, key: rd.mode === "mirror" ? Object.entries(mirrorPlan(rd) ?? {}).map(([c, s]) => `${s}@${c}`).join(" ") : rd.mode === "angle" ? `${angleKey(rd).toFixed(1)}°` : `screen at ${pinholeKey(rd).toFixed(1)} cm`, prompt: rd.sub || rd.title }));
}
export const rayDef: ExtSpecDef<RaySpec> = {
  archetype: "ray-lab@1", title: "Ray Lab", kind: "simulation", subjects: ["science"],
  act: "stand plane mirrors on a grid and fire a beam that must reach a target round walls (periscopes), turn a pivoted mirror until the reflected ray hits a target and read i = r on the protractor, slide a pinhole camera's screen until the inverted image is the asked height",
  outcomes: { classes: [7], subjects: ["science"], topics: ["c7-science-ch11-t03", "c7-science-ch11-t04", "c7-science-ch11-t01"], misconceptions: [] },
  schema: RaySchema as unknown as z.ZodType<RaySpec>, defaultSpec: rlDefault, repair: repairRay, grade: gradeRay, keys: keysRay,
};
